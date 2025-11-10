import { auth, db } from './firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { initializeNewUserTokens } from './tokenService';
import { errorHandler } from './errorHandler';

export interface UserData {
  fullName: string;
  username: string;
  email: string;
  bio?: string;
  link?: string;
  gender?: 'Hombre' | 'Mujer';
  profilePicture?: string;
  originalProfilePicture?: string;
  lastRealProfilePicture?: string;
  avatar?: string;
  avatars?: string[];
  purchasedAvatars?: string[];
  isAvatar?: boolean;
  lastUsernameChange?: number;
  followers: number;
  following: number;
  posts: number;
  cameraPermission?: 'granted' | 'denied' | 'prompt';
  microphonePermission?: 'granted' | 'denied' | 'prompt';
}

class UserStateManager {
  private static instance: UserStateManager;
  private authListener: (() => void) | null = null;
  
  static getInstance(): UserStateManager {
    if (!UserStateManager.instance) {
      UserStateManager.instance = new UserStateManager();
    }
    return UserStateManager.instance;
  }
  
  initialize() {
    if (this.authListener) return;
    
    this.authListener = auth.onAuthStateChanged(() => {
      this.clearCache();
    });
  }
  
  clearCache() {
    getUserDataCache = null;
    getUserDataPromise = null;
  }
  
  cleanup() {
    if (this.authListener) {
      this.authListener();
      this.authListener = null;
    }
  }
}

const stateManager = UserStateManager.getInstance();
if (typeof window !== 'undefined') {
  stateManager.initialize();
}

const formatUsername = (username: string): string => {
  return username.replace(/\s+/g, '_').toLowerCase();
};

let getUserDataCache: { data: UserData; timestamp: number } | null = null;
let getUserDataPromise: Promise<UserData> | null = null;
const CACHE_DURATION = 5000;

let bypassMode = false;
let bypassData: UserData | null = null;

export const saveUserData = async (userData: Partial<UserData>) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }
  
  try {
    const cleanData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userRef, cleanData, { merge: true });
    
    if (bypassData) {
      bypassData = { ...bypassData, ...cleanData };
    }
    
    getUserDataCache = null;
    
  } catch (error: any) {
    errorHandler.logError(error, 'saveUserData');
    if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
      if (bypassData) {
        bypassData = { ...bypassData, ...userData };
        return;
      }
    }
    throw new Error('Error al guardar datos del usuario');
  }
};

const canChangeUsername = (lastChange?: number): boolean => {
  if (!lastChange) return true;
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return lastChange < oneMonthAgo;
};

const isUsernameAvailable = async (username: string, currentUserId?: string): Promise<boolean> => {
  try {
    const formattedUsername = formatUsername(username);
    const q = query(collection(db, 'users'), where('username', '==', formattedUsername));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return true;
    
    if (currentUserId) {
      const docs = querySnapshot.docs;
      return docs.length === 1 && docs[0].id === currentUserId;
    }
    
    return false;
  } catch (error) {
    errorHandler.logError(error, 'isUsernameAvailable');
    return false;
  }
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  return isUsernameAvailable(username);
};

export const validateUsername = async (username: string, currentUsername: string, lastChange?: number): Promise<{ valid: boolean; error?: string }> => {
  try {
    const formattedUsername = formatUsername(username);
    
    if (formattedUsername === currentUsername) {
      return { valid: true };
    }
    
    if (!canChangeUsername(lastChange)) {
      return { valid: false, error: 'Solo puedes cambiar tu nombre de usuario una vez al mes' };
    }
    
    if (!await isUsernameAvailable(username)) {
      return { valid: false, error: 'Este nombre de usuario no está disponible' };
    }
    
    return { valid: true };
  } catch (error) {
    errorHandler.logError(error, 'validateUsername');
    return { valid: false, error: 'Error al validar nombre de usuario' };
  }
};

export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: UserData[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserData);
    });
    return users;
  } catch (error) {
    errorHandler.logError(error, 'getAllUsers');
    return [];
  }
};

export const getUserData = async (forceRefresh = false): Promise<UserData> => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  if (!forceRefresh && getUserDataCache && (Date.now() - getUserDataCache.timestamp) < CACHE_DURATION) {
    return getUserDataCache.data;
  }

  if (bypassMode && bypassData) {
    return bypassData;
  }

  if (getUserDataPromise) {
    return getUserDataPromise;
  }

  getUserDataPromise = (async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      const docSnap = await getDoc(userRef);

      let userData: UserData;

      if (docSnap.exists()) {
        userData = docSnap.data() as UserData;
      } else {
        const defaultUsername = auth.currentUser?.email?.split('@')[0] || '';
        const formattedUsername = formatUsername(defaultUsername);
        
        userData = {
          fullName: auth.currentUser?.displayName || defaultUsername,
          username: formattedUsername,
          email: auth.currentUser?.email || '',
          bio: '',
          link: '',
          profilePicture: '',
          followers: 0,
          following: 0,
          posts: 0
        };
        
        await setDoc(userRef, userData);
        try {
          await initializeNewUserTokens(auth.currentUser!.uid);
        } catch (tokenError) {
          errorHandler.logError(tokenError, 'initializeNewUserTokens');
        }
      }
      
      getUserDataCache = { data: userData, timestamp: Date.now() };
      bypassData = userData;
      bypassMode = false;
      return userData;
      
    } catch (error: any) {
      errorHandler.logError(error, 'getUserData');
      
      if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
        bypassMode = true;
        const emergencyData: UserData = {
          fullName: auth.currentUser?.displayName || 'Usuario',
          username: auth.currentUser?.email?.split('@')[0] || 'usuario',
          email: auth.currentUser?.email || '',
          bio: '',
          link: '',
          profilePicture: '',
          followers: 0,
          following: 0,
          posts: 0
        };
        bypassData = emergencyData;
        return emergencyData;
      }
      
      throw new Error('Error al cargar datos del usuario');
    }
  })();

  getUserDataPromise.finally(() => {
    getUserDataPromise = null;
  });

  return getUserDataPromise;
};

export const getUserDataById = async (userId: string): Promise<UserData | null> => {
  if (!userId) return null;
  
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    errorHandler.logError(error, 'getUserDataById');
    return null;
  }
};

export const getUsersDataByIds = async (userIds: string[]): Promise<{[key: string]: UserData}> => {
  const userData: {[key: string]: UserData} = {};
  
  try {
    const promises = userIds.map(async (userId) => {
      if (!userId) return;
      const data = await getUserDataById(userId);
      if (data) {
        userData[userId] = data;
      }
    });
    
    await Promise.all(promises);
    return userData;
  } catch (error) {
    errorHandler.logError(error, 'getUsersDataByIds');
    return {};
  }
};

export interface UserWithId extends UserData {
  id: string;
}

export const searchUsers = async (searchQuery: string): Promise<UserWithId[]> => {
  if (!searchQuery.trim()) return [];
  
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: UserWithId[] = [];
    const lowerQuery = searchQuery.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserData;
      const matchesUsername = userData.username?.toLowerCase().includes(lowerQuery);
      const matchesFullName = userData.fullName?.toLowerCase().includes(lowerQuery);
      
      if (matchesUsername || matchesFullName) {
        users.push({
          ...userData,
          id: doc.id,
          isAvatar: userData.isAvatar || false,
          profilePicture: userData.profilePicture || '',
          bio: userData.bio || ''
        });
      }
    });
    
    return users.sort((a, b) => {
      const aExact = a.username.toLowerCase() === lowerQuery;
      const bExact = b.username.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
    
  } catch (error) {
    errorHandler.logError(error, 'searchUsers');
    return [];
  }
};