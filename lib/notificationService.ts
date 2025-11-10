import { db, connectionManager } from './firebase';
import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'tokens';
  fromUserId: string;
  postId?: string;
  commentId?: string;
  message: string;
  read: boolean;
  createdAt: number;
  tokensAmount?: number;
}

// Crear notificación con manejo robusto de errores
export const createNotification = async (
  userId: string,
  type: 'like' | 'comment' | 'follow' | 'tokens',
  fromUserId: string,
  message: string,
  postId?: string,
  commentId?: string,
  tokensAmount?: number
): Promise<void> => {
  // Validaciones
  if (!userId || !fromUserId || !message) {
    throw new Error('Parámetros requeridos faltantes para crear notificación');
  }
  
  // No crear notificación si el usuario se interactúa consigo mismo
  if (userId === fromUserId) return;

  return connectionManager.executeWithRetry(async () => {
    const notificationData = {
      userId,
      type,
      fromUserId,
      postId: postId || null,
      commentId: commentId || null,
      message: message.trim(),
      read: false,
      createdAt: Timestamp.now(),
      tokensAmount: tokensAmount || null
    };
    
    await addDoc(collection(db, 'notifications'), notificationData);
    console.log('✅ Notificación creada exitosamente');
  }, 'createNotification');
};

// Obtener notificaciones del usuario con manejo robusto
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  if (!userId) {
    console.warn('UserId no proporcionado para obtener notificaciones');
    return [];
  }

  return connectionManager.executeWithRetry(async () => {
    let querySnapshot;
    
    try {
      // Intentar con orderBy primero
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      querySnapshot = await getDocs(q);
    } catch (error: any) {
      // Si falla por índice, usar consulta simple
      if (error.message?.includes('index') || error.code === 'failed-precondition') {
        console.warn('Usando consulta sin orderBy debido a índice faltante');
        const simpleQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', userId)
        );
        querySnapshot = await getDocs(simpleQuery);
      } else {
        throw error;
      }
    }
    const notifications: Notification[] = [];

    querySnapshot.forEach((docSnap) => {
      try {
        const data = docSnap.data();
        
        // Validar datos antes de agregar
        if (data.userId && data.type && data.fromUserId && data.message) {
          notifications.push({
            id: docSnap.id,
            userId: data.userId,
            type: data.type,
            fromUserId: data.fromUserId,
            postId: data.postId,
            commentId: data.commentId,
            message: data.message,
            read: data.read || false,
            createdAt: data.createdAt?.toMillis() || Date.now(),
            tokensAmount: data.tokensAmount
          });
        }
      } catch (docError) {
        console.warn('Error procesando notificación:', docError);
      }
    });

    // Ordenar manualmente si no se usó orderBy
    notifications.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log(`✅ ${notifications.length} notificaciones cargadas`);
    return notifications;
  }, 'getUserNotifications').catch(error => {
    console.error('Error crítico obteniendo notificaciones:', error);
    return []; // Retornar array vacío en lugar de fallar
  });
};

// Marcar notificación como leída con manejo robusto
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  if (!notificationId) {
    console.warn('NotificationId no proporcionado');
    return;
  }

  return connectionManager.executeWithRetry(async () => {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
    console.log('✅ Notificación marcada como leída');
  }, 'markNotificationAsRead').catch(error => {
    console.error('Error crítico marcando notificación como leída:', error);
    // No lanzar error para no interrumpir la UI
  });
};

// Marcar todas las notificaciones como leídas con procesamiento por lotes
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  if (!userId) {
    console.warn('UserId no proporcionado');
    return;
  }

  return connectionManager.executeWithRetry(async () => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No hay notificaciones por marcar como leídas');
      return;
    }

    // Procesar en lotes de 10 para evitar sobrecarga
    const batchSize = 10;
    const docs = querySnapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const updatePromises = batch.map(docSnap => 
        updateDoc(docSnap.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
    }
    
    console.log(`✅ ${docs.length} notificaciones marcadas como leídas`);
  }, 'markAllNotificationsAsRead').catch(error => {
    console.error('Error crítico marcando todas las notificaciones:', error);
  });
};

// Contar notificaciones no leídas con cache
let unreadCountCache: { userId: string; count: number; timestamp: number } | null = null;
const UNREAD_CACHE_DURATION = 30000; // 30 segundos

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  if (!userId) {
    console.warn('UserId no proporcionado para contar notificaciones');
    return 0;
  }

  // Usar cache si está disponible y es reciente
  if (unreadCountCache && 
      unreadCountCache.userId === userId && 
      (Date.now() - unreadCountCache.timestamp) < UNREAD_CACHE_DURATION) {
    return unreadCountCache.count;
  }

  return connectionManager.executeWithRetry(async () => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const count = querySnapshot.size;
    
    // Actualizar cache
    unreadCountCache = {
      userId,
      count,
      timestamp: Date.now()
    };
    
    return count;
  }, 'getUnreadNotificationsCount').catch(error => {
    console.error('Error obteniendo contador de no leídas:', error);
    return 0; // Retornar 0 en lugar de fallar
  });
};

