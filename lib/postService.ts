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

let posts: Post[] = [];

export const createPost = (postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>): Post => {
  if (!postData.title?.trim()) throw new Error('El título es requerido');
  if (!postData.mediaUrl) throw new Error('La URL del archivo es requerida');
  if (!postData.userId) throw new Error('El usuario es requerido');
  
  const newPost: Post = {
    ...postData,
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    likes: 0,
    comments: 0,
    title: postData.title.trim(),
    description: postData.description?.trim() || ''
  };
  
  posts.unshift(newPost);
  console.log('Nueva publicación creada:', newPost);
  return newPost;
};

export const getAllPosts = (): Post[] => {
  return posts;
};

export const getUserPosts = (userId: string): Post[] => {
  return posts.filter(post => post.userId === userId);
};

export const searchPostsByTitle = (query: string): Post[] => {
  if (!query.trim()) return [];
  return posts.filter(post => 
    post.title.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => b.timestamp - a.timestamp);
};

export const deletePost = (postId: string, userId: string): boolean => {
  const postIndex = posts.findIndex(post => post.id === postId && post.userId === userId);
  if (postIndex !== -1) {
    posts.splice(postIndex, 1);
    console.log('Publicación eliminada:', postId);
    return true;
  }
  return false;
};