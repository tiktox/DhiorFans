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
  getDoc,
} from 'firebase/firestore';
import { getUserData } from './userService';
import { notifyComment } from './notificationService';

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
  postCollection: 'reels' | 'posts' = 'reels',
  parentId?: string
): Promise<Comment> => {
  console.log('🔍 createComment iniciado:', { postId, text: text.substring(0, 50), postCollection, parentId });
  
  if (!auth.currentUser) {
    console.error('❌ Usuario no autenticado');
    throw new Error('Usuario no autenticado para comentar.');
  }
  
  if (!text.trim()) {
    console.error('❌ Comentario vacío');
    throw new Error('El comentario no puede estar vacío.');
  }
  
  if (text.length > 500) {
    console.error('❌ Comentario muy largo:', text.length);
    throw new Error('El comentario excede el límite de 500 caracteres.');
  }

  console.log('🔍 Obteniendo datos del usuario...');
  const userData = await getUserData();
  console.log('✅ Datos del usuario obtenidos:', { username: userData.username, uid: auth.currentUser.uid });

  const commentData = {
    postId: postId.trim(),
    userId: auth.currentUser.uid,
    username: userData.username || 'Usuario',
    profilePicture: userData.profilePicture || '',
    text: text.trim(),
    timestamp: Timestamp.now(),
    ...(parentId && { parentId: parentId.trim() }),
  };

  console.log('🔍 Datos del comentario preparados:', commentData);
  console.log('🔍 Intentando guardar en Firestore...');
  
  let docRef;
  try {
    docRef = await addDoc(collection(db, 'comments'), commentData);
    console.log('✅ Comentario guardado exitosamente en Firestore:', docRef.id);
  } catch (firestoreError) {
    console.error('❌ Error específico de Firestore:', firestoreError);
    throw firestoreError;
  }

  try {
    console.log('🔍 Actualizando contador de comentarios...');
    
    // Intentar encontrar el post en la colección especificada primero
    let postRef = doc(db, postCollection, postId);
    let postDoc = await getDoc(postRef);
    let actualCollection = postCollection;
    
    // Si no se encuentra, intentar en la otra colección
    if (!postDoc.exists()) {
      const alternativeCollection = postCollection === 'posts' ? 'reels' : 'posts';
      console.log('🔍 Post no encontrado en', postCollection, ', intentando en', alternativeCollection);
      
      postRef = doc(db, alternativeCollection, postId);
      postDoc = await getDoc(postRef);
      actualCollection = alternativeCollection;
    }
    
    if (postDoc.exists()) {
      console.log('✅ Post encontrado en colección:', actualCollection);
      await updateDoc(postRef, { commentsCount: increment(1) });
      
      const postOwnerId = postDoc.data().userId;
      if (postOwnerId !== auth.currentUser.uid) {
        console.log('🔍 Creando notificación para el dueño del post...');
        await notifyComment(postOwnerId, auth.currentUser.uid, postId, docRef.id);
        console.log('✅ Notificación creada');
      }
      console.log('✅ Contador de comentarios actualizado');
    } else {
      console.warn('⚠️ Post no encontrado en ninguna colección, ID:', postId);
      console.warn('⚠️ Comentario guardado sin actualizar contador');
    }
  } catch (error) {
    console.error('❌ Error actualizando contador de comentarios:', error);
    console.error('❌ Stack trace:', (error as Error).stack);
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
  try {
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
  } catch (error: any) {
    if (error.code === 'failed-precondition' && error.message.includes('index is currently building')) {
      // Fallback: query sin orderBy mientras el índice se construye
      let fallbackQ = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        limit(pageSize + 1)
      );

      if (lastDoc) {
        fallbackQ = query(
          collection(db, 'comments'),
          where('postId', '==', postId),
          startAfter(lastDoc),
          limit(pageSize + 1)
        );
      }

      const querySnapshot = await getDocs(fallbackQ);
      const docs = querySnapshot.docs;
      const hasMore = docs.length > pageSize;
      
      const comments = docs.slice(0, pageSize).map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toMillis(),
      })) as Comment[];
      
      // Ordenar manualmente mientras el índice se construye
      comments.sort((a, b) => a.timestamp - b.timestamp);

      return {
        comments,
        lastDoc: hasMore ? docs[pageSize - 1] : undefined,
        hasMore,
      };
    }
    throw error;
  }
};