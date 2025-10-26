import { useState, useRef, useEffect } from 'react';
import { getUserDataById, UserData } from '../lib/userService';
import { deletePost, Post } from '../lib/postService';
import { toggleLike } from '../lib/likeService';
import { auth } from '../lib/firebase';
import { getPostCommentsCount } from '../lib/commentCountService';
import CommentsModal from './CommentsModal';
import FullscreenButton from './FullscreenButton';

interface MultiImagePlayerProps {
  post: Post;
  isActive: boolean;
  onProfileClick?: (userId: string) => void;
  onPostDeleted?: () => void;
}

export default function MultiImagePlayer({ post, isActive, onProfileClick, onPostDeleted }: MultiImagePlayerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [authorData, setAuthorData] = useState<UserData | null>(null);
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const isOwner = auth.currentUser && auth.currentUser.uid === post.userId;
  const imagesData = post.imagesData || [];

  useEffect(() => {
    const fetchAuthorData = async () => {
      const data = await getUserDataById(post.userId);
      setAuthorData(data);
    };
    
    const fetchCommentsCount = async () => {
      const count = await getPostCommentsCount(post.id);
      setCommentsCount(count);
    };
    
    fetchAuthorData();
    fetchCommentsCount();
  }, [post.userId, post.id]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (direction === 'right' && currentImageIndex < imagesData.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    scrollRef.current!.dataset.startX = touch.clientX.toString();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const startX = parseFloat(scrollRef.current!.dataset.startX || '0');
    const diff = startX - touch.clientX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImageIndex < imagesData.length - 1) {
        handleScroll('right');
      } else if (diff < 0 && currentImageIndex > 0) {
        handleScroll('left');
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: currentImageIndex * scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  }, [currentImageIndex]);

  const handleDeletePost = async () => {
    if (auth.currentUser && await deletePost(post.id, auth.currentUser.uid)) {
      setShowDeleteConfirm(false);
      onPostDeleted?.();
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser) return;
    
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);
    
    if (newIsLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
    
    try {
      const result = await toggleLike(post.id);
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
    } catch (error) {
      console.error('Error al dar like:', error);
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
    }
  };

  const handleImageClick = () => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < 250 && timeDiff > 50) {
      handleLike();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const currentImageData = imagesData[currentImageIndex];

  return (
    <div className="multi-image-container">
      <div className="multi-images-scroll" ref={scrollRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {imagesData.map((imageData: any, index: number) => (
          <div key={index} className={`multi-image-slide ${index === currentImageIndex ? 'active' : ''}`}>
            <img src={imageData.url} alt={`Image ${index + 1}`} className="reel-image" />
            
            {imageData.overlayText && imageData.textStyles && (
              <div 
                className="custom-text-overlay"
                style={{
                  position: 'absolute',
                  left: `${imageData.textStyles.position.x}%`,
                  top: `${imageData.textStyles.position.y}%`,
                  fontSize: `${imageData.textStyles.size}px`,
                  color: imageData.textStyles.color,
                  fontFamily: imageData.textStyles.fontFamily,
                  transform: `translate(-50%, -50%) rotate(${imageData.textStyles.rotation}deg)`,
                  zIndex: 10,
                  pointerEvents: 'none',
                  maxWidth: '80%',
                  wordWrap: 'break-word'
                }}
              >
                {imageData.overlayText}
              </div>
            )}
          </div>
        ))}
      </div>

      {currentImageIndex > 0 && (
        <button className="multi-nav-btn multi-nav-left" onClick={() => handleScroll('left')}>‹</button>
      )}
      {currentImageIndex < imagesData.length - 1 && (
        <button className="multi-nav-btn multi-nav-right" onClick={() => handleScroll('right')}>›</button>
      )}

      <div className="multi-image-indicators">
        {imagesData.map((_: any, i: number) => (
          <div key={i} className={`multi-indicator ${i === currentImageIndex ? 'active' : ''}`} />
        ))}
      </div>

      <div className="image-click-overlay" onClick={handleImageClick} />

      {showLikeAnimation && (
        <div className="like-animation">
          <svg width="120" height="120" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 4px 8px rgba(255, 0, 0, 0.5))' }}>
            <defs>
              <linearGradient id="heartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ff1744', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#ff3d71', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#c2185b', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path 
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
              fill="url(#heartGradient)"
              stroke="#ff1744"
              strokeWidth="0.5"
            />
          </svg>
        </div>
      )}

      {isActive && <FullscreenButton />}
      
      {isActive && (
        <div className="reel-overlay">
          {isOwner && (
            <div className="delete-post-btn" onClick={() => setShowDeleteConfirm(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
          )}
          
          <div className="reel-info">
            <div className="user-info">
              <div className={`profile-pic ${authorData?.isAvatar ? 'avatar-format' : ''}`} onClick={() => onProfileClick?.(post.userId)}>
                {authorData?.profilePicture ? (
                  <img src={authorData.profilePicture} alt={authorData.username} />
                ) : (
                  <div className="default-avatar">{authorData?.fullName?.[0]?.toUpperCase() || '?'}</div>
                )}
              </div>
              <div className="user-details">
                <div className="username-row">
                  <div className="username">@{authorData?.username || '...'}</div>
                </div>
                {post.title && <div className="post-title">{post.title}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isActive && (
        <div className="reel-side-controls">
          <div className="like-container">
            <button className={`side-control-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "#ff3040" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <span className="like-count">{likesCount}</span>
          </div>
          <div className="comment-container">
            <button className="side-control-btn comment-btn" onClick={() => setShowComments(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            {commentsCount > 0 && <span className="comment-count">{commentsCount}</span>}
          </div>
          <button className="side-control-btn share-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
            </svg>
          </button>
        </div>
      )}
      
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <p>¿Confirmas que quieres eliminar esta publicación?</p>
            <button className="confirm-delete-btn" onClick={handleDeletePost}>Confirmar</button>
            <button className="cancel-delete-btn" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
          </div>
        </div>
      )}
      
      <CommentsModal 
        postId={post.id}
        isOpen={showComments}
        postData={post}
        onClose={() => {
          setShowComments(false);
          getPostCommentsCount(post.id).then(setCommentsCount);
        }}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}
