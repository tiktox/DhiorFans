import { auth, db, storage } from './firebase'; // 1. Importar storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // 2. Importar funciones de storage
import { getUserData } from './userService';
import { createPost } from './postService';
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

export const saveReel = async (videoFile: File, description: string, title?: string): Promise<Reel> => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado');
  
  // 3. Subir el video a Firebase Storage
  const storageRef = ref(storage, `reels/${auth.currentUser.uid}/${Date.now()}-${videoFile.name}`);
  await uploadBytes(storageRef, videoFile);
  const videoUrl = await getDownloadURL(storageRef); // 4. Obtener la URL pública

  const userData = await getUserData();
  
  // Crear el post en la colección de posts para que aparezca en el perfil
  const postData = {
    userId: auth.currentUser.uid,
    title: title || description || 'Video',
    description: description || '',
    mediaUrl: videoUrl, // 5. Usar la URL de Firebase Storage
    mediaType: 'video' as const
  };
  
  const createdPost = await createPost(postData);
  
  const reelData = {
    userId: auth.currentUser.uid,
    username: userData.username,
    fullName: userData.fullName,
    profilePicture: userData.profilePicture || '',
    videoUrl,
    description,
    timestamp: Timestamp.now(),
    commentsCount: 0 // Inicializar el contador de comentarios
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