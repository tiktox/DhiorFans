import { db } from './firebase';
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

// Crear notificación
export const createNotification = async (
  userId: string,
  type: 'like' | 'comment' | 'follow' | 'tokens',
  fromUserId: string,
  message: string,
  postId?: string,
  commentId?: string,
  tokensAmount?: number
): Promise<void> => {
  try {
    // No crear notificación si el usuario se interactúa consigo mismo
    if (userId === fromUserId) return;

    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      fromUserId,
      postId: postId || null,
      commentId: commentId || null,
      message,
      read: false,
      createdAt: Timestamp.now(),
      tokensAmount: tokensAmount || null
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Obtener notificaciones del usuario
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        fromUserId: data.fromUserId,
        postId: data.postId,
        commentId: data.commentId,
        message: data.message,
        read: data.read,
        createdAt: data.createdAt?.toMillis() || Date.now()
      });
    });

    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Contar notificaciones no leídas
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Escuchar notificaciones en tiempo real
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        fromUserId: data.fromUserId,
        postId: data.postId,
        commentId: data.commentId,
        message: data.message,
        read: data.read,
        createdAt: data.createdAt?.toMillis() || Date.now()
      });
    });

    callback(notifications);
  });

  return unsubscribe;
};

// Funciones auxiliares para crear notificaciones específicas
export const notifyLike = async (postOwnerId: string, likerUserId: string, postId: string) => {
  await createNotification(
    postOwnerId,
    'like',
    likerUserId,
    'le gustó tu publicación',
    postId
  );
};

export const notifyComment = async (postOwnerId: string, commenterUserId: string, postId: string, commentId: string) => {
  await createNotification(
    postOwnerId,
    'comment',
    commenterUserId,
    'comentó tu publicación',
    postId,
    commentId
  );
};

export const notifyFollow = async (followedUserId: string, followerUserId: string) => {
  await createNotification(
    followedUserId,
    'follow',
    followerUserId,
    'comenzó a seguirte'
  );
};

export const notifyTokens = async (userId: string, tokensAmount: number) => {
  await createNotification(
    userId,
    'tokens',
    'system',
    `¡Has recibido ${tokensAmount} tokens hoy!`,
    undefined,
    undefined,
    tokensAmount
  );
};
