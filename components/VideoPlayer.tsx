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

    // CONFIGURACIÓN CRÍTICA PARA iOS
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    
    // REMOVER controles nativos que pueden activar pantalla completa
    video.removeAttribute('controls');
    
    // INTERCEPTAR todos los eventos de pantalla completa
    const fullscreenEvents = [
      'webkitbeginfullscreen',
      'webkitendfullscreen', 
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'msfullscreenchange'
    ];

    const preventFullscreen = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.warn('Pantalla completa bloqueada');
      return false;
    };

    fullscreenEvents.forEach(event => {
      video.addEventListener(event, preventFullscreen, { capture: true, passive: false });
    });

    // INTERCEPTAR clicks para controlar reproducción manualmente
    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
      
      onClick?.();
    };

    video.addEventListener('click', handleClick, { capture: true });
    
    // FORZAR configuración cada 100ms (agresivo pero necesario)
    const forceConfig = setInterval(() => {
      if (video.getAttribute('playsinline') !== '') {
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.playsInline = true;
      }
    }, 100);

    return () => {
      clearInterval(forceConfig);
      fullscreenEvents.forEach(event => {
        video.removeEventListener(event, preventFullscreen, { capture: true });
      });
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