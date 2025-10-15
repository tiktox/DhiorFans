import { auth, db } from './firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { initializeNewUserTokens, migrateUserTokens } from './tokenService';

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
  cameraPermission?: 'granted' | 'denied' | 'prompt';
  microphonePermission?: 'granted' | 'denied' | 'prompt';
}

// Removed usersCollection constant to use direct references

const formatUsername = (username: string): string => {
  return username.replace(/\s+/g, '_').toLowerCase();
};

export const saveUserData = async (userData: Partial<UserData>) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }
  
  try {
    // Filtrar valores undefined
    const cleanData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );
    
    console.log('🔄 Guardando datos:', cleanData);
    console.log('👤 Usuario ID:', auth.currentUser.uid);
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userRef, cleanData, { merge: true });
    
    console.log('✅ Datos guardados correctamente en Firebase');
    
    // Verificar que se guardó
    const savedDoc = await getDoc(userRef);
    if (savedDoc.exists()) {
      console.log('✅ Verificación: Datos encontrados en Firebase:', savedDoc.data());
    } else {
      console.log('❌ Verificación: No se encontraron datos en Firebase');
    }
    
  } catch (error: any) {
    console.error('❌ Error en saveUserData:', error);
    if (error.code === 'permission-denied') {
      throw new Error('No tienes permisos para guardar estos datos');
    } else if (error.code === 'unavailable') {
      throw new Error('Servicio no disponible. Inténtalo más tarde');
    } else {
      throw new Error('Error al guardar: ' + (error.message || 'Error desconocido'));
    }
  }
};

const canChangeUsername = (lastChange?: number): boolean => {
  if (!lastChange) return true;
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return lastChange < oneMonthAgo;
};

const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const formattedUsername = formatUsername(username);
  const q = query(collection(db, 'users'), where('username', '==', formattedUsername));
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
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users: UserData[] = [];
  querySnapshot.forEach((doc) => {
    users.push(doc.data() as UserData);
  });
  return users;
};

export const getUserData = async (): Promise<UserData> => {
  if (auth.currentUser) {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    }
    
    // Si no existe, crear datos por defecto y guardarlos
    const defaultUsername = auth.currentUser?.email?.split('@')[0] || '';
    const formattedUsername = formatUsername(defaultUsername);
    
    const defaultData: UserData = {
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
    
    // Guardar los datos por defecto
    console.log('🆕 Creando usuario nuevo con datos:', defaultData);
    await setDoc(userRef, defaultData);
    
    // Inicializar tokens para nuevo usuario
    await initializeNewUserTokens(auth.currentUser.uid);
    
    console.log('✅ Usuario nuevo creado en Firebase con tokens inicializados');
    return defaultData;
  }
  
  throw new Error('Usuario no autenticado');
};

export const getUserDataById = async (userId: string): Promise<UserData | null> => {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserData;
  }
  return null;
};

export const getUsersDataByIds = async (userIds: string[]): Promise<{[key: string]: UserData}> => {
  const userData: {[key: string]: UserData} = {};
  
  const promises = userIds.map(async (userId) => {
    if (!userId) return;
    const data = await getUserDataById(userId);
    if (data) {
      userData[userId] = data;
    }
  });
  
  await Promise.all(promises);
  return userData;
};

export interface UserWithId extends UserData {
  id: string;
}

export const searchUsers = async (searchQuery: string): Promise<UserWithId[]> => {
  if (!searchQuery.trim()) return [];
  
  try {
    // Obtener todos los usuarios y filtrar en cliente
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
          id: doc.id
        });
      }
    });
    
    return users.sort((a, b) => {
      // Priorizar coincidencias exactas en username
      const aExact = a.username.toLowerCase() === lowerQuery;
      const bExact = b.username.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
    
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};