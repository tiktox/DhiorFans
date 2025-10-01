import { auth, db } from './firebase';
import { collection, addDoc, deleteDoc, getDocs, query, where, doc, Timestamp } from 'firebase/firestore';

export interface Like {
  id: string;
  postId: string;
  userId: string;
  timestamp: number;
}

const likesCollection = collection(db, 'likes');

export const toggleLike = async (postId: string): Promise<{ isLiked: boolean; likesCount: number }> => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado');
  
  const userId = auth.currentUser.uid;
  
  // Verificar si ya existe el like
  const existingLike = await checkUserLike(postId, userId);
  
  if (existingLike) {
    // Quitar like
    await deleteDoc(doc(db, 'likes', existingLike.id));
  } else {
    // Agregar like
    await addDoc(likesCollection, {
      postId,
      userId,
      timestamp: Timestamp.now()
    });
  }
  
  // Obtener nuevo contador
  const likesCount = await getPostLikesCount(postId);
  
  return {
    isLiked: !existingLike,
    likesCount
  };
};

export const checkUserLike = async (postId: string, userId: string): Promise<Like | null> => {
  const q = query(likesCollection, where('postId', '==', postId), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      postId: data.postId,
      userId: data.userId,
      timestamp: (data.timestamp as Timestamp).toMillis()
    };
  }
  
  return null;
};

export const getPostLikesCount = async (postId: string): Promise<number> => {
  const q = query(likesCollection, where('postId', '==', postId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

export const getPostLikes = async (postId: string): Promise<Like[]> => {
  const q = query(likesCollection, where('postId', '==', postId));
  const querySnapshot = await getDocs(q);
  const likes: Like[] = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    likes.push({
      id: doc.id,
      postId: data.postId,
      userId: data.userId,
      timestamp: (data.timestamp as Timestamp).toMillis()
    });
  });
  
  return likes;
};