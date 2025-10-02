import { useState, useEffect, useRef } from 'react';
import { getAllPosts, Post } from '../lib/postService';
import ReelPlayer from './ReelPlayer';

interface ReelsFeedProps {
  activeTab: string;
  onExternalProfile?: (userId: string) => void;
  initialPostId?: string;
  onPostDeleted?: () => void;
}

export default function ReelsFeed({ activeTab, onExternalProfile, initialPostId, onPostDeleted }: ReelsFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allContent, setAllContent] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Recargar cuando el componente se monta (para capturar nuevas publicaciones)
  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    const allPosts = await getAllPosts();
    
    // Ordenar por timestamp descendente (más recientes primero)
    const sortedPosts = allPosts.sort((a, b) => b.timestamp - a.timestamp);
    setAllContent(sortedPosts);
    
    // Si hay un postId inicial, encontrar su índice
    if (initialPostId) {
      const postIndex = sortedPosts.findIndex(item => item.id === initialPostId);
      setCurrentIndex(postIndex >= 0 ? postIndex : 0);
    } else {
      setCurrentIndex(0);
    }
    
    setTimeout(() => setIsLoading(false), 100);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0 && currentIndex < allContent.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTouchStart = useRef({ y: 0 });
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaY = handleTouchStart.current.y - touch.clientY;
    
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0 && currentIndex < allContent.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      handleTouchStart.current.y = touch.clientY;
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: currentIndex * window.innerHeight,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);



  if (isLoading) {
    return (
      <div className="reels-background" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '30px', height: '30px', border: '3px solid #333', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div 
      className="reels-background" 
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={(e) => handleTouchStart.current.y = e.touches[0].clientY}
      onTouchMove={handleTouchMove}
    >
      {allContent.map((content, index) => (
        <ReelPlayer
          key={content.id}
          post={content}
          isActive={index === currentIndex}
          onProfileClick={onExternalProfile}
          onPostDeleted={() => {
            loadContent();
            onPostDeleted?.();
          }}
        />
      ))}
    </div>
  );
}