import { doc, getDoc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

export interface TokenData {
  tokens: number;
  lastClaim: number;
  followersCount: number;
}

export interface TokenTransaction {
  userId: string;
  amount: number;
  type: string;
  timestamp: number;
  previousBalance: number;
  newBalance: number;
  metadata?: any;
}

// Cache local para tokens críticos
const tokenCache = new Map<string, { data: TokenData; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

// Sistema de retry con backoff exponencial
const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.warn(`🔄 Retry ${i + 1}/${maxRetries} en ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

// Validación estricta de datos
const validateTokenData = (data: any): TokenData => {
  const tokens = typeof data?.tokens === 'number' && data.tokens >= 0 ? data.tokens : 0;
  const lastClaim = typeof data?.lastClaim === 'number' && data.lastClaim >= 0 ? data.lastClaim : 0;
  const followersCount = typeof data?.followersCount === 'number' && data.followersCount >= 0 ? data.followersCount : 0;
  
  return { tokens, lastClaim, followersCount };
};

// Logging detallado
const logTokenOperation = (operation: string, userId: string, data?: any, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`❌ [${timestamp}] TOKEN_ERROR: ${operation} - User: ${userId}`, error, data);
  } else {
    console.log(`✅ [${timestamp}] TOKEN_SUCCESS: ${operation} - User: ${userId}`, data);
  }
};

export const calculateDailyTokens = (followersCount: number): number => {
  const baseTokens = 10;
  const bonusTokens = Math.floor(followersCount / 500) * 50;
  return baseTokens + bonusTokens;
};

export const getUserTokens = async (userId: string): Promise<TokenData> => {
  // Verificar cache primero
  const cached = tokenCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logTokenOperation('CACHE_HIT', userId, cached.data);
    return cached.data;
  }
  
  return retryWithBackoff(async () => {
    try {
      const tokenDoc = await getDoc(doc(db, 'tokens', userId));
      
      if (!tokenDoc.exists()) {
        logTokenOperation('AUTO_MIGRATION_START', userId);
        const newData = await ensureUserTokensExist(userId, 0);
        // Actualizar cache
        tokenCache.set(userId, { data: newData, timestamp: Date.now() });
        return newData;
      }
      
      const rawData = tokenDoc.data();
      const validatedData = validateTokenData(rawData);
      
      // Si los datos estaban corruptos, corregirlos
      if (JSON.stringify(rawData) !== JSON.stringify(validatedData)) {
        logTokenOperation('DATA_CORRUPTION_FIXED', userId, { before: rawData, after: validatedData });
        await setDoc(doc(db, 'tokens', userId), validatedData);
      }
      
      // Actualizar cache
      tokenCache.set(userId, { data: validatedData, timestamp: Date.now() });
      logTokenOperation('GET_TOKENS_SUCCESS', userId, validatedData);
      
      return validatedData;
    } catch (error) {
      logTokenOperation('GET_TOKENS_ERROR', userId, null, error);
      
      // Intentar recuperación de emergencia
      try {
        const emergencyData = await ensureUserTokensExist(userId, 0);
        tokenCache.set(userId, { data: emergencyData, timestamp: Date.now() });
        return emergencyData;
      } catch (fallbackError) {
        logTokenOperation('EMERGENCY_RECOVERY_FAILED', userId, null, fallbackError);
        const fallbackData = { tokens: 0, lastClaim: 0, followersCount: 0 };
        tokenCache.set(userId, { data: fallbackData, timestamp: Date.now() });
        return fallbackData;
      }
    }
  });
};

export const initializeUserTokens = async (userId: string): Promise<TokenData> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'tokens', userId));
    
    if (!tokenDoc.exists()) {
      const initialData: TokenData = {
        tokens: 0,
        lastClaim: 0,
        followersCount: 0
      };
      await setDoc(doc(db, 'tokens', userId), initialData);
      return initialData;
    }
    
    return tokenDoc.data() as TokenData;
  } catch (error) {
    console.error('Error inicializando tokens:', error);
    return {
      tokens: 0,
      lastClaim: 0,
      followersCount: 0
    };
  }
};

export const claimDailyTokens = async (userId: string, followersCount: number): Promise<{ success: boolean; tokensEarned: number; totalTokens: number }> => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  return retryWithBackoff(async () => {
    try {
      // Usar transacción para evitar condiciones de carrera
      const result = await runTransaction(db, async (transaction) => {
        const tokenRef = doc(db, 'tokens', userId);
        const tokenDoc = await transaction.get(tokenRef);
        
        let tokenData: TokenData;
        if (!tokenDoc.exists()) {
          // Migración automática dentro de la transacción
          logTokenOperation('MIGRATION_IN_TRANSACTION', userId);
          tokenData = { tokens: 100, lastClaim: 0, followersCount }; // Bonus para usuarios antiguos
        } else {
          tokenData = validateTokenData(tokenDoc.data());
        }
        
        // Verificar si puede reclamar
        if (now - tokenData.lastClaim < oneDayMs) {
          const hoursLeft = Math.ceil((oneDayMs - (now - tokenData.lastClaim)) / (1000 * 60 * 60));
          logTokenOperation('CLAIM_TOO_EARLY', userId, { hoursLeft });
          return { success: false, tokensEarned: 0, totalTokens: tokenData.tokens };
        }
        
        const dailyTokens = calculateDailyTokens(followersCount);
        const newTotal = tokenData.tokens + dailyTokens;
        
        const newTokenData = {
          tokens: newTotal,
          lastClaim: now,
          followersCount
        };
        
        // Actualizar documento
        transaction.set(tokenRef, newTokenData);
        
        // Crear registro de auditoría
        const transactionId = `${userId}_${now}_${Math.random().toString(36).substr(2, 9)}`;
        const auditRef = doc(db, 'tokenTransactions', transactionId);
        transaction.set(auditRef, {
          userId,
          amount: dailyTokens,
          type: 'daily_claim',
          timestamp: now,
          previousBalance: tokenData.tokens,
          newBalance: newTotal,
          metadata: { followersCount, dailyTokens }
        });
        
        // Actualizar cache
        tokenCache.set(userId, { data: newTokenData, timestamp: Date.now() });
        
        logTokenOperation('DAILY_CLAIM_SUCCESS', userId, { tokensEarned: dailyTokens, totalTokens: newTotal });
        return { success: true, tokensEarned: dailyTokens, totalTokens: newTotal };
      });
      
      return result;
    } catch (error) {
      logTokenOperation('DAILY_CLAIM_ERROR', userId, null, error);
      
      // Intentar obtener estado actual para respuesta
      try {
        const currentTokens = await getUserTokens(userId);
        return { success: false, tokensEarned: 0, totalTokens: currentTokens.tokens };
      } catch (fallbackError) {
        logTokenOperation('CLAIM_FALLBACK_ERROR', userId, null, fallbackError);
        return { success: false, tokensEarned: 0, totalTokens: 0 };
      }
    }
  });
};

export const canClaimTokens = (lastClaim: number): boolean => {
  // ✅ Si nunca ha reclamado (lastClaim = 0), puede reclamar inmediatamente
  if (lastClaim === 0) {
    return true;
  }
  
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return now - lastClaim >= oneDayMs;
};

export const updateFollowersCount = async (userId: string, followersCount: number): Promise<void> => {
  try {
    const tokenRef = doc(db, 'tokens', userId);
    const tokenDoc = await getDoc(tokenRef);
    
    if (!tokenDoc.exists()) {
      await setDoc(tokenRef, {
        tokens: 0,
        lastClaim: 0,
        followersCount
      });
    } else {
      const tokenData = tokenDoc.data() as TokenData;
      await setDoc(tokenRef, {
        ...tokenData,
        followersCount
      });
    }
  } catch (error) {
    console.error('Error actualizando contador de seguidores:', error);
  }
};

export const spendTokens = async (userId: string, amount: number, reason: string = 'purchase'): Promise<{ success: boolean; remainingTokens: number }> => {
  // Validaciones de seguridad estrictas
  if (!userId || typeof userId !== 'string') {
    throw new Error('ID de usuario inválido');
  }
  if (typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('Cantidad inválida');
  }
  if (!reason || typeof reason !== 'string') {
    throw new Error('Razón inválida');
  }
  
  return retryWithBackoff(async () => {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const tokenRef = doc(db, 'tokens', userId);
        const tokenDoc = await transaction.get(tokenRef);
        
        if (!tokenDoc.exists()) {
          logTokenOperation('SPEND_NO_DOCUMENT', userId, { amount, reason });
          return { success: false, remainingTokens: 0 };
        }
        
        const tokenData = validateTokenData(tokenDoc.data());
        
        if (tokenData.tokens < amount) {
          logTokenOperation('INSUFFICIENT_TOKENS', userId, { available: tokenData.tokens, requested: amount });
          return { success: false, remainingTokens: tokenData.tokens };
        }
        
        const newTotal = tokenData.tokens - amount;
        const newTokenData = {
          tokens: newTotal,
          lastClaim: tokenData.lastClaim,
          followersCount: tokenData.followersCount
        };
        
        // Actualizar tokens
        transaction.set(tokenRef, newTokenData);
        
        // Crear registro de auditoría
        const transactionId = `spend_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const auditRef = doc(db, 'tokenTransactions', transactionId);
        transaction.set(auditRef, {
          userId,
          amount: -amount, // Negativo para gastos
          type: reason,
          timestamp: Date.now(),
          previousBalance: tokenData.tokens,
          newBalance: newTotal,
          metadata: { spentOn: reason, timestamp: new Date().toISOString() }
        });
        
        // Invalidar cache
        tokenCache.delete(userId);
        
        logTokenOperation('TOKENS_SPENT', userId, { amount, remainingTokens: newTotal, reason });
        return { success: true, remainingTokens: newTotal };
      });
      
      return result;
    } catch (error) {
      logTokenOperation('SPEND_TOKENS_ERROR', userId, { amount, reason }, error);
      return { success: false, remainingTokens: 0 };
    }
  });
};

