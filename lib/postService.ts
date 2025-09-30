export interface Post {
  id: string;
  userId: string;
  username: string;
  profilePicture?: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: number;
  likes: number;
  comments: number;
}

const POSTS_KEY = 'dhirofans_posts';

const loadPosts = (): Post[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const savePosts = (posts: Post[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

export const createPost = (postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>): Post => {
  if (!postData.title?.trim()) throw new Error('El título es requerido');
  if (!postData.mediaUrl) throw new Error('La URL del archivo es requerida');
  if (!postData.userId) throw new Error('El usuario es requerido');
  
  const newPost: Post = {
    ...postData,
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    timestamp: Date.now(),
    likes: 0,
    comments: 0,
    title: postData.title.trim(),
    description: postData.description?.trim() || ''
  };
  
  const posts = loadPosts();
  posts.unshift(newPost);
  savePosts(posts);
  console.log('Nueva publicación creada:', newPost);
  return newPost;
};

export const getAllPosts = (): Post[] => {
  const posts = loadPosts(); // Esto obtiene TODAS las publicaciones de localStorage
  console.log('🔍 getAllPosts() - Posts encontrados:', posts.length);
  console.log('🔍 getAllPosts() - Posts data:', posts);
  
  // Si no hay posts, usar testData para generar datos consistentes
  if (posts.length === 0) {
    console.log('🔍 No hay posts, generando testData...');
    const { generateTestData } = require('./testData');
    generateTestData();
    const newPosts = loadPosts();
    console.log('🔍 Después de generar testData:', newPosts.length, 'posts');
    return newPosts;
  }
  
  // Ordenar por timestamp descendente (más recientes primero)
  return posts.sort((a, b) => b.timestamp - a.timestamp);
};



export const getUserPosts = (userId: string): Post[] => {
  return loadPosts().filter(post => post.userId === userId);
};

export const searchPostsByTitle = (query: string): Post[] => {
  if (!query.trim()) return [];
  const posts = loadPosts(); // Usar loadPosts directamente para obtener TODAS las publicaciones
  return posts.filter(post => 
    post.title.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => b.timestamp - a.timestamp);
};

export const deletePost = (postId: string, userId: string): boolean => {
  const posts = loadPosts();
  const postIndex = posts.findIndex(post => post.id === postId && post.userId === userId);
  if (postIndex !== -1) {
    posts.splice(postIndex, 1);
    savePosts(posts);
    console.log('Publicación eliminada:', postId);
    return true;
  }
  return false;
};