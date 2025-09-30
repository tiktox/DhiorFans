import { auth } from './firebase';
import { getUserData } from './userService';

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

export const saveReel = (videoFile: File, description: string): Promise<Reel> => {
  return new Promise(async (resolve) => {
    const userData = getUserData();
    const videoUrl = URL.createObjectURL(videoFile);
    
    const reel: Reel = {
      id: Date.now().toString(),
      userId: auth.currentUser?.uid || '',
      username: userData.username,
      fullName: userData.fullName,
      profilePicture: userData.profilePicture || '',
      videoUrl,
      description,
      timestamp: Date.now()
    };

    const existingReels = JSON.parse(localStorage.getItem('dhirofans_reels') || '[]');
    existingReels.unshift(reel);
    localStorage.setItem('dhirofans_reels', JSON.stringify(existingReels));
    
    // Update user posts count
    const { saveUserData } = await import('./userService');
    await saveUserData({ posts: userData.posts + 1 });
    
    resolve(reel);
  });
};

export const getReels = (): Reel[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('dhirofans_reels') || '[]');
};