export const addTokens = async (userId: string, amount: number, reason: string = 'manual_add'): Promise<{ success: boolean; totalTokens: number }> => {
  // Validaciones de seguridad estrictas
  if (!userId || typeof userId !== 'string') {
    throw new Error('ID de usuario inválido');
  }
  if (typeof amount !== 'number' || amount <= 0 || amount > 50000000 || !Number.isInteger(amount)) {
    throw new Error('Cantidad de tokens inválida');
  }
  if (!reason || typeof reason !== 'string') {
    throw new Error('Razón inválida');
  }
  
  return retryWithBackoff(async () => {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const tokenRef = doc(db, 'tokens', userId);
        const tokenDoc = await transaction.get(tokenRef);
        
        let tokenData: TokenData;
        if (!tokenDoc.exists()) {
          tokenData = { tokens: 0, lastClaim: 0, followersCount: 0 };
        } else {
          tokenData = validateTokenData(tokenDoc.data());
        }
        
        const newTotal = tokenData.tokens + amount;
        const newTokenData = {
          tokens: newTotal,
          lastClaim: tokenData.lastClaim,
          followersCount: tokenData.followersCount
        };
        
        // Actualizar tokens
        transaction.set(tokenRef, newTokenData);
        
        // Crear registro de auditoría
        const transactionId = `add_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const auditRef = doc(db, 'tokenTransactions', transactionId);
        transaction.set(auditRef, {
          userId,
          amount,
          type: reason,
          timestamp: Date.now(),
          previousBalance: tokenData.tokens,
          newBalance: newTotal,
          metadata: { addedBy: 'system', timestamp: new Date().toISOString() }
        });
        
        // Invalidar cache
        tokenCache.delete(userId);
        
        logTokenOperation('TOKENS_ADDED', userId, { amount, newTotal, reason });
        return { success: true, totalTokens: newTotal };
      });
      
      return result;
    } catch (error) {
      logTokenOperation('ADD_TOKENS_ERROR', userId, { amount, reason }, error);
      return { success: false, totalTokens: 0 };
    }
  });
};

export const grantFollowerBonus = async (userId: string, newFollowersCount: number): Promise<{ tokensGranted: number; totalTokens: number } | null> => {
  if (!userId || typeof userId !== 'string' || typeof newFollowersCount !== 'number' || newFollowersCount < 0) {
    logTokenOperation('INVALID_FOLLOWER_BONUS_PARAMS', userId, { newFollowersCount });
    return null;
  }
  
  return retryWithBackoff(async () => {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const tokenRef = doc(db, 'tokens', userId);
        const tokenDoc = await transaction.get(tokenRef);
        
        let tokenData: TokenData;
        if (!tokenDoc.exists()) {
          tokenData = { tokens: 0, lastClaim: 0, followersCount: 0 };
        } else {
          tokenData = validateTokenData(tokenDoc.data());
        }
        
        const oldMilestones = Math.floor(tokenData.followersCount / 500);
        const newMilestones = Math.floor(newFollowersCount / 500);
        
        // Verificar si alcanzó nuevo hito
        if (newMilestones > oldMilestones) {
          const bonusTokens = (newMilestones - oldMilestones) * 50;
          const newTotal = tokenData.tokens + bonusTokens;
          
          const newTokenData = {
            tokens: newTotal,
            lastClaim: tokenData.lastClaim,
            followersCount: newFollowersCount
          };
          
          // Actualizar tokens
          transaction.set(tokenRef, newTokenData);
          
          // Crear registro de auditoría
          const bonusId = `bonus_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const auditRef = doc(db, 'tokenTransactions', bonusId);
          transaction.set(auditRef, {
            userId,
            amount: bonusTokens,
            type: 'follower_milestone_bonus',
            timestamp: Date.now(),
            previousBalance: tokenData.tokens,
            newBalance: newTotal,
            metadata: { 
              oldFollowers: tokenData.followersCount, 
              newFollowers: newFollowersCount,
              milestone: newMilestones * 500
            }
          });
          
          // Invalidar cache
          tokenCache.delete(userId);
          
          logTokenOperation('FOLLOWER_BONUS_GRANTED', userId, { bonusTokens, newTotal, milestone: newMilestones * 500 });
          return { tokensGranted: bonusTokens, totalTokens: newTotal };
        } else {
          // Solo actualizar contador de seguidores
          const updatedData = { ...tokenData, followersCount: newFollowersCount };
          transaction.set(tokenRef, updatedData);
          
          // Invalidar cache
          tokenCache.delete(userId);
          
          logTokenOperation('FOLLOWERS_UPDATED', userId, { newFollowersCount });
          return null;
        }
      });
      
      return result;
    } catch (error) {
      logTokenOperation('FOLLOWER_BONUS_ERROR', userId, { newFollowersCount }, error);
      return null;
    }
  });
};

