import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface TokenData {
  tokens: number;
  lastClaim: number;
  followersCount: number;
}

export const calculateDailyTokens = (followersCount: number): number => {
  if (followersCount >= 1) {
    return 60; // 60 tokens por tener al menos 1 seguidor
  }
  return 10; // Solo tokens base sin seguidores
};

export const getUserTokens = async (userId: string): Promise<TokenData> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'tokens', userId));
    
    if (!tokenDoc.exists()) {
      return {
        tokens: 0,
        lastClaim: 0,
        followersCount: 0
      };
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
  
  const tokenData = await getUserTokens(userId);
  
  if (now - tokenData.lastClaim < oneDayMs) {
    return { success: false, tokensEarned: 0, totalTokens: tokenData.tokens };
  }
  
  const dailyTokens = calculateDailyTokens(followersCount);
  const newTotal = tokenData.tokens + dailyTokens;
  
  await updateDoc(doc(db, 'tokens', userId), {
    tokens: newTotal,
    lastClaim: now,
    followersCount
  });
  
  return { success: true, tokensEarned: dailyTokens, totalTokens: newTotal };
};

export const canClaimTokens = (lastClaim: number): boolean => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return now - lastClaim >= oneDayMs;
};

export const updateFollowersCount = async (userId: string, followersCount: number): Promise<void> => {
  const tokenData = await getUserTokens(userId);
  await updateDoc(doc(db, 'tokens', userId), {
    ...tokenData,
    followersCount
  });
};

export const spendTokens = async (userId: string, amount: number): Promise<{ success: boolean; remainingTokens: number }> => {
  const tokenData = await getUserTokens(userId);
  
  if (tokenData.tokens < amount) {
    return { success: false, remainingTokens: tokenData.tokens };
  }
  
  const newTotal = tokenData.tokens - amount;
  await updateDoc(doc(db, 'tokens', userId), {
    tokens: newTotal
  });
  
  return { success: true, remainingTokens: newTotal };
};

export const grantFollowerBonus = async (userId: string, newFollowersCount: number): Promise<{ tokensGranted: number; totalTokens: number } | null> => {
  const tokenData = await getUserTokens(userId);
  
  // Si ya tenía 1+ seguidores, no dar bonus
  if (tokenData.followersCount >= 1) {
    // Solo actualizar el contador de seguidores
    await updateDoc(doc(db, 'tokens', userId), {
      followersCount: newFollowersCount
    });
    return null;
  }
  
  // Si ahora tiene 1+ seguidores, dar bonus de 60 tokens
  if (newFollowersCount >= 1) {
    const bonusTokens = 60;
    const newTotal = tokenData.tokens + bonusTokens;
    
    await updateDoc(doc(db, 'tokens', userId), {
      tokens: newTotal,
      followersCount: newFollowersCount
    });
    
    return { tokensGranted: bonusTokens, totalTokens: newTotal };
  }
  
  // Solo actualizar contador si no hay bonus
  await updateDoc(doc(db, 'tokens', userId), {
    followersCount: newFollowersCount
  });
  
  return null;
};

// Migración para usuarios antiguos
export const migrateUserTokens = async (userId: string, currentFollowers: number = 0): Promise<void> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'tokens', userId));
    
    if (!tokenDoc.exists()) {
      // Si el usuario tiene 1+ seguidores, darle tokens iniciales
      const initialTokens = currentFollowers >= 1 ? 60 : 0;
      
      const initialData: TokenData = {
        tokens: initialTokens,
        lastClaim: 0,
        followersCount: currentFollowers
      };
      await setDoc(doc(db, 'tokens', userId), initialData);
      console.log(`✅ Tokens migrados para usuario: ${userId} con ${initialTokens} tokens`);
    } else {
      // Usuario existente, solo actualizar seguidores si es necesario
      const data = tokenDoc.data() as TokenData;
      if (data.followersCount !== currentFollowers) {
        await updateDoc(doc(db, 'tokens', userId), {
          followersCount: currentFollowers
        });
      }
    }
  } catch (error) {
    console.error('Error en migración de tokens:', error);
  }
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