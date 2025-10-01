import { auth, db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, where, Timestamp } from 'firebase/firestore';
import { getPostLikesCount, checkUserLike } from './likeService';
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
  likesCount?: number;
  isLikedByUser?: boolean;
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
  console.log('✅ Nueva publicación creada en Firestore:');
  console.log('  - ID:', docRef.id);
  console.log('  - Usuario:', postData.userId);
  console.log('  - Título:', postData.title);
  console.log('  - Tipo:', postData.mediaType);

  return {
    ...newPostData,
    id: docRef.id,
    timestamp: newPostData.timestamp.toMillis() // Convertir a número para el cliente
  };
};

export const getAllPosts = async (): Promise<Post[]> => {
  console.log('🔍 getAllPosts() - Obteniendo todos los posts...');
  const q = query(postsCollection, orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  const posts: Post[] = [];
  
  console.log('🔍 getAllPosts() - Documentos encontrados:', querySnapshot.size);
  
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    const postId = docSnap.id;
    
    // Obtener información de likes
    const likesCount = await getPostLikesCount(postId);
    const isLikedByUser = auth.currentUser ? 
      await checkUserLike(postId, auth.currentUser.uid) !== null : false;
    
    posts.push({
      id: postId,
      ...data,
      timestamp: (data.timestamp as Timestamp).toMillis(),
      likesCount,
      isLikedByUser
    } as Post);
  }
  
  console.log('✅ getAllPosts() - Posts encontrados en Firestore:', posts.length);
  return posts;
};



export const getUserPosts = async (userId: string): Promise<Post[]> => {
  console.log('🔍 getUserPosts() - Buscando posts para usuario:', userId);
  
  try {
    const q = query(postsCollection, where('userId', '==', userId), orderBy('timestamp', 'desc'));
    console.log('🔍 Query creada, ejecutando...');
    
    const querySnapshot = await getDocs(q);
    console.log('🔍 Query ejecutada, documentos encontrados:', querySnapshot.size);
    
    const posts: Post[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const postId = docSnap.id;
      
      // Obtener información de likes
      const likesCount = await getPostLikesCount(postId);
      const isLikedByUser = auth.currentUser ? 
        await checkUserLike(postId, auth.currentUser.uid) !== null : false;
      
      posts.push({
        id: postId,
        ...data,
        timestamp: (data.timestamp as Timestamp).toMillis(),
        likesCount,
        isLikedByUser
      } as Post);
    }
    
    console.log('✅ getUserPosts() - Total posts procesados:', posts.length);
    return posts;
    
  } catch (error) {
    console.error('❌ Error en getUserPosts:', error);
    return [];
  }
};

export const searchPostsByTitle = async (searchQuery: string): Promise<Post[]> => {
  if (!searchQuery.trim()) return [];
  // Nota: Firestore no soporta búsquedas de tipo "includes" de forma nativa y eficiente.
  // Esta implementación trae todos los posts y filtra en el cliente.
  // Para apps grandes, se recomienda un servicio de búsqueda como Algolia.
  const posts = await getAllPosts();
  return posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
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