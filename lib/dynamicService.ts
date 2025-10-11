import { auth, db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { uploadFile } from './uploadService';
import { createPost } from './postService';

export interface Dynamic {
  id: string;
  userId: string;
  title: string;
  description: string;
  keywords: string[];
  mediaUrl: string;
  mediaType: 'image' | 'video';
  tokensReward: number;
  timestamp: number;
  isActive: boolean;
}

export const createDynamic = async (
  title: string,
  description: string,
  keywords: string[],
  tokensReward: number,
  file: File
): Promise<any> => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado');
  if (!title.trim() && !description.trim()) throw new Error('El título o descripción es requerido');
  if (keywords.length === 0) throw new Error('Las palabras clave son requeridas');
  if (!file) throw new Error('El archivo es requerido');

  const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
  const mediaUrl = await uploadFile(file, auth.currentUser.uid);

  // Crear como post normal pero con metadatos de dinámica
  const postData = {
    userId: auth.currentUser.uid,
    title: title.trim() || description.trim(),
    description: description.trim() || title.trim(),
    mediaUrl,
    mediaType,
    // Metadatos de dinámica
    isDynamic: true,
    keywords,
    tokensReward,
    isActive: true
  };

  const post = await createPost(postData);
  
  return post;
};