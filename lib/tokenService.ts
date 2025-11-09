import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface TokenData {
  tokens: number;
  lastClaim: number;
  followersCount: number;
}

export const calculateDailyTokens = (followersCount: number): number => {
  const baseTokens = 10;
  const bonusTokens = Math.floor(followersCount / 500) * 50;
  return baseTokens + bonusTokens;
};

export const getUserTokens = async (userId: string): Promise<TokenData> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'tokens', userId));
    
    if (!tokenDoc.exists()) {
      // ✅ AUTO-MIGRACIÓN: Crear documento automáticamente
      console.log('🔄 Auto-creando tokens para usuario:', userId);
      return await ensureUserTokensExist(userId, 0);
    }
    
    return tokenDoc.data() as TokenData;
  } catch (error) {
    console.log('Error accediendo a tokens, usando valores por defecto:', error);
    return {
      tokens: 0,
      lastClaim: 0,
      followersCount: 0
    };
  }
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
  
  let tokenData = await getUserTokens(userId);
  
  // ✅ MIGRACIÓN AUTOMÁTICA: Si el usuario no tiene documento de tokens, crearlo
  if (tokenData.tokens === 0 && tokenData.lastClaim === 0) {
    console.log('🔄 Migrando usuario antiguo:', userId);
    await ensureUserTokensExist(userId, followersCount);
    tokenData = await getUserTokens(userId);
  }
  
  // ✅ VERIFICAR SI PUEDE RECLAMAR (24 horas)
  if (now - tokenData.lastClaim < oneDayMs) {
    return { success: false, tokensEarned: 0, totalTokens: tokenData.tokens };
  }
  
  const dailyTokens = calculateDailyTokens(followersCount);
  const newTotal = tokenData.tokens + dailyTokens;
  
  try {
    await updateDoc(doc(db, 'tokens', userId), {
      tokens: newTotal,
      lastClaim: now,
      followersCount
    });
    
    console.log(`🪙 Tokens diarios otorgados: ${dailyTokens} (Total: ${newTotal})`);
    return { success: true, tokensEarned: dailyTokens, totalTokens: newTotal };
  } catch (error) {
    console.error('Error actualizando tokens:', error);
    return { success: false, tokensEarned: 0, totalTokens: tokenData.tokens };
  }
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

export const spendTokens = async (userId: string, amount: number): Promise<{ success: boolean; remainingTokens: number }> => {
  const tokenData = await getUserTokens(userId);
  
  if (amount > 0 && tokenData.tokens < amount) {
    return { success: false, remainingTokens: tokenData.tokens };
  }
  
  const newTotal = tokenData.tokens - amount;
  await updateDoc(doc(db, 'tokens', userId), {
    tokens: newTotal
  });
  
  return { success: true, remainingTokens: newTotal };
};

export const addTokens = async (userId: string, amount: number): Promise<{ success: boolean; totalTokens: number }> => {
  const tokenData = await getUserTokens(userId);
  const newTotal = tokenData.tokens + amount;
  
  await updateDoc(doc(db, 'tokens', userId), {
    tokens: newTotal
  });
  
  return { success: true, totalTokens: newTotal };
};

export const grantFollowerBonus = async (userId: string, newFollowersCount: number): Promise<{ tokensGranted: number; totalTokens: number } | null> => {
  try {
    const tokenRef = doc(db, 'tokens', userId);
    const tokenDoc = await getDoc(tokenRef);
    
    let tokenData: TokenData;
    if (!tokenDoc.exists()) {
      tokenData = { tokens: 0, lastClaim: 0, followersCount: 0 };
      await setDoc(tokenRef, tokenData);
    } else {
      tokenData = tokenDoc.data() as TokenData;
    }
    
    const oldMilestones = Math.floor(tokenData.followersCount / 500);
    const newMilestones = Math.floor(newFollowersCount / 500);
    
    // Si alcanzó un nuevo hito de 500 seguidores
    if (newMilestones > oldMilestones) {
      const bonusTokens = (newMilestones - oldMilestones) * 50;
      const newTotal = tokenData.tokens + bonusTokens;
      
      await setDoc(tokenRef, {
        tokens: newTotal,
        lastClaim: tokenData.lastClaim,
        followersCount: newFollowersCount
      });
      
      console.log(`🎉 Usuario ${userId} alcanzó ${newFollowersCount} seguidores y recibió ${bonusTokens} tokens!`);
      return { tokensGranted: bonusTokens, totalTokens: newTotal };
    }
    
    // Solo actualizar contador
    await setDoc(tokenRef, {
      ...tokenData,
      followersCount: newFollowersCount
    });
    
    return null;
  } catch (error) {
    console.error('Error otorgando bonus de seguidor:', error);
    return null;
  }
};

// ✅ FUNCIÓN MEJORADA: Asegurar que el usuario tenga documento de tokens
export const ensureUserTokensExist = async (userId: string, currentFollowers: number = 0): Promise<TokenData> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'tokens', userId));
    
    if (!tokenDoc.exists()) {
      // ✅ USUARIOS ANTIGUOS: Dar tokens iniciales generosos
      const initialTokens = 50; // Bonus para usuarios antiguos
      
      const initialData: TokenData = {
        tokens: initialTokens,
        lastClaim: 0, // Permitir reclamar inmediatamente
        followersCount: currentFollowers
      };
      
      await setDoc(doc(db, 'tokens', userId), initialData);
      console.log(`🎉 Usuario migrado: ${userId} recibió ${initialTokens} tokens iniciales`);
      return initialData;
    }
    
    return tokenDoc.data() as TokenData;
  } catch (error) {
    console.error('Error asegurando tokens del usuario:', error);
    return { tokens: 0, lastClaim: 0, followersCount: currentFollowers };
  }
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

// Función para obtener tokens visibles para otros usuarios
export const getPublicTokens = async (userId: string): Promise<number> => {
  try {
    const tokenData = await getUserTokens(userId);
    return tokenData.tokens;
  } catch (error) {
    console.log('Error obteniendo tokens públicos:', error);
    return 0;
  }
};

// Función para sincronizar tokens con seguidores
export const syncTokensWithFollowers = async (userId: string, currentFollowers: number): Promise<void> => {
  try {
    const tokenData = await getUserTokens(userId);
    
    // Si no tenía seguidores y ahora tiene 1+, dar bonus
    if (tokenData.followersCount === 0 && currentFollowers >= 1) {
      await grantFollowerBonus(userId, currentFollowers);
    } else {
      // Solo actualizar contador
      await updateDoc(doc(db, 'tokens', userId), {
        followersCount: currentFollowers
      });
    }
  } catch (error) {
    console.error('Error sincronizando tokens con seguidores:', error);
  }
};