import { useState, useRef, useEffect } from 'react';
import { getUserDataById, UserData } from '../lib/userService';
import { deletePost, Post } from '../lib/postService';
import { toggleLike } from '../lib/likeService';
import { auth } from '../lib/firebase';
import { getPostCommentsCount } from '../lib/commentCountService';
import { useDynamicStatus } from '../hooks/useDynamicStatus';
import CommentsModal from './CommentsModal';
import FullscreenButton from './FullscreenButton';
import MultiImagePlayer from './MultiImagePlayer';



interface ReelPlayerProps {
  post: Post;
  isActive: boolean;
  onProfileClick?: (userId: string) => void;
  onPostDeleted?: () => void;
  onDynamicCompleted?: () => void;
}
export default function ReelPlayer({ post, isActive, onProfileClick, onPostDeleted, onDynamicCompleted }: ReelPlayerProps) {
  // Si es multi-imagen, usar el componente especializado
  if (post.mediaType === 'multi-image') {
    return (
      <MultiImagePlayer 
        post={post}
        isActive={isActive}
        onProfileClick={onProfileClick}
        onPostDeleted={onPostDeleted}
      />
    );
  }

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('reelsMuted') === 'true';
    }
    return false;
  });
  const [progress, setProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [authorData, setAuthorData] = useState<UserData | null>(null);
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  const isDynamicActive = useDynamicStatus(post.id, post.isDynamic ? post.isActive : undefined);
  const videoRef = useRef<HTMLVideoElement>(null);

  const lastTapRef = useRef<number>(0);


  const isOwner = auth.currentUser && auth.currentUser.uid === post.userId;
  
  // Debug para verificar el botón de eliminar
  if (isActive) {
    console.log('=== DELETE BUTTON DEBUG ===');
    console.log('isActive:', isActive);
    console.log('isOwner:', isOwner);
    console.log('currentUserId:', auth.currentUser?.uid);
    console.log('postUserId:', post.userId);
    console.log('postId:', post.id);
    console.log('Should show delete button:', isActive && isOwner);
    console.log('===========================');
  }

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

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      // CONFIGURACIÓN CRÍTICA PARA iOS
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.playsInline = true;
      video.removeAttribute('controls');
      
      // Bloquear métodos de fullscreen
      if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen = () => Promise.reject('Blocked');
      }
      if (video.requestFullscreen) {
        video.requestFullscreen = () => Promise.reject('Blocked');
      }
      
      video.muted = isMuted;
      
      if (isActive) {
        console.log('▶️ Reproduciendo video...');
        video.play().catch(e => {
          if (e.name !== 'AbortError') {
            console.error('Error reproduciendo video:', e);
          }
        });
        setIsPlaying(true);
      } else {
        console.log('⏸️ Pausando video');
        video.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, isMuted]);

  useEffect(() => {
    const handleMuteChange = (e: CustomEvent) => {
      setIsMuted(e.detail.muted);
      if (videoRef.current) {
        videoRef.current.muted = e.detail.muted;
      }
    };
    window.addEventListener('reelsMuteChanged', handleMuteChange as EventListener);
    return () => window.removeEventListener('reelsMuteChanged', handleMuteChange as EventListener);
  }, []);

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
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('reelsMuted', String(newMutedState));
    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
    window.dispatchEvent(new CustomEvent('reelsMuteChanged', { detail: { muted: newMutedState } }));
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      
      if (isFinite(duration) && duration > 0) {
        const progress = (currentTime / duration) * 100;
        setProgress(progress);
        console.log('Progress updated:', progress); // Debug
      }
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [showTimeIndicator, setShowTimeIndicator] = useState(false);
  const [indicatorTime, setIndicatorTime] = useState(0);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (videoRef.current && isFinite(videoRef.current.duration)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const newTime = (clickX / rect.width) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress((newTime / videoRef.current.duration) * 100);
    }
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    setShowTimeIndicator(true);
    handleProgressClick(e);
  };

  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    setShowTimeIndicator(true);
    handleProgressClick(e);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && videoRef.current && isFinite(videoRef.current.duration)) {
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect();
          const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
          const newTime = (clickX / rect.width) * videoRef.current.duration;
          videoRef.current.currentTime = newTime;
          setProgress((newTime / videoRef.current.duration) * 100);
          setIndicatorTime(newTime);
        }
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && videoRef.current && isFinite(videoRef.current.duration)) {
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect();
          const clickX = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
          const newTime = (clickX / rect.width) * videoRef.current.duration;
          videoRef.current.currentTime = newTime;
          setProgress((newTime / videoRef.current.duration) * 100);
          setIndicatorTime(newTime);
        }
      }
    };

    const handleGlobalEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        setTimeout(() => setShowTimeIndicator(false), 1000);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('touchend', handleGlobalEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging]);

  // Identificador para diferenciar entre imagen y video
  const isImage = post.mediaType === 'image';

  // Prevenir arrastre de imagen por defecto
  useEffect(() => {
    const preventDrag = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragstart', preventDrag);
    return () => document.removeEventListener('dragstart', preventDrag);
  }, []);


  
  const handleDeletePost = async () => {
    if (auth.currentUser && await deletePost(post.id, auth.currentUser.uid)) {
      setShowDeleteConfirm(false);
      onPostDeleted?.();
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser) return;
    
    // ✅ OPTIMISTIC UI: Actualizar inmediatamente
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
    
    // ✅ Ejecutar en background
    try {
      const result = await toggleLike(post.id);
      // Actualizar con datos reales del servidor
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
    } catch (error) {
      // ✅ Revertir en caso de error
      console.error('Error al dar like:', error);
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
    }
  };

  const handleVideoClick = () => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < 250 && timeDiff > 50) {
      // Doble clic - dar like
      handleLike();
      lastTapRef.current = 0;
    } else {
      // Clic simple - pausar/reanudar
      if (timeDiff > 250) {
        togglePlayPause();
      }
      lastTapRef.current = now;
    }
  };
  
  const handleImageClick = () => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    
    if (timeDiff < 250 && timeDiff > 50) {
      // Doble clic - dar like
      handleLike();
      lastTapRef.current = 0; // Reset para evitar triple clic
    } else {
      // Primer clic - solo actualizar timestamp
      lastTapRef.current = now;
    }
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
        <>
          <video
            ref={videoRef}
            src={post.mediaUrl}
            loop
            muted={isMuted || !!post.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            className="reel-video"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('❌ Error cargando video:', e);
              console.log('Video URL:', post.mediaUrl);
            }}
            playsInline
            webkit-playsinline=""
            x-webkit-airplay="deny"
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            onContextMenu={(e) => e.preventDefault()}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
          />
          {/* Barra de progreso solo para videos */}
          <div 
            className="progress-bar" 
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
            onClick={handleProgressClick}
          >
            <div 
              className="progress-bar-inner" 
              style={{ 
                width: `${progress}%`,
                display: 'block',
                backgroundColor: '#00e5ff'
              }} 
            />
            {showTimeIndicator && (
              <div className="time-indicator" style={{ left: `${(indicatorTime / (videoRef.current?.duration || 1)) * 100}%` }}>
                {formatTime(indicatorTime)}
              </div>
            )}
          </div>
        </>
      )}
      

      
      {/* Texto con estilos personalizados */}
      {post.textStyles && post.overlayText && (
        <div 
          className="custom-text-overlay"
          style={{
            position: 'absolute',
            left: `${Math.max(0, Math.min(100, post.textStyles.position.x))}%`,
            top: `${Math.max(0, Math.min(100, post.textStyles.position.y))}%`,
            fontSize: `${Math.max(12, Math.min(48, post.textStyles.size))}px`,
            color: post.textStyles.color,
            fontFamily: post.textStyles.fontFamily,
            fontWeight: post.textStyles.style === 'bold' ? 'bold' : 'normal',
            fontStyle: post.textStyles.style === 'italic' ? 'italic' : 'normal',
            textDecoration: post.textStyles.style === 'underline' ? 'underline' : 'none',
            textShadow: post.textStyles.style === 'shadow' ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            pointerEvents: 'none',
            maxWidth: '80%',
            wordWrap: 'break-word'
          }}
        >
          {post.overlayText.replace(/<[^>]*>/g, '')}
        </div>
      )}
      
      {!isImage && (
        <div 
          className="video-click-overlay"
          onClick={handleVideoClick}
        />
      )}
      
      {isImage && (
        <div 
          className="image-click-overlay"
          onClick={handleImageClick}
        />
      )}
      
      {/* Animación de like */}
      {showLikeAnimation && (
        <div className="like-animation">
          <svg width="120" height="120" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 4px 8px rgba(255, 0, 0, 0.5))' }}>
            <defs>
              <linearGradient id="heartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ff1744', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#ff3d71', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#c2185b', stopOpacity: 1 }} />
              </linearGradient>
              <radialGradient id="heartShine">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
              </radialGradient>
            </defs>
            <path 
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
              fill="url(#heartGradient)"
              stroke="#ff1744"
              strokeWidth="0.5"
            />
            <ellipse 
              cx="9" 
              cy="9" 
              rx="3" 
              ry="2.5" 
              fill="url(#heartShine)" 
              opacity="0.4"
              transform="rotate(-20 9 9)"
            />
          </svg>
        </div>
      )}
      

      
      {/* Indicador de pausa */}
      {!isImage && !isPlaying && (
        <div className="play-pause-indicator">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="white" fillOpacity="0.8">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      )}
      
      {/* Botón de pantalla completa */}
      {isActive && <FullscreenButton />}
      
      {isActive && (
        <div className="reel-overlay">
          {isOwner && (
            <div className="delete-post-btn" onClick={() => {
              console.log('Delete button clicked');
              setShowDeleteConfirm(true);
            }}>
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
              <div className={`profile-pic ${authorData?.isAvatar ? 'avatar-format' : ''}`} data-is-avatar={authorData?.isAvatar ? 'true' : 'false'} onClick={() => onProfileClick?.(post.userId)}>
                {authorData?.profilePicture ? (
                  <img src={authorData.profilePicture} alt={authorData.username} />
                ) : (
                  <div className="default-avatar">{authorData?.fullName?.[0]?.toUpperCase() || '?'}</div>
                )}
              </div>
              <div className="user-details">
                <div className="username-row">
                  <div className="username">@{authorData?.username || '...'}</div>
                  {post.isDynamic && post.tokensReward && isDynamicActive && (
                    <div className="dynamic-tokens-display">
                      <span className="token-icon"></span>
                      <span className="token-amount">{post.tokensReward}</span>
                    </div>
                  )}
                </div>
                {post.title && <div className="post-title">{post.title}</div>}
                {post.description && <div className="description">{post.description}</div>}
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
      )}
      
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
      
      {/* Modal de comentarios */}
      <CommentsModal 
        postId={post.id}
        isOpen={showComments}
        postData={post}
        onClose={() => {
          setShowComments(false);
          getPostCommentsCount(post.id).then(setCommentsCount);
        }}
        onProfileClick={onProfileClick}
        onDynamicCompleted={post.isDynamic ? () => {
          onDynamicCompleted?.();
          getPostCommentsCount(post.id).then(setCommentsCount);
        } : undefined}
      />
    </div>
  );
}