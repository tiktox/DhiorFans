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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Configuración específica para iOS
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    
    // Prevenir pantalla completa en iOS
    const preventFullscreen = (e: Event) => {
      e.preventDefault();
      return false;
    };

    video.addEventListener('webkitbeginfullscreen', preventFullscreen);
    video.addEventListener('webkitendfullscreen', preventFullscreen);

    return () => {
      video.removeEventListener('webkitbeginfullscreen', preventFullscreen);
      video.removeEventListener('webkitendfullscreen', preventFullscreen);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      controls={controls}
      poster={poster}
      playsInline
      webkit-playsinline="true"
      onClick={onClick}
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'cover',
        WebkitTransform: 'translateZ(0)' // Forzar aceleración de hardware
      }}
    />
  );
}