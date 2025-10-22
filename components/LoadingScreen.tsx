import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!videoEnded) {
        onComplete();
      }
    }, 1500); // Fallback después de 1.5s

    return () => clearTimeout(timer);
  }, [videoEnded, onComplete]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    onComplete();
  };

  return (
    <div className="loading-screen">
      <video
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        className="loading-video"
      >
        <source src="https://www.pexels.com/es-es/download/video/32679223/" type="video/mp4" />
      </video>
    </div>
  );
}