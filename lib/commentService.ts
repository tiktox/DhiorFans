import { auth, db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { getUserData } from './userService';

export interface Comment {
  id: string;
  postId: string; // ID del Reel o Post al que pertenece el comentario
  userId: string;
  username: string;
  profilePicture: string;
  text: string;
  timestamp: number;
  parentId?: string; // ID del comentario padre para respuestas
}

/**
 * Guarda un nuevo comentario para un post específico.
 * @param postId El ID del post (o reel) que se está comentando.
 * @param text El contenido del comentario.
 * @returns El objeto del comentario creado.
 */
export const createComment = async (
  postId: string,
  text: string,
  postCollection: 'reels' | 'posts' = 'reels', // Parámetro opcional para especificar la colección
  parentId?: string // ID del comentario padre para respuestas
): Promise<Comment> => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado para comentar.');
  if (!text.trim()) throw new Error('El comentario no puede estar vacío.');

  const userData = await getUserData();

  const commentData = {
    postId,
    userId: auth.currentUser.uid,
    username: userData.username,
    profilePicture: userData.profilePicture || '',
    text: text.trim(),
    timestamp: Timestamp.now(),
    ...(parentId && { parentId }),
  };

  const docRef = await addDoc(collection(db, 'comments'), commentData);

  // Incrementar el contador de comentarios en la colección correcta.
  // Se envuelve en un try/catch para que la creación del comentario no falle si el post no se encuentra.
  try {
    const postRef = doc(db, postCollection, postId);
    await updateDoc(postRef, { commentsCount: increment(1) });
  } catch (error) {
    const sanitizedPostId = postId.replace(/[\r\n\t]/g, '');
    const sanitizedCollection = postCollection.replace(/[\r\n\t]/g, '');
    console.warn(`No se pudo actualizar el contador de comentarios para el post ${sanitizedPostId} en la colección ${sanitizedCollection}:`, error);
  }

  return {
    id: docRef.id,
    ...commentData,
    timestamp: commentData.timestamp.toMillis(),
  };
};

/**
 * Obtiene todos los comentarios para un post específico, ordenados por fecha.
 * @param postId El ID del post (o reel).
 * @returns Una lista de comentarios.
 */
export const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
  const q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('timestamp', 'asc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: (doc.data().timestamp as Timestamp).toMillis(),
  })) as Comment[];
};