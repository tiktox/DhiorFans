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

    // CONFIGURACIÓN CRÍTICA INMEDIATA
    const forceInlineConfig = () => {
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.playsInline = true;
      video.removeAttribute('controls');
      
      // Bloquear métodos de fullscreen del video
      if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen = () => {
          console.warn('webkitEnterFullscreen bloqueado');
          return Promise.reject('Fullscreen blocked');
        };
      }
      
      if (video.requestFullscreen) {
        video.requestFullscreen = () => {
          console.warn('requestFullscreen bloqueado');
          return Promise.reject('Fullscreen blocked');
        };
      }
    };
    
    // Ejecutar inmediatamente
    forceInlineConfig();
    
    // INTERCEPTAR TODOS los eventos de fullscreen
    const fullscreenEvents = [
      'webkitbeginfullscreen',
      'webkitendfullscreen', 
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'msfullscreenchange',
      'webkitpresentationmodechanged'
    ];

    const preventFullscreen = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.warn('🚫 Pantalla completa bloqueada:', e.type);
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
    
    // INTERCEPTAR doble click que puede activar fullscreen
    video.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }, { capture: true, passive: false });
    
    // FORZAR configuración cada 50ms (MÁS AGRESIVO)
    const forceConfig = setInterval(forceInlineConfig, 50);
    
    // Observer para cambios de atributos
    const attributeObserver = new MutationObserver(() => {
      forceInlineConfig();
    });
    
    attributeObserver.observe(video, {
      attributes: true,
      attributeFilter: ['controls', 'playsinline', 'webkit-playsinline']
    });

    return () => {
      clearInterval(forceConfig);
      attributeObserver.disconnect();
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