import { db } from './firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, addDoc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { getUserDataById, UserData, UserWithId } from './userService';

export interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  isRead: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}

// Obtener usuarios que el usuario actual sigue
export const getFollowingUsers = async (currentUserId: string): Promise<UserWithId[]> => {
  try {
    const followingRef = collection(db, 'follows');
    const q = query(
      followingRef,
      where('followerId', '==', currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    const followingUsers: UserWithId[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const followData = docSnap.data();
      const userData = await getUserDataById(followData.followingId);
      if (userData) {
        followingUsers.push({
          ...userData,
          id: followData.followingId
        });
      }
    }
    
    return followingUsers;
  } catch (error) {
    console.error('Error getting following users:', error);
    return [];
  }
};

// Obtener seguidores del usuario actual
export const getFollowers = async (currentUserId: string): Promise<UserWithId[]> => {
  try {
    const followingRef = collection(db, 'follows');
    const q = query(
      followingRef,
      where('followingId', '==', currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    const followers: UserWithId[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const followData = docSnap.data();
      const userData = await getUserDataById(followData.followerId);
      if (userData) {
        followers.push({
          ...userData,
          id: followData.followerId
        });
      }
    }
    
    return followers;
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
};

// Enviar mensaje
export const sendMessage = async (senderId: string, receiverId: string, content: string): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages');
    await addDoc(messagesRef, {
      senderId,
      receiverId,
      content: content.trim(),
      timestamp: Timestamp.now(),
      isRead: false
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Escuchar mensajes en tiempo real
export const listenToMessages = (
  currentUserId: string, 
  otherUserId: string, 
  callback: (messages: Message[]) => void
) => {
  const messagesRef = collection(db, 'messages');
  
  // Crear dos queries separadas y combinar los resultados
  const q1 = query(
    messagesRef,
    where('senderId', '==', currentUserId),
    where('receiverId', '==', otherUserId),
    orderBy('timestamp', 'asc')
  );
  
  const q2 = query(
    messagesRef,
    where('senderId', '==', otherUserId),
    where('receiverId', '==', currentUserId),
    orderBy('timestamp', 'asc')
  );

  const messages = new Map<string, Message>();
  let unsubscribe1: (() => void) | null = null;
  let unsubscribe2: (() => void) | null = null;
  
  const updateMessages = () => {
    const sortedMessages = Array.from(messages.values())
      .sort((a, b) => a.timestamp - b.timestamp);
    callback(sortedMessages);
  };

  unsubscribe1 = onSnapshot(q1, (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.set(doc.id, {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        timestamp: data.timestamp.toMillis(),
        isRead: data.isRead
      });
    });
    updateMessages();
  });
  
  unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.set(doc.id, {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        timestamp: data.timestamp.toMillis(),
        isRead: data.isRead
      });
    });
    updateMessages();
  });

  // Retornar función para desuscribirse de ambos listeners
  return () => {
    if (unsubscribe1) unsubscribe1();
    if (unsubscribe2) unsubscribe2();
  };
};

// Marcar mensajes como leídos
export const markMessagesAsRead = async (currentUserId: string, otherUserId: string): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '==', otherUserId),
      where('receiverId', '==', currentUserId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(docSnap => 
      updateDoc(doc(db, 'messages', docSnap.id), { isRead: true })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Obtener conversaciones del usuario actual
export const getConversations = async (currentUserId: string): Promise<Conversation[]> => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '==', currentUserId),
      orderBy('timestamp', 'desc')
    );
    
    const q2 = query(
      messagesRef,
      where('receiverId', '==', currentUserId),
      orderBy('timestamp', 'desc')
    );
    
    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(q),
      getDocs(q2)
    ]);
    
    const conversationMap = new Map<string, Conversation>();
    
    // Procesar mensajes enviados
    for (const docSnap of sentSnapshot.docs) {
      const data = docSnap.data();
      const otherUserId = data.receiverId;
      
      if (!conversationMap.has(otherUserId)) {
        const userData = await getUserDataById(otherUserId);
        if (userData) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            userId: otherUserId,
            userName: userData.fullName,
            userAvatar: userData.profilePicture,
            lastMessage: data.content,
            timestamp: data.timestamp.toMillis(),
            unreadCount: 0,
            isRead: true
          });
        }
      }
    }
    
    // Procesar mensajes recibidos
    for (const docSnap of receivedSnapshot.docs) {
      const data = docSnap.data();
      const otherUserId = data.senderId;
      
      if (!conversationMap.has(otherUserId) || 
          conversationMap.get(otherUserId)!.timestamp < data.timestamp.toMillis()) {
        const userData = await getUserDataById(otherUserId);
        if (userData) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            userId: otherUserId,
            userName: userData.fullName,
            userAvatar: userData.profilePicture,
            lastMessage: data.content,
            timestamp: data.timestamp.toMillis(),
            unreadCount: data.isRead ? 0 : 1,
            isRead: data.isRead
          });
        }
      }
    }
    
    return Array.from(conversationMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

// Obtener usuarios disponibles para chat (seguidores + siguiendo)
export const getChatUsers = async (currentUserId: string): Promise<UserWithId[]> => {
  try {
    const [following, followers] = await Promise.all([
      getFollowingUsers(currentUserId),
      getFollowers(currentUserId)
    ]);
    
    // Combinar y eliminar duplicados
    const allUsers = [...following, ...followers];
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
    
    return uniqueUsers;
  } catch (error) {
    console.error('Error getting chat users:', error);
    return [];
  }
};