import { auth, db } from './firebase';
import { getUserData } from './userService';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

export interface Reel {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  profilePicture: string;
  videoUrl: string;
  description: string;
  timestamp: number;
  mediaType?: 'image' | 'video';
  title?: string;
}

export const saveReel = async (videoFile: File, description: string): Promise<Reel> => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado');
  
  const userData = await getUserData();
  const videoUrl = URL.createObjectURL(videoFile);
  
  const reelData = {
    userId: auth.currentUser.uid,
    username: userData.username,
    fullName: userData.fullName,
    profilePicture: userData.profilePicture || '',
    videoUrl,
    description,
    timestamp: Timestamp.now()
  };
  
  const docRef = await addDoc(collection(db, 'reels'), reelData);
  
  // Update user posts count
  const { saveUserData } = await import('./userService');
  await saveUserData({ posts: userData.posts + 1 });
  
  return {
    id: docRef.id,
    ...reelData,
    timestamp: reelData.timestamp.toMillis()
  };
};

export const getReels = async (): Promise<Reel[]> => {
  const q = query(collection(db, 'reels'), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  const reels: Reel[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    reels.push({
      id: doc.id,
      ...data,
      timestamp: (data.timestamp as Timestamp).toMillis(),
    } as Reel);
  });
  return reels;
};