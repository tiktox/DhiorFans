import { Post } from '../lib/postService';

interface PostModalProps {
  post: Post;
  onClose: () => void;
}

export default function PostModal({ post, onClose }: PostModalProps) {
  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className="post-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="post-modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <div className="post-modal-media">
          {post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls autoPlay />
          ) : (
            <img src={post.mediaUrl} alt={post.title} />
          )}
        </div>
        
        {post.title && (
          <div className="post-modal-title">
            <h3>{post.title}</h3>
          </div>
        )}
        
        {post.description && (
          <div className="post-modal-description">
            <p>{post.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}