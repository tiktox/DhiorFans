import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, where, Timestamp } from 'firebase/firestore';
export interface Post {
  id: string;
  userId: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: number;
  likes: number;
  comments: number;
}

const postsCollection = collection(db, 'posts');

export const createPost = async (postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'username' | 'profilePicture'>): Promise<Post> => {
  if (!postData.title?.trim()) throw new Error('El título es requerido');
  if (!postData.mediaUrl) throw new Error('La URL del archivo es requerida');
  if (!postData.userId) throw new Error('El usuario es requerido');
  
  const newPostData = {
    ...postData,
    timestamp: Timestamp.now(),
    likes: 0,
    comments: 0,
    title: postData.title.trim(),
    description: postData.description?.trim() || ''
  };
  
  const docRef = await addDoc(postsCollection, newPostData);
  console.log('Nueva publicación creada en Firestore con ID:', docRef.id);

  return {
    ...newPostData,
    id: docRef.id,
    timestamp: newPostData.timestamp.toMillis() // Convertir a número para el cliente
  };
};

export const getAllPosts = async (): Promise<Post[]> => {
  const q = query(postsCollection, orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  const posts: Post[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    posts.push({
      id: doc.id,
      ...data,
      timestamp: (data.timestamp as Timestamp).toMillis(),
    } as Post);
  });
  console.log('🔍 getAllPosts() - Posts encontrados en Firestore:', posts.length);
  return posts;
};



export const getUserPosts = async (userId: string): Promise<Post[]> => {
  const q = query(postsCollection, where('userId', '==', userId), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  const posts: Post[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    posts.push({
      id: doc.id,
      ...data,
      timestamp: (data.timestamp as Timestamp).toMillis(),
    } as Post);
  });
  return posts;
};

export const searchPostsByTitle = async (query: string): Promise<Post[]> => {
  if (!query.trim()) return [];
  // Nota: Firestore no soporta búsquedas de tipo "includes" de forma nativa y eficiente.
  // Esta implementación trae todos los posts y filtra en el cliente.
  // Para apps grandes, se recomienda un servicio de búsqueda como Algolia.
  const posts = await getAllPosts();
  return posts.filter(post => 
    post.title.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => b.timestamp - a.timestamp);
};

export const deletePost = async (postId: string, userId: string): Promise<boolean> => {
  // En una app real, se debería verificar que el `userId` tiene permiso para borrar,
  // idealmente con Reglas de Seguridad de Firestore.
  const postDocRef = doc(db, 'posts', postId);
  await deleteDoc(postDocRef);
  console.log('Publicación eliminada de Firestore:', postId);
  return true;
};