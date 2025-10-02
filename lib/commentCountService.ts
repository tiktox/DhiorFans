import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const getPostCommentsCount = async (postId: string): Promise<number> => {
  try {
    const commentsCollection = collection(db, 'comments');
    const q = query(commentsCollection, where('postId', '==', postId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error obteniendo conteo de comentarios:', error);
    return 0;
  }
};