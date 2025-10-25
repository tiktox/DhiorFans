import { auth, db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, where, Timestamp } from 'firebase/firestore';
import { getPostLikesCount, checkUserLike } from './likeService';
import { handleIndexError, showIndexMessage } from './indexStatus';
export interface Post {
  id: string;
  userId: string;
  title: string;
  description: string;
  overlayText?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  audioUrl?: string;
  textStyles?: {
    position: { x: number; y: number };
    size: number;
    color: string;
    fontFamily: string;
    style: string;
    rotation?: number;
  };
  timestamp: number;
  likes: number;
  comments: number;
  likesCount?: number;
  isLikedByUser?: boolean;
  // Metadatos de dinámica
  isDynamic?: boolean;
  keywords?: string[];
  tokensReward?: number;
  isActive?: boolean;
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
  
  console.log('🔍 getAllPosts() - Documentos encontrados:', querySnapshot.size);
  
  // ✅ OPTIMIZACIÓN: Cargar likes en paralelo
  const postsPromises = querySnapshot.docs.map(async (docSnap) => {
    const data = docSnap.data();
    const postId = docSnap.id;
    
    // Ejecutar ambas queries en paralelo
    const [likesCount, isLikedByUser] = await Promise.all([
      getPostLikesCount(postId),
      auth.currentUser ? 
        checkUserLike(postId, auth.currentUser.uid).then(r => r !== null) : 
        Promise.resolve(false)
    ]);
    
    return {
      id: postId,
      ...data,
      timestamp: (data.timestamp as Timestamp).toMillis(),
      likesCount,
      isLikedByUser
    } as Post;
  });
  
  const posts = await Promise.all(postsPromises);
  console.log('✅ getAllPosts() - Posts encontrados en Firestore:', posts.length);
  return posts;
};



export const getUserPosts = async (userId: string): Promise<Post[]> => {
  console.log('🔍 getUserPosts() - Buscando posts para usuario:', userId);
  
  try {
    // Intentar con query optimizada (requiere índice)
    const q = query(postsCollection, where('userId', '==', userId), orderBy('timestamp', 'desc'));
    console.log('🔍 Query creada, ejecutando...');
    
    const querySnapshot = await getDocs(q);
    console.log('🔍 Query ejecutada, documentos encontrados:', querySnapshot.size);
    
    // ✅ OPTIMIZACIÓN: Cargar likes en paralelo
    const postsPromises = querySnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const postId = docSnap.id;
      
      // Ejecutar ambas queries en paralelo
      const [likesCount, isLikedByUser] = await Promise.all([
        getPostLikesCount(postId),
        auth.currentUser ? 
          checkUserLike(postId, auth.currentUser.uid).then(r => r !== null) : 
          Promise.resolve(false)
      ]);
      
      return {
        id: postId,
        ...data,
        timestamp: (data.timestamp as Timestamp).toMillis(),
        likesCount,
        isLikedByUser
      } as Post;
    });
    
    const posts = await Promise.all(postsPromises);
    console.log('✅ getUserPosts() - Total posts procesados:', posts.length);
    return posts;
    
  } catch (error: any) {
    console.error('❌ Error en getUserPosts:', error);
    
    // Si el error es por falta de índice, usar método alternativo
    if (handleIndexError(error)) {
      showIndexMessage();
      console.log('🔄 Usando método alternativo sin índice...');
      return await getUserPostsFallback(userId);
    }
    
    return [];
  }
};

// Método alternativo que no requiere índice compuesto
const getUserPostsFallback = async (userId: string): Promise<Post[]> => {
  try {
    // Obtener todos los posts y filtrar en cliente
    const q = query(postsCollection);
    const querySnapshot = await getDocs(q);
    
    // Filtrar posts del usuario
    const userDocs = querySnapshot.docs.filter(doc => doc.data().userId === userId);
    
    // ✅ OPTIMIZACIÓN: Cargar likes en paralelo
    const postsPromises = userDocs.map(async (docSnap) => {
      const data = docSnap.data();
      const postId = docSnap.id;
      
      // Ejecutar ambas queries en paralelo
      const [likesCount, isLikedByUser] = await Promise.all([
        getPostLikesCount(postId),
        auth.currentUser ? 
          checkUserLike(postId, auth.currentUser.uid).then(r => r !== null) : 
          Promise.resolve(false)
      ]);
      
      return {
        id: postId,
        ...data,
        timestamp: (data.timestamp as Timestamp).toMillis(),
        likesCount,
        isLikedByUser
      } as Post;
    });
    
    const posts = await Promise.all(postsPromises);
    
    // Ordenar por timestamp descendente
    posts.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log('✅ getUserPostsFallback() - Posts encontrados:', posts.length);
    return posts;
    
  } catch (error) {
    console.error('❌ Error en getUserPostsFallback:', error);
    return [];
  }
};

export const searchPostsByTitle = async (searchQuery: string): Promise<Post[]> => {
  if (!searchQuery.trim()) return [];
  
  try {
    const q = query(postsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const lowerQuery = searchQuery.toLowerCase();
    
    // Filtrar posts que coincidan
    const matchingDocs = querySnapshot.docs.filter(docSnap => {
      const data = docSnap.data();
      const matchesTitle = data.title?.toLowerCase().includes(lowerQuery);
      const matchesDescription = data.description?.toLowerCase().includes(lowerQuery);
      return matchesTitle || matchesDescription;
    });
    
    // ✅ OPTIMIZACIÓN: Cargar likes en paralelo
    const postsPromises = matchingDocs.map(async (docSnap) => {
      const data = docSnap.data();
      const postId = docSnap.id;
      
      // Ejecutar ambas queries en paralelo
      const [likesCount, isLikedByUser] = await Promise.all([
        getPostLikesCount(postId),
        auth.currentUser ? 
          checkUserLike(postId, auth.currentUser.uid).then(r => r !== null) : 
          Promise.resolve(false)
      ]);
      
      return {
        id: postId,
        ...data,
        timestamp: (data.timestamp as Timestamp).toMillis(),
        likesCount,
        isLikedByUser
      } as Post;
    });
    
    const posts = await Promise.all(postsPromises);
    
    return posts.sort((a, b) => {
      // Priorizar coincidencias exactas en título
      const aExact = a.title.toLowerCase() === lowerQuery;
      const bExact = b.title.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return b.timestamp - a.timestamp;
    });
    
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
};

export const deletePost = async (postId: string, userId: string): Promise<boolean> => {
  // En una app real, se debería verificar que el `userId` tiene permiso para borrar,
  // idealmente con Reglas de Seguridad de Firestore.
  const postDocRef = doc(db, 'posts', postId);
  await deleteDoc(postDocRef);
  console.log('Publicación eliminada de Firestore:', postId);
  return true;
};