// Sistema robusto para asegurar tokens de usuario
export const ensureUserTokensExist = async (userId: string, currentFollowers: number = 0): Promise<TokenData> => {
  return retryWithBackoff(async () => {
    try {
      const tokenDoc = await getDoc(doc(db, 'tokens', userId));
      
      if (!tokenDoc.exists()) {
        // Determinar tokens iniciales basado en seguidores
        const initialTokens = currentFollowers >= 500 ? 200 : currentFollowers >= 100 ? 150 : 100;
        
        const initialData: TokenData = {
          tokens: initialTokens,
          lastClaim: 0, // Permitir reclamar inmediatamente
          followersCount: currentFollowers
        };
        
        await setDoc(doc(db, 'tokens', userId), initialData);
        
        // Crear registro de auditoría para migración
        const migrationId = `migration_${userId}_${Date.now()}`;
        await setDoc(doc(db, 'tokenTransactions', migrationId), {
          userId,
          amount: initialTokens,
          type: 'migration_bonus',
          timestamp: Date.now(),
          previousBalance: 0,
          newBalance: initialTokens,
          metadata: { currentFollowers, migrationDate: new Date().toISOString() }
        });
        
        logTokenOperation('USER_MIGRATED', userId, { initialTokens, currentFollowers });
        return initialData;
      }
      
      const rawData = tokenDoc.data();
      const validatedData = validateTokenData(rawData);
      
      // Corregir datos corruptos si es necesario
      if (JSON.stringify(rawData) !== JSON.stringify(validatedData)) {
        await setDoc(doc(db, 'tokens', userId), validatedData);
        logTokenOperation('DATA_CORRUPTION_FIXED', userId, { before: rawData, after: validatedData });
      }
      
      return validatedData;
    } catch (error) {
      logTokenOperation('ENSURE_TOKENS_ERROR', userId, null, error);
      
      // Crear documento de emergencia
      const emergencyData: TokenData = { tokens: 50, lastClaim: 0, followersCount: currentFollowers };
      
      try {
        await setDoc(doc(db, 'tokens', userId), emergencyData);
        logTokenOperation('EMERGENCY_DOCUMENT_CREATED', userId, emergencyData);
      } catch (emergencyError) {
        logTokenOperation('EMERGENCY_CREATION_FAILED', userId, null, emergencyError);
      }
      
      return emergencyData;
    }
  });
};

