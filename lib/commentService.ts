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
  limit,
  startAfter,
  QueryDocumentSnapshot,
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

export interface CommentsPage {
  comments: Comment[];
  lastDoc?: QueryDocumentSnapshot;
  hasMore: boolean;
}

/**
 * Obtiene comentarios paginados para un post específico.
 * @param postId El ID del post (o reel).
 * @param pageSize Número de comentarios por página (default: 10).
 * @param lastDoc Último documento para paginación.
 * @returns Página de comentarios con información de paginación.
 */
export const getCommentsForPost = async (
  postId: string,
  pageSize: number = 10,
  lastDoc?: QueryDocumentSnapshot
): Promise<CommentsPage> => {
  let q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('timestamp', 'asc'),
    limit(pageSize + 1)
  );

  if (lastDoc) {
    q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('timestamp', 'asc'),
      startAfter(lastDoc),
      limit(pageSize + 1)
    );
  }

  const querySnapshot = await getDocs(q);
  const docs = querySnapshot.docs;
  const hasMore = docs.length > pageSize;
  
  const comments = docs.slice(0, pageSize).map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: (doc.data().timestamp as Timestamp).toMillis(),
  })) as Comment[];

  return {
    comments,
    lastDoc: hasMore ? docs[pageSize - 1] : undefined,
    hasMore,
  };
};