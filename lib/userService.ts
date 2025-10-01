import { auth } from './firebase';
import { updateProfile } from 'firebase/auth';

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

const formatUsername = (username: string): string => {
  return username.replace(/\s+/g, '_');
};

const isUsernameAvailable = (username: string): boolean => {
  const formattedUsername = formatUsername(username);
  const allUsers = JSON.parse(localStorage.getItem('dhirofans_usernames') || '[]');
  return !allUsers.includes(formattedUsername);
};

const canChangeUsername = (lastChange?: number): boolean => {
  if (!lastChange) return true;
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return lastChange < oneMonthAgo;
};

const addUsernameToRegistry = (username: string) => {
  const formattedUsername = formatUsername(username);
  const allUsers = JSON.parse(localStorage.getItem('dhirofans_usernames') || '[]');
  if (!allUsers.includes(formattedUsername)) {
    allUsers.push(formattedUsername);
    localStorage.setItem('dhirofans_usernames', JSON.stringify(allUsers));
  }
};

const removeUsernameFromRegistry = (username: string) => {
  const formattedUsername = formatUsername(username);
  const allUsers = JSON.parse(localStorage.getItem('dhirofans_usernames') || '[]');
  const filtered = allUsers.filter((u: string) => u !== formattedUsername);
  localStorage.setItem('dhirofans_usernames', JSON.stringify(filtered));
};

export const saveUserData = async (userData: Partial<UserData>) => {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      displayName: userData.fullName
    });
    
    const existingData = getUserData();
    const newData = { ...existingData, ...userData };
    
    // Handle username changes
    if (userData.username && userData.username !== existingData.username) {
      const formattedUsername = formatUsername(userData.username);
      newData.username = formattedUsername;
      newData.lastUsernameChange = Date.now();
      
      // Remove old username and add new one
      if (existingData.username) {
        removeUsernameFromRegistry(existingData.username);
      }
      addUsernameToRegistry(formattedUsername);
    }
    
    localStorage.setItem(`dhirofans_user_${auth.currentUser.uid}`, JSON.stringify(newData));
  }
};

export const validateUsername = (username: string, currentUsername: string, lastChange?: number): { valid: boolean; error?: string } => {
  const formattedUsername = formatUsername(username);
  
  if (formattedUsername === currentUsername) {
    return { valid: true };
  }
  
  if (!canChangeUsername(lastChange)) {
    return { valid: false, error: 'Solo puedes cambiar tu nombre de usuario una vez al mes' };
  }
  
  if (!isUsernameAvailable(username)) {
    return { valid: false, error: 'Este nombre de usuario no está disponible' };
  }
  
  return { valid: true };
};

export const getAllUsers = (): UserData[] => {
  const users: UserData[] = [];
  const posts = JSON.parse(localStorage.getItem('dhirofans_posts') || '[]');
  const userIds = new Set<string>();
  
  // Obtener IDs de usuarios de las publicaciones
  posts.forEach((post: any) => {
    if (post.userId) {
      userIds.add(post.userId);
    }
  });
  
  // Obtener usuarios de localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('dhirofans_user_')) {
      const userId = key.replace('dhirofans_user_', '');
      userIds.add(userId);
    }
  }
  
  // Crear datos de usuario para cada ID encontrado
  userIds.forEach(userId => {
    const stored = localStorage.getItem(`dhirofans_user_${userId}`);
    if (stored) {
      users.push(JSON.parse(stored));
    } else {
      // Crear datos básicos para usuarios que no han editado su perfil
      const userPost = posts.find((post: any) => post.userId === userId);
      if (userPost) {
        const userData = {
          fullName: getSampleUserData(userPost.username).fullName,
          username: userPost.username || `user_${userId.slice(-6)}`,
          email: '',
          bio: getSampleUserData(userPost.username).bio,
          link: '',
          profilePicture: userPost.profilePicture || '',
          followers: Math.floor(Math.random() * 500),
          following: Math.floor(Math.random() * 200),
          posts: posts.filter((p: any) => p.userId === userId).length
        };
        users.push(userData);
        
        // Guardar el usuario generado
        localStorage.setItem(`dhirofans_user_${userId}`, JSON.stringify(userData));
      }
    }
  });
  
  return users;
};

const getSampleUserData = (username: string) => {
  const sampleData: { [key: string]: { fullName: string; bio: string } } = {
    'maria_garcia': { fullName: 'María García', bio: 'Amante de la fotografía 📸' },
    'carlos_lopez': { fullName: 'Carlos López', bio: 'Creador de contenido 🎥' },
    'ana_martinez': { fullName: 'Ana Martínez', bio: 'Diseñadora gráfica ✨' }
  };
  
  return sampleData[username] || { fullName: username, bio: 'Usuario de DhiorFans' };
};

// Asegurar que los datos de prueba estén disponibles al cargar
const ensureTestData = () => {
  const posts = JSON.parse(localStorage.getItem('dhirofans_posts') || '[]');
  if (posts.length === 0) {
    const { generateTestData } = require('./testData');
    generateTestData();
  }
};

// Ejecutar al cargar el módulo
if (typeof window !== 'undefined') {
  ensureTestData();
}

export const getUserData = (): UserData => {
  if (auth.currentUser) {
    const stored = localStorage.getItem(`dhirofans_user_${auth.currentUser.uid}`);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        ...data,
        email: auth.currentUser.email || data.email
      };
    }
  }
  
  const defaultUsername = auth.currentUser?.email?.split('@')[0] || '';
  const formattedUsername = formatUsername(defaultUsername);
  
  // Register default username
  addUsernameToRegistry(formattedUsername);
  
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

export const getUserDataById = (userId: string): UserData | null => {
  const stored = localStorage.getItem(`dhirofans_user_${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Si no existe, buscar en las publicaciones para crear datos básicos
  const posts = JSON.parse(localStorage.getItem('dhirofans_posts') || '[]');
  const userPost = posts.find((post: any) => post.userId === userId);
  if (userPost) {
    const userData = {
      fullName: getSampleUserData(userPost.username).fullName,
      username: userPost.username || `user_${userId.slice(-6)}`,
      email: '',
      bio: getSampleUserData(userPost.username).bio,
      link: '',
      profilePicture: userPost.profilePicture || '',
      followers: Math.floor(Math.random() * 500),
      following: Math.floor(Math.random() * 200),
      posts: posts.filter((p: any) => p.userId === userId).length
    };
    
    // Guardar el usuario generado
    localStorage.setItem(`dhirofans_user_${userId}`, JSON.stringify(userData));
    return userData;
  }
  
  return null;
};

export const searchUsers = (query: string): UserData[] => {
  if (!query.trim()) return [];
  
  try {
    // Asegurar que hay datos de usuarios disponibles
    const allUsers = getAllUsers();
    
    return allUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.fullName.toLowerCase().includes(query.toLowerCase())
    ).sort((a, b) => {
      // Priorizar coincidencias exactas en username
      const aUsernameMatch = a.username.toLowerCase() === query.toLowerCase();
      const bUsernameMatch = b.username.toLowerCase() === query.toLowerCase();
      if (aUsernameMatch && !bUsernameMatch) return -1;
      if (!aUsernameMatch && bUsernameMatch) return 1;
      
      // Luego por nombre completo
      return a.fullName.localeCompare(b.fullName);
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};