// Migración para usuarios antiguos (mantener compatibilidad)
export const migrateUserTokens = async (userId: string, currentFollowers: number = 0): Promise<void> => {
  await ensureUserTokensExist(userId, currentFollowers);
};

// Inicializar tokens para nuevos usuarios
export const initializeNewUserTokens = async (userId: string, initialFollowers: number = 0): Promise<void> => {
  const initialTokens = initialFollowers >= 1 ? 60 : 0;
  
  const initialData: TokenData = {
    tokens: initialTokens,
    lastClaim: 0,
    followersCount: initialFollowers
  };
  
  try {
    await setDoc(doc(db, 'tokens', userId), initialData);
    console.log(`🎉 Tokens inicializados para nuevo usuario: ${userId} con ${initialTokens} tokens`);
  } catch (error) {
    console.error('Error inicializando tokens para nuevo usuario:', error);
  }
};

// Función optimizada para obtener tokens públicos
export const getPublicTokens = async (userId: string): Promise<number> => {
  try {
    const tokenData = await getUserTokens(userId);
    return Math.max(0, tokenData.tokens); // Asegurar que nunca sea negativo
  } catch (error) {
    logTokenOperation('GET_PUBLIC_TOKENS_ERROR', userId, null, error);
    return 0;
  }
};

