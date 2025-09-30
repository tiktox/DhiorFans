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
  
  // Si hay menos de 3 posts, generar datos de prueba automáticamente
  if (posts.length < 3) {
    generateSamplePosts();
    return loadPosts();
  }
  
  // Ordenar por timestamp descendente (más recientes primero)
  return posts.sort((a, b) => b.timestamp - a.timestamp);
};

const generateSamplePosts = () => {
  const samplePosts: Post[] = [
    {
      id: 'sample_1',
      userId: 'sample_user_1',
      username: 'maria_garcia',
      profilePicture: '',
      title: 'Atardecer en la playa',
      description: 'Un hermoso atardecer que capturé ayer 🌅',
      mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
      mediaType: 'image',
      timestamp: Date.now() - 3600000,
      likes: 45,
      comments: 12
    },
    {
      id: 'sample_2',
      userId: 'sample_user_2', 
      username: 'carlos_lopez',
      profilePicture: '',
      title: 'Fotografía urbana',
      description: 'Explorando la ciudad con mi cámara 📸',
      mediaUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=600&fit=crop',
      mediaType: 'image',
      timestamp: Date.now() - 7200000,
      likes: 78,
      comments: 23
    },
    {
      id: 'sample_3',
      userId: 'sample_user_3',
      username: 'ana_martinez',
      profilePicture: '',
      title: 'Arte y diseño',
      description: 'Nuevo proyecto creativo ✨',
      mediaUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=600&fit=crop',
      mediaType: 'image',
      timestamp: Date.now() - 10800000,
      likes: 92,
      comments: 18
    }
  ];
  
  const existingPosts = loadPosts();
  const combinedPosts = [...existingPosts, ...samplePosts];
  savePosts(combinedPosts);
  
  console.log('✅ Datos de ejemplo generados automáticamente');
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