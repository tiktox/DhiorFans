import { auth, db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, where, Timestamp, doc } from 'firebase/firestore';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  timestamp: number;
  parentId?: string; // Para respuestas
}

const commentsCollection = collection(db, 'comments');

export const addComment = async (postId: string, content: string, parentId?: string): Promise<Comment> => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado');
  if (!content.trim()) throw new Error('El comentario no puede estar vacío');

  const commentData = {
    postId,
    userId: auth.currentUser.uid,
    content: content.trim(),
    timestamp: Timestamp.now(),
    ...(parentId && { parentId })
  };

  const docRef = await addDoc(commentsCollection, commentData);
  
  return {
    id: docRef.id,
    ...commentData,
    timestamp: commentData.timestamp.toMillis()
  };
};

export const getPostComments = async (postId: string): Promise<Comment[]> => {
  try {
    const q = query(
      commentsCollection, 
      where('postId', '==', postId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        timestamp: (data.timestamp as Timestamp).toMillis()
      } as Comment);
    });
    
    return comments;
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    return [];
  }
};

export const getCommentsWithReplies = async (postId: string) => {
  const allComments = await getPostComments(postId);
  
  // Separar comentarios principales de respuestas
  const mainComments = allComments.filter(comment => !comment.parentId);
  const replies = allComments.filter(comment => comment.parentId);
  
  // Organizar respuestas por comentario padre
  const commentsWithReplies = mainComments.map(comment => ({
    ...comment,
    replies: replies.filter(reply => reply.parentId === comment.id)
      .sort((a, b) => a.timestamp - b.timestamp) // Respuestas más antiguas primero
  }));
  
  return commentsWithReplies;
};