// Sistema avanzado de sincronización con seguidores
export const syncTokensWithFollowers = async (userId: string, currentFollowers: number): Promise<void> => {
  if (!userId || typeof userId !== 'string' || typeof currentFollowers !== 'number' || currentFollowers < 0) {
    logTokenOperation('INVALID_SYNC_PARAMS', userId, { currentFollowers });
    return;
  }
  
  return retryWithBackoff(async () => {
    try {
      await runTransaction(db, async (transaction) => {
        const tokenRef = doc(db, 'tokens', userId);
        const tokenDoc = await transaction.get(tokenRef);
        
        let tokenData: TokenData;
        if (!tokenDoc.exists()) {
          // Crear documento si no existe
          tokenData = { tokens: 0, lastClaim: 0, followersCount: 0 };
        } else {
          tokenData = validateTokenData(tokenDoc.data());
        }
        
        // Verificar si hay cambio significativo en seguidores
        const followerDifference = currentFollowers - tokenData.followersCount;
        
        if (Math.abs(followerDifference) > 0) {
          // Verificar hitos de 500 seguidores
          const oldMilestones = Math.floor(tokenData.followersCount / 500);
          const newMilestones = Math.floor(currentFollowers / 500);
          
          let bonusTokens = 0;
          if (newMilestones > oldMilestones) {
            bonusTokens = (newMilestones - oldMilestones) * 50;
          }
          
          const newTokenData = {
            tokens: tokenData.tokens + bonusTokens,
            lastClaim: tokenData.lastClaim,
            followersCount: currentFollowers
          };
          
          transaction.set(tokenRef, newTokenData);
          
          // Si hubo bonus, crear registro de auditoría
          if (bonusTokens > 0) {
            const syncId = `sync_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const auditRef = doc(db, 'tokenTransactions', syncId);
            transaction.set(auditRef, {
              userId,
              amount: bonusTokens,
              type: 'follower_sync_bonus',
              timestamp: Date.now(),
              previousBalance: tokenData.tokens,
              newBalance: newTokenData.tokens,
              metadata: { 
                oldFollowers: tokenData.followersCount, 
                newFollowers: currentFollowers,
                followerDifference
              }
            });
          }
          
          // Invalidar cache
          tokenCache.delete(userId);
          
          logTokenOperation('FOLLOWERS_SYNCED', userId, { 
            oldFollowers: tokenData.followersCount, 
            newFollowers: currentFollowers, 
            bonusTokens 
          });
        }
      });
    } catch (error) {
      logTokenOperation('SYNC_FOLLOWERS_ERROR', userId, { currentFollowers }, error);
    }
  });
};

// Función para limpiar cache (útil para testing)
export const clearTokenCache = (userId?: string): void => {
  if (userId) {
    tokenCache.delete(userId);
    logTokenOperation('CACHE_CLEARED_USER', userId);
  } else {
    tokenCache.clear();
    console.log('🧹 Cache de tokens completamente limpiado');
  }
};

// Función para obtener estadísticas del cache
export const getCacheStats = (): { size: number; entries: string[] } => {
  return {
    size: tokenCache.size,
    entries: Array.from(tokenCache.keys())
  };
};

// Función para verificar salud del sistema de tokens
export const checkTokenSystemHealth = async (userId: string): Promise<{
  healthy: boolean;
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    const tokenData = await getUserTokens(userId);
    
    // Verificar datos válidos
    if (tokenData.tokens < 0) {
      issues.push('Tokens negativos detectados');
      recommendations.push('Ejecutar corrección de datos');
    }
    
    if (tokenData.lastClaim > Date.now()) {
      issues.push('Fecha de último reclamo en el futuro');
      recommendations.push('Corregir timestamp de último reclamo');
    }
    
    if (tokenData.followersCount < 0) {
      issues.push('Contador de seguidores negativo');
      recommendations.push('Sincronizar con datos reales de seguidores');
    }
    
    // Verificar cache
    const cached = tokenCache.get(userId);
    if (cached && Date.now() - cached.timestamp > CACHE_DURATION * 2) {
      issues.push('Cache obsoleto');
      recommendations.push('Limpiar cache');
    }
    
    logTokenOperation('HEALTH_CHECK', userId, { healthy: issues.length === 0, issuesCount: issues.length });
    
    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  } catch (error) {
    logTokenOperation('HEALTH_CHECK_ERROR', userId, null, error);
    return {
      healthy: false,
      issues: ['Error accediendo al sistema de tokens'],
      recommendations: ['Verificar conectividad con Firebase', 'Ejecutar migración de emergencia']
    };
  }
};

