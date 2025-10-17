import { useState } from 'react';

interface DynamicPostProps {
  id: string;
  userId: string;
  username: string;
  profilePicture?: string;
  avatar?: string;
  originalProfilePicture?: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  tokensReward: number;
  onComment?: (postId: string, comment: string) => void;
}

export default function DynamicPost({
  id,
  userId,
  username,
  profilePicture,
  avatar,
  originalProfilePicture,
  title,
  description,
  mediaUrl,
  mediaType,
  tokensReward,
  onComment
}: DynamicPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  const handleComment = () => {
    if (comment.trim() && onComment) {
      onComment(id, comment.trim());
      setComment('');
    }
  };

  return (
    <div className="dynamic-post">
      <div className="dynamic-media">
        {mediaType === 'video' ? (
          <video src={mediaUrl} controls className="dynamic-video" />
        ) : (
          <img src={mediaUrl} alt={title} className="dynamic-image" />
        )}
        
        {/* Caption overlay */}
        <div className="dynamic-caption">
          {title || description}
        </div>

        {/* User info and tokens */}
        <div className="dynamic-user-info">
          <div className="user-profile">
            <div className={avatar && avatar !== originalProfilePicture && profilePicture === avatar ? "user-avatar-dynamic avatar-small" : "user-avatar-dynamic"}>
              {profilePicture ? (
                <img src={profilePicture} alt={username} />
              ) : (
                <div className="default-avatar-dynamic">👤</div>
              )}
            </div>
            <span className="username-dynamic">@{username}</span>
          </div>
          
          <div className="tokens-reward">
            <span className="token-icon">🪙</span>
            <span className="token-amount">{tokensReward}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="dynamic-actions">
          <button className="action-btn-dynamic like-btn-dynamic">
            <span>🤍</span>
            <span>0</span>
          </button>
          
          <button 
            className="action-btn-dynamic comment-btn-dynamic"
            onClick={() => setShowComments(!showComments)}
          >
            💬
          </button>
          
          <button className="action-btn-dynamic share-btn-dynamic">
            📤
          </button>
        </div>
      </div>

      {/* Comment section */}
      {showComments && (
        <div className="comment-section-dynamic">
          <div className="comment-input-container">
            <input
              type="text"
              placeholder="Adivina una palabra clave..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="comment-input-dynamic"
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <button onClick={handleComment} className="send-comment-btn">
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}