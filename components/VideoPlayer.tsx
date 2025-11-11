import { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  onClick?: () => void;
}

export default function VideoPlayer({ 
  src, 
  className = '', 
  autoPlay = false, 
  muted = true, 
  loop = false, 
  controls = false,
  poster,
  onClick 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Configuración básica para iOS
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    video.removeAttribute('controls');
    
    // Interceptar eventos de fullscreen
    const preventFullscreen = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    video.addEventListener('webkitbeginfullscreen', preventFullscreen, { capture: true, passive: false });
    video.addEventListener('webkitendfullscreen', preventFullscreen, { capture: true, passive: false });

    // Manejar clicks
    const handleClick = (e: Event) => {
      e.preventDefault();
      
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
      
      onClick?.();
    };

    video.addEventListener('click', handleClick, { capture: true });

    return () => {
      video.removeEventListener('webkitbeginfullscreen', preventFullscreen, { capture: true });
      video.removeEventListener('webkitendfullscreen', preventFullscreen, { capture: true });
      video.removeEventListener('click', handleClick, { capture: true });
    };
  }, [onClick]);

  return (
    <div 
      ref={containerRef}
      className="video-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)'
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className={`ios-safe-video ${className}`}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        poster={poster}
        playsInline
        webkit-playsinline=""
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)'
        }}
      />
    </div>
  );
}