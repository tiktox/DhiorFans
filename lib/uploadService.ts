import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const uploadFile = async (file: File, userId: string): Promise<string> => {
  if (!file) throw new Error('No se seleccionó archivo');
  if (!userId) throw new Error('Usuario no autenticado');
  
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  
  if (!isVideo && !isImage) {
    throw new Error('Solo se permiten imágenes y videos');
  }
  
  // Validar tamaño según tipo
  const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB videos, 10MB imágenes
  if (file.size > maxSize) {
    throw new Error(`Archivo demasiado grande (máximo ${isVideo ? '100MB' : '10MB'})`);
  }
  
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  
  // Usar rutas según las reglas de Firebase
  const path = isVideo 
    ? `posts/videos/${userId}/${fileName}`
    : `posts/images/${userId}/${fileName}`;
  
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