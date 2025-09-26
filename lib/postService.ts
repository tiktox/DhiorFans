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
  const newPost: Post = {
    ...postData,
    id: Date.now().toString(),
    timestamp: Date.now(),
    likes: 0,
    comments: 0
  };
  
  posts.unshift(newPost);
  return newPost;
};

export const getAllPosts = (): Post[] => {
  return posts;
};

export const getUserPosts = (userId: string): Post[] => {
  return posts.filter(post => post.userId === userId);
};