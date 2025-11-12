import { db } from './firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, addDoc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { getUserDataById, UserData, UserWithId } from './userService';

export interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isAvatar?: boolean;
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

// Enviar mensaje con validación y manejo robusto
export const sendMessage = async (senderId: string, receiverId: string, content: string): Promise<void> => {
  // Validaciones
  if (!senderId || !receiverId || !content?.trim()) {
    throw new Error('Parámetros requeridos faltantes para enviar mensaje');
  }
  
  if (senderId === receiverId) {
    throw new Error('No puedes enviarte mensajes a ti mismo');
  }
  
  const trimmedContent = content.trim();
  if (trimmedContent.length > 1000) {
    throw new Error('El mensaje es demasiado largo');
  }

  const messagesRef = collection(db, 'messages');
  const messageData = {
    senderId,
    receiverId,
    content: trimmedContent,
    timestamp: Timestamp.now(),
    isRead: false
  };
  
  await addDoc(messagesRef, messageData);
};

// Escuchar mensajes en tiempo real con manejo robusto de errores
export const listenToMessages = (
  currentUserId: string, 
  otherUserId: string, 
  callback: (messages: Message[]) => void
) => {
  if (!currentUserId || !otherUserId) {
    console.warn('Parámetros faltantes para escuchar mensajes');
    return () => {};
  }

  const messagesRef = collection(db, 'messages');
  const messages = new Map<string, Message>();
  let unsubscribe1: (() => void) | null = null;
  let unsubscribe2: (() => void) | null = null;
  let retryCount = 0;
  const maxRetries = 3;
  
  const updateMessages = () => {
    try {
      const sortedMessages = Array.from(messages.values())
        .sort((a, b) => a.timestamp - b.timestamp);
      callback(sortedMessages);
    } catch (error) {
      console.error('Error actualizando mensajes:', error);
    }
  };

  const processSnapshot = (querySnapshot: any, source: string) => {
    try {
      querySnapshot.forEach((docSnap: any) => {
        try {
          const data = docSnap.data();
          
          // Validar datos antes de procesar
          if (data.senderId && data.receiverId && data.content && data.timestamp) {
            messages.set(docSnap.id, {
              id: docSnap.id,
              senderId: data.senderId,
              receiverId: data.receiverId,
              content: data.content,
              timestamp: data.timestamp.toMillis(),
              isRead: data.isRead || false
            });
          }
        } catch (docError) {
          console.warn(`Error procesando mensaje individual (${source}):`, docError);
        }
      });
      updateMessages();
      retryCount = 0; // Reset en caso de éxito
    } catch (error) {
      console.error(`Error procesando snapshot (${source}):`, error);
    }
  };

  const handleError = (error: any, source: string) => {
    console.error(`Error en listener de mensajes (${source}):`, error);
    
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Reintentando listener de mensajes (${retryCount}/${maxRetries})`);
      
      setTimeout(() => {
        setupListeners();
      }, Math.pow(2, retryCount) * 1000);
    } else {
      console.error('Máximo de reintentos alcanzado para mensajes');
      callback([]); // Callback con array vacío
    }
  };

  const setupListeners = () => {
    try {
      // Limpiar listeners anteriores
      if (unsubscribe1) unsubscribe1();
      if (unsubscribe2) unsubscribe2();
      
      // Query para mensajes enviados por el usuario actual
      let q1, q2;
      try {
        q1 = query(
          messagesRef,
          where('senderId', '==', currentUserId),
          where('receiverId', '==', otherUserId),
          orderBy('timestamp', 'asc')
        );
        
        q2 = query(
          messagesRef,
          where('senderId', '==', otherUserId),
          where('receiverId', '==', currentUserId),
          orderBy('timestamp', 'asc')
        );
      } catch (indexError) {
        console.warn('Usando consultas sin orderBy para listeners de mensajes');
        q1 = query(
          messagesRef,
          where('senderId', '==', currentUserId),
          where('receiverId', '==', otherUserId)
        );
        
        q2 = query(
          messagesRef,
          where('senderId', '==', otherUserId),
          where('receiverId', '==', currentUserId)
        );
      }

      unsubscribe1 = onSnapshot(q1, 
        (querySnapshot) => processSnapshot(querySnapshot, 'sent'),
        (error) => {
          // Si es error de índice, reintentar con consulta simple
          if (error.message?.includes('index') || error.code === 'failed-precondition') {
            console.log('Reintentando con consulta simple para mensajes enviados');
            const simpleQ1 = query(
              messagesRef,
              where('senderId', '==', currentUserId),
              where('receiverId', '==', otherUserId)
            );
            unsubscribe1 = onSnapshot(simpleQ1, 
              (snapshot) => processSnapshot(snapshot, 'sent'),
              () => callback([])
            );
          } else {
            handleError(error, 'sent');
          }
        }
      );
      
      unsubscribe2 = onSnapshot(q2, 
        (querySnapshot) => processSnapshot(querySnapshot, 'received'),
        (error) => {
          // Si es error de índice, reintentar con consulta simple
          if (error.message?.includes('index') || error.code === 'failed-precondition') {
            console.log('Reintentando con consulta simple para mensajes recibidos');
            const simpleQ2 = query(
              messagesRef,
              where('senderId', '==', otherUserId),
              where('receiverId', '==', currentUserId)
            );
            unsubscribe2 = onSnapshot(simpleQ2, 
              (snapshot) => processSnapshot(snapshot, 'received'),
              () => callback([])
            );
          } else {
            handleError(error, 'received');
          }
        }
      );
      
    } catch (error) {
      console.error('Error configurando listeners de mensajes:', error);
      callback([]);
    }
  };
  
  // Inicializar listeners
  setupListeners();

  // Retornar función para limpiar listeners
  return () => {
    if (unsubscribe1) unsubscribe1();
    if (unsubscribe2) unsubscribe2();
  };
};

// Limpiar cache cuando sea necesario
export const clearChatCache = (): void => {
  conversationsCache = null;
};

// Marcar mensajes como leídos con procesamiento por lotes
export const markMessagesAsRead = async (currentUserId: string, otherUserId: string): Promise<void> => {
  if (!currentUserId || !otherUserId) {
    console.warn('Parámetros faltantes para marcar mensajes como leídos');
    return;
  }

  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '==', otherUserId),
      where('receiverId', '==', currentUserId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;
    
    const batchSize = 10;
    const docs = querySnapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const updatePromises = batch.map(docSnap => 
        updateDoc(doc(db, 'messages', docSnap.id), { isRead: true })
      );
      await Promise.all(updatePromises);
    }
    
    conversationsCache = null;
  } catch (error) {
    console.error('Error marcando mensajes como leídos:', error);
  }
};

// Obtener conversaciones con cache y manejo robusto
let conversationsCache: { userId: string; conversations: Conversation[]; timestamp: number } | null = null;
const CONVERSATIONS_CACHE_DURATION = 30000; // 30 segundos

export const getConversations = async (currentUserId: string): Promise<Conversation[]> => {
  if (!currentUserId) {
    console.warn('UserId no proporcionado para obtener conversaciones');
    return [];
  }

  // Usar cache si está disponible y es reciente
  if (conversationsCache && 
      conversationsCache.userId === currentUserId && 
      (Date.now() - conversationsCache.timestamp) < CONVERSATIONS_CACHE_DURATION) {
    return conversationsCache.conversations;
  }

  try {
    const messagesRef = collection(db, 'messages');
    const conversationMap = new Map<string, Conversation>();
    
    let receivedSnapshot;
    try {
      // Intentar con orderBy primero
      const receivedQuery = query(
        messagesRef,
        where('receiverId', '==', currentUserId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      receivedSnapshot = await getDocs(receivedQuery);
    } catch (error: any) {
      // Si falla por índice, usar consulta simple
      if (error.message?.includes('index') || error.code === 'failed-precondition') {
        console.warn('Usando consulta sin orderBy para mensajes recibidos');
        const simpleQuery = query(
          messagesRef,
          where('receiverId', '==', currentUserId),
          limit(100)
        );
        receivedSnapshot = await getDocs(simpleQuery);
      } else {
        throw error;
      }
    }
    
    // Procesar mensajes recibidos con manejo de errores individual
    const receivedPromises = receivedSnapshot.docs.map(async (docSnap) => {
      try {
        const data = docSnap.data();
        const otherUserId = data.senderId;
        
        if (!conversationMap.has(otherUserId)) {
          const userData = await getUserDataById(otherUserId);
          if (userData) {
            conversationMap.set(otherUserId, {
              id: otherUserId,
              userId: otherUserId,
              userName: userData.fullName || userData.username || 'Usuario',
              userAvatar: userData.profilePicture,
              isAvatar: userData.isAvatar || false,
              lastMessage: data.content || '',
              timestamp: data.timestamp?.toMillis() || Date.now(),
              unreadCount: data.isRead ? 0 : 1,
              isRead: data.isRead || false
            });
          }
        }
      } catch (error) {
        console.warn('Error procesando mensaje recibido:', error);
      }
    });
    
    await Promise.allSettled(receivedPromises);
    
    // Obtener mensajes enviados para completar conversaciones
    let sentSnapshot;
    try {
      const sentQuery = query(
        messagesRef,
        where('senderId', '==', currentUserId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      sentSnapshot = await getDocs(sentQuery);
    } catch (error: any) {
      // Si falla por índice, usar consulta simple
      if (error.message?.includes('index') || error.code === 'failed-precondition') {
        console.warn('Usando consulta sin orderBy para mensajes enviados');
        const simpleQuery = query(
          messagesRef,
          where('senderId', '==', currentUserId),
          limit(100)
        );
        sentSnapshot = await getDocs(simpleQuery);
      } else {
        throw error;
      }
    }
    
    const sentPromises = sentSnapshot.docs.map(async (docSnap) => {
      try {
        const data = docSnap.data();
        const otherUserId = data.receiverId;
        
        if (!conversationMap.has(otherUserId) || 
            (conversationMap.get(otherUserId)?.timestamp || 0) < (data.timestamp?.toMillis() || 0)) {
          const userData = await getUserDataById(otherUserId);
          if (userData) {
            conversationMap.set(otherUserId, {
              id: otherUserId,
              userId: otherUserId,
              userName: userData.fullName || userData.username || 'Usuario',
              userAvatar: userData.profilePicture,
              isAvatar: userData.isAvatar || false,
              lastMessage: data.content || '',
              timestamp: data.timestamp?.toMillis() || Date.now(),
              unreadCount: 0,
              isRead: true
            });
          }
        }
      } catch (error) {
        console.warn('Error procesando mensaje enviado:', error);
      }
    });
    
    await Promise.allSettled(sentPromises);
    
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Actualizar cache
    conversationsCache = {
      userId: currentUserId,
      conversations,
      timestamp: Date.now()
    };
    
    return conversations;
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
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