import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  timestamp: Date;
  previousBalance: number;
  newBalance: number;
}

// Obtener historial de transacciones de un usuario
export const getUserTokenHistory = async (userId: string, limitCount: number = 50): Promise<TokenTransaction[]> => {
  try {
    const q = query(
      collection(db, 'tokenTransactions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TokenTransaction));
  } catch (error) {
    console.error('Error obteniendo historial de tokens:', error);
    return [];
  }
};

// Verificar integridad de tokens de un usuario
export const verifyTokenIntegrity = async (userId: string): Promise<{ valid: boolean; expectedBalance: number; actualBalance: number }> => {
  try {
    // Obtener todas las transacciones del usuario
    const transactions = await getUserTokenHistory(userId, 1000);
    
    // Calcular balance esperado
    let expectedBalance = 0;
    transactions.reverse().forEach(transaction => {
      expectedBalance += transaction.amount;
    });
    
    // Obtener balance actual
    const tokenDoc = await getDoc(doc(db, 'tokens', userId));
    const actualBalance = tokenDoc.exists() ? tokenDoc.data().tokens : 0;
    
    return {
      valid: expectedBalance === actualBalance,
      expectedBalance,
      actualBalance
    };
  } catch (error) {
    console.error('Error verificando integridad de tokens:', error);
    return { valid: false, expectedBalance: 0, actualBalance: 0 };
  }
};

// Obtener estadísticas globales de tokens
export const getTokenStats = async (): Promise<{
  totalTransactions: number;
  totalTokensInCirculation: number;
  topUsers: Array<{ userId: string; tokens: number }>;
}> => {
  try {
    // Obtener transacciones recientes
    const transactionsQuery = query(
      collection(db, 'tokenTransactions'),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    // Obtener top usuarios por tokens
    const tokensQuery = query(
      collection(db, 'tokens'),
      orderBy('tokens', 'desc'),
      limit(10)
    );
    const tokensSnapshot = await getDocs(tokensQuery);
    
    const topUsers = tokensSnapshot.docs.map(doc => ({
      userId: doc.id,
      tokens: doc.data().tokens
    }));
    
    const totalTokensInCirculation = topUsers.reduce((sum, user) => sum + user.tokens, 0);
    
    return {
      totalTransactions: transactionsSnapshot.size,
      totalTokensInCirculation,
      topUsers
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de tokens:', error);
    return {
      totalTransactions: 0,
      totalTokensInCirculation: 0,
      topUsers: []
    };
  }
};

// Detectar actividad sospechosa
export const detectSuspiciousActivity = async (userId: string): Promise<{
  suspicious: boolean;
  reasons: string[];
}> => {
  try {
    const transactions = await getUserTokenHistory(userId, 100);
    const reasons: string[] = [];
    
    // Verificar transacciones muy grandes
    const largeTransactions = transactions.filter(t => Math.abs(t.amount) > 1000000);
    if (largeTransactions.length > 0) {
      reasons.push(`${largeTransactions.length} transacciones muy grandes detectadas`);
    }
    
    // Verificar muchas transacciones en poco tiempo
    const recentTransactions = transactions.filter(t => 
      Date.now() - t.timestamp.getTime() < 60000 // Último minuto
    );
    if (recentTransactions.length > 10) {
      reasons.push(`${recentTransactions.length} transacciones en el último minuto`);
    }
    
    // Verificar patrones anómalos
    const addTransactions = transactions.filter(t => t.amount > 0);
    if (addTransactions.length > 50) {
      reasons.push(`Demasiadas adiciones de tokens: ${addTransactions.length}`);
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons
    };
  } catch (error) {
    console.error('Error detectando actividad sospechosa:', error);
    return { suspicious: false, reasons: [] };
  }
};