// Escuchar notificaciones en tiempo real con manejo de errores
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  if (!userId) {
    console.warn('UserId no proporcionado para suscripción de notificaciones');
    return () => {};
  }

  // Intentar con índice compuesto, fallback sin orderBy
  let q;
  try {
    q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  } catch (indexError) {
    console.warn('Usando consulta sin orderBy para suscripción');
    q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
  }

  let retryCount = 0;
  const maxRetries = 3;
  let unsubscribe: (() => void) | null = null;
  
  const createSubscription = () => {
    try {
      unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          try {
            const notifications: Notification[] = [];
            
            querySnapshot.forEach((docSnap) => {
              try {
                const data = docSnap.data();
                
                // Validar datos antes de agregar
                if (data.userId && data.type && data.fromUserId && data.message) {
                  notifications.push({
                    id: docSnap.id,
                    userId: data.userId,
                    type: data.type,
                    fromUserId: data.fromUserId,
                    postId: data.postId,
                    commentId: data.commentId,
                    message: data.message,
                    read: data.read || false,
                    createdAt: data.createdAt?.toMillis() || Date.now(),
                    tokensAmount: data.tokensAmount
                  });
                }
              } catch (docError) {
                console.warn('Error procesando notificación en tiempo real:', docError);
              }
            });

            callback(notifications);
            retryCount = 0; // Reset en caso de éxito
            
          } catch (callbackError) {
            console.error('Error en callback de notificaciones:', callbackError);
          }
        },
        (error) => {
          console.error('Error en suscripción de notificaciones:', error);
          
          // Si es error de índice, usar consulta simple
          if (error.message?.includes('index') || error.code === 'failed-precondition') {
            console.log('Cambiando a consulta simple sin orderBy');
            const simpleQuery = query(
              collection(db, 'notifications'),
              where('userId', '==', userId)
            );
            
            unsubscribe = onSnapshot(simpleQuery, 
              (snapshot) => {
                const notifications: Notification[] = [];
                snapshot.forEach((doc) => {
                  const data = doc.data();
                  if (data.userId && data.type && data.fromUserId && data.message) {
                    notifications.push({
                      id: doc.id,
                      userId: data.userId,
                      type: data.type,
                      fromUserId: data.fromUserId,
                      postId: data.postId,
                      commentId: data.commentId,
                      message: data.message,
                      read: data.read || false,
                      createdAt: data.createdAt?.toMillis() || Date.now(),
                      tokensAmount: data.tokensAmount
                    });
                  }
                });
                // Ordenar manualmente por fecha
                notifications.sort((a, b) => b.createdAt - a.createdAt);
                callback(notifications);
              },
              () => callback([])
            );
            return;
          }
          
          // Reintentar si no se ha excedido el límite
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Reintentando suscripción de notificaciones (${retryCount}/${maxRetries})`);
            
            setTimeout(() => {
              if (unsubscribe) unsubscribe();
              createSubscription();
            }, Math.pow(2, retryCount) * 1000);
          } else {
            console.error('Máximo de reintentos alcanzado para notificaciones');
            callback([]); // Callback con array vacío
          }
        }
      );
    } catch (error) {
      console.error('Error creando suscripción de notificaciones:', error);
      callback([]);
    }
  };
  
  createSubscription();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

// Funciones auxiliares para crear notificaciones específicas con validación
export const notifyLike = async (postOwnerId: string, likerUserId: string, postId: string): Promise<void> => {
  if (!postOwnerId || !likerUserId || !postId) {
    console.warn('Parámetros faltantes para notificación de like');
    return;
  }
  
  try {
    await createNotification(
      postOwnerId,
      'like',
      likerUserId,
      'le gustó tu publicación',
      postId
    );
  } catch (error) {
    console.error('Error enviando notificación de like:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
};

export const notifyComment = async (postOwnerId: string, commenterUserId: string, postId: string, commentId: string): Promise<void> => {
  if (!postOwnerId || !commenterUserId || !postId || !commentId) {
    console.warn('Parámetros faltantes para notificación de comentario');
    return;
  }
  
  try {
    await createNotification(
      postOwnerId,
      'comment',
      commenterUserId,
      'comentó tu publicación',
      postId,
      commentId
    );
  } catch (error) {
    console.error('Error enviando notificación de comentario:', error);
  }
};

export const notifyFollow = async (followedUserId: string, followerUserId: string): Promise<void> => {
  if (!followedUserId || !followerUserId) {
    console.warn('Parámetros faltantes para notificación de seguimiento');
    return;
  }
  
  try {
    await createNotification(
      followedUserId,
      'follow',
      followerUserId,
      'comenzó a seguirte'
    );
  } catch (error) {
    console.error('Error enviando notificación de seguimiento:', error);
  }
};

export const notifyTokens = async (userId: string, tokensAmount: number): Promise<void> => {
  if (!userId || !tokensAmount || tokensAmount <= 0) {
    console.warn('Parámetros inválidos para notificación de tokens');
    return;
  }
  
  try {
    await createNotification(
      userId,
      'tokens',
      'system',
      `¡Has recibido ${tokensAmount} tokens hoy!`,
      undefined,
      undefined,
      tokensAmount
    );
  } catch (error) {
    console.error('Error enviando notificación de tokens:', error);
  }
};

// Limpiar cache cuando sea necesario
export const clearNotificationCache = (): void => {
  unreadCountCache = null;
};
