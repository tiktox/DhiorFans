import { auth, db } from './firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

export interface UserData {
  fullName: string;
  username: string;
  email: string;
  bio?: string;
  link?: string;
  gender?: 'Hombre' | 'Mujer';
  profilePicture?: string;
  lastUsernameChange?: number;
  followers: number;
  following: number;
  posts: number;
}

const usersCollection = collection(db, 'users');

const formatUsername = (username: string): string => {
  return username.replace(/\s+/g, '_').toLowerCase();
};

export const saveUserData = async (userData: Partial<UserData>) => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado');
  
  try {
    const userRef = doc(usersCollection, auth.currentUser.uid);
    await setDoc(userRef, userData, { merge: true });
    console.log('Datos de usuario guardados correctamente');
  } catch (error) {
    console.error('Error al guardar datos del usuario:', error);
    throw error;
  }
};

const canChangeUsername = (lastChange?: number): boolean => {
  if (!lastChange) return true;
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return lastChange < oneMonthAgo;
};

const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const formattedUsername = formatUsername(username);
  const q = query(usersCollection, where('username', '==', formattedUsername));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

export const validateUsername = async (username: string, currentUsername: string, lastChange?: number): Promise<{ valid: boolean; error?: string }> => {
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
};

export const getAllUsers = async (): Promise<UserData[]> => {
  const querySnapshot = await getDocs(usersCollection);
  const users: UserData[] = [];
  querySnapshot.forEach((doc) => {
    users.push(doc.data() as UserData);
  });
  return users;
};

export const getUserData = async (): Promise<UserData> => {
  if (auth.currentUser) {
    const userRef = doc(usersCollection, auth.currentUser.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    }
  }
  
  const defaultUsername = auth.currentUser?.email?.split('@')[0] || '';
  const formattedUsername = formatUsername(defaultUsername);
  
  return {
    fullName: auth.currentUser?.displayName || defaultUsername,
    username: formattedUsername,
    email: auth.currentUser?.email || '',
    bio: '',
    link: '',
    gender: undefined,
    profilePicture: '',
    lastUsernameChange: undefined,
    followers: 0,
    following: 0,
    posts: 0
  };
};

export const getUserDataById = async (userId: string): Promise<UserData | null> => {
  if (!userId) return null;
  const userRef = doc(usersCollection, userId);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserData;
  }
  return null;
};

export const searchUsers = async (searchQuery: string): Promise<UserData[]> => {
  if (!searchQuery.trim()) return [];
  
  const lowerCaseQuery = searchQuery.toLowerCase();
  
  // Firestore no soporta búsquedas "includes" de forma nativa.
  // Para una app real, se usaría un servicio como Algolia.
  // Aquí, hacemos dos consultas (una para username, una para fullName) y las unimos.
  
  const usernameQuery = query(usersCollection, 
    where('username', '>=', lowerCaseQuery),
    where('username', '<=', lowerCaseQuery + '\uf8ff')
  );

  const fullNameQuery = query(usersCollection, 
    where('fullName', '>=', lowerCaseQuery),
    where('fullName', '<=', lowerCaseQuery + '\uf8ff')
  );

  try {
    const [usernameSnapshot, fullNameSnapshot] = await Promise.all([
      getDocs(usernameQuery),
      getDocs(fullNameQuery)
    ]);

    const usersMap = new Map<string, UserData>();

    usernameSnapshot.forEach(doc => {
      if (!usersMap.has(doc.id)) {
        usersMap.set(doc.id, { ...doc.data(), id: doc.id } as any);
      }
    });

    fullNameSnapshot.forEach(doc => {
      if (!usersMap.has(doc.id)) {
        usersMap.set(doc.id, { ...doc.data(), id: doc.id } as any);
      }
    });

    return Array.from(usersMap.values());

  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};