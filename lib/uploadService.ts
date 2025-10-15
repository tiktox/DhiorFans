import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const uploadFile = async (file: File, userId: string): Promise<string> => {
  if (!file) throw new Error('No se seleccionó archivo');
  if (!userId) throw new Error('Usuario no autenticado');
  
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  const isAudio = file.type.startsWith('audio/');
  
  if (!isVideo && !isImage && !isAudio) {
    throw new Error('Solo se permiten imágenes, videos y audios');
  }
  
  // Validar tamaño según tipo
  let maxSize = 10 * 1024 * 1024; // 10MB por defecto
  if (isVideo) maxSize = 100 * 1024 * 1024; // 100MB videos
  if (isAudio) maxSize = 20 * 1024 * 1024; // 20MB audios
  
  if (file.size > maxSize) {
    const sizeText = isVideo ? '100MB' : isAudio ? '20MB' : '10MB';
    throw new Error(`Archivo demasiado grande (máximo ${sizeText})`);
  }
  
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  
  // Usar rutas según las reglas de Firebase
  let path = `posts/images/${userId}/${fileName}`;
  if (isVideo) path = `posts/videos/${userId}/${fileName}`;
  if (isAudio) path = `posts/audios/${userId}/${fileName}`;
  
  const storageRef = ref(storage, path);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Error al subir el archivo');
  }
};

export const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
  if (!file) throw new Error('No se seleccionó archivo');
  if (!userId) throw new Error('Usuario no autenticado');
  
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten imágenes para el perfil');
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Imagen demasiado grande (máximo 5MB)');
  }
  
  const timestamp = Date.now();
  const fileName = `profile_${timestamp}.${file.type.split('/')[1]}`;
  const storageRef = ref(storage, `profile/${userId}/${fileName}`);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Error al subir la foto de perfil');
  }
};