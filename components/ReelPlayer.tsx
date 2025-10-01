import { useState, useRef, useEffect } from 'react';
import { getUserDataById, UserData } from '../lib/userService';
import { deletePost, Post } from '../lib/postService';
import { toggleLike } from '../lib/likeService';
import { auth } from '../lib/firebase';

interface ReelPlayerProps {
  post: Post;
  isActive: boolean;
  onProfileClick?: (userId: string) => void;
  onPostDeleted?: () => void;
}

export default function ReelPlayer({ post, isActive, onProfileClick, onPostDeleted }: ReelPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [authorData, setAuthorData] = useState<UserData | null>(null);
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  
  const isOwner = auth.currentUser && auth.currentUser.uid === post.userId;

  useEffect(() => {
    const fetchAuthorData = async () => {
      const data = await getUserDataById(post.userId);
      setAuthorData(data);
    };
    fetchAuthorData();
  }, [post.userId]);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (videoRef.current && isFinite(videoRef.current.duration)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clickX = clientX - rect.left;
      const newTime = (clickX / rect.width) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
    }
  };

  // Identificador para diferenciar entre imagen y video
  const isImage = post.mediaType === 'image';
  
  const handleDeletePost = async () => {
    if (auth.currentUser && await deletePost(post.id, auth.currentUser.uid)) {
      setShowDeleteConfirm(false);
      onPostDeleted?.();
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser) return;
    
    try {
      const result = await toggleLike(post.id);
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
      
      if (result.isLiked) {
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 1000);
      }
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleDoubleClick = () => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < 300) {
      handleLike();
    }
    
    lastTapRef.current = now;
  };

  return (
    <div 
      className={`reel-container ${isImage ? 'image-content' : 'video-content'}`}
      data-content-type={isImage ? 'image' : 'video'}
      data-media-id={post.id}
    >
      {isImage ? (
        <img
          src={post.mediaUrl}
          alt={post.description}
          className="reel-image"
        />
      ) : (
        <video
          ref={videoRef}
          src={post.mediaUrl}
          loop
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          className="reel-video"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
      
      {!isImage && (
        <div 
          className="video-click-overlay"
          onClick={handleDoubleClick}
        />
      )}
      
      {isImage && (
        <div 
          className="image-click-overlay"
          onClick={handleDoubleClick}
        />
      )}
      
      {/* Animación de like */}
      {showLikeAnimation && (
        <div className="like-animation">
          ❤️
        </div>
      )}
      
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
            <div className="profile-pic" onClick={() => onProfileClick?.(post.userId)}>
              {authorData?.profilePicture ? (
                <img src={authorData.profilePicture} alt={authorData.username} />
              ) : (
                <div className="default-avatar">{authorData?.fullName?.[0]?.toUpperCase() || '?'}</div>
              )}
            </div>
            <div className="user-details">
              <div className="username">@{authorData?.username || '...'}</div>
              {post.title && <div className="post-title">{post.title}</div>}
              {post.description && <div className="description">{post.description}</div>}
            </div>
          </div>
        </div>
        
        <div className="reel-side-controls">
          <button className={`side-control-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "#ff3040" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="like-count">{likesCount}</span>
          </button>
          <button className="side-control-btn comment-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button className="side-control-btn share-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
            </svg>
          </button>
          {!isImage && (
            <button onClick={toggleMute} className="side-control-btn mute-btn">
              {isMuted ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5 6 9H2v6h4l5 4V5ZM22 9l-6 6M16 9l6 6"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5 6 9H2v6h4l5 4V5ZM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
          )}
        </div>
        
        {/* Línea de tiempo solo visible en videos, no en imágenes */}
        {!isImage && (
          <div className="progress-bar" onClick={handleSeek} onTouchStart={handleSeek}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <p>¿Confirmas que quieres eliminar esta publicación?</p>
            <button className="confirm-delete-btn" onClick={handleDeletePost}>
              Confirmar
            </button>
            <button className="cancel-delete-btn" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}