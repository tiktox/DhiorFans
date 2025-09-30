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
  const allUsers = JSON.parse(localStorage.getItem('allUsernames') || '[]');
  return !allUsers.includes(formattedUsername);
};

const canChangeUsername = (lastChange?: number): boolean => {
  if (!lastChange) return true;
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return lastChange < oneMonthAgo;
};

const addUsernameToRegistry = (username: string) => {
  const formattedUsername = formatUsername(username);
  const allUsers = JSON.parse(localStorage.getItem('allUsernames') || '[]');
  if (!allUsers.includes(formattedUsername)) {
    allUsers.push(formattedUsername);
    localStorage.setItem('allUsernames', JSON.stringify(allUsers));
  }
};

const removeUsernameFromRegistry = (username: string) => {
  const formattedUsername = formatUsername(username);
  const allUsers = JSON.parse(localStorage.getItem('allUsernames') || '[]');
  const filtered = allUsers.filter((u: string) => u !== formattedUsername);
  localStorage.setItem('allUsernames', JSON.stringify(filtered));
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
    
    localStorage.setItem(`userData_${auth.currentUser.uid}`, JSON.stringify(newData));
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
  const allUsernames = JSON.parse(localStorage.getItem('allUsernames') || '[]');
  const users: UserData[] = [];
  
  // Get all user data from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('userData_')) {
      const userData = localStorage.getItem(key);
      if (userData) {
        users.push(JSON.parse(userData));
      }
    }
  }
  
  return users;
};

export const getUserData = (): UserData => {
  if (auth.currentUser) {
    const stored = localStorage.getItem(`userData_${auth.currentUser.uid}`);
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
  const stored = localStorage.getItem(`userData_${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
};