import { db } from './firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
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

// Obtener conversaciones del usuario actual
export const getConversations = async (currentUserId: string): Promise<Conversation[]> => {
  try {
    // Por ahora retornamos array vacío ya que no hay mensajes reales
    // En el futuro se implementará la lógica de mensajes
    return [];
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