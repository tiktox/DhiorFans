import { useState, useEffect, useRef } from 'react';
import { Reel } from '../lib/reelsService'; // Asumimos que la interfaz Reel existe
import { getAllPosts, Post } from '../lib/postService';
import { getUserDataById } from '../lib/userService';
import ReelPlayer from './ReelPlayer';
import ExternalProfile from './ExternalProfile';

interface ReelsFeedProps {
  activeTab: string;
  onExternalProfile?: (userId: string) => void;
  initialPostId?: string;
  onPostDeleted?: () => void;
}

export default function ReelsFeed({ activeTab, onExternalProfile, initialPostId, onPostDeleted }: ReelsFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allContent, setAllContent] = useState<Reel[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Recargar cuando el componente se monta (para capturar nuevas publicaciones)
  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    const allPosts = await getAllPosts();

    // Convertir posts a formato reel para compatibilidad
    const postsAsReels: Reel[] = allPosts.map(post => ({
      id: post.id,
      userId: post.userId,
      username: post.username,
      fullName: post.username,
      profilePicture: post.profilePicture || '',
      videoUrl: post.mediaUrl,
      description: post.description,
      timestamp: post.timestamp,
      mediaType: post.mediaType,
      title: post.title
    }));
    
    // Por ahora solo usamos posts. Si se agregan reels, se combinarían aquí.
    setAllContent(postsAsReels);
    
    // Si hay un postId inicial, encontrar su índice
    if (initialPostId) {
      const postIndex = combined.findIndex(item => item.id === initialPostId);
      setCurrentIndex(postIndex >= 0 ? postIndex : 0);
    } else {
      setCurrentIndex(0);
    }
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

  if (allContent.length === 0) {
    return (
      <div className="empty-feed-background">
        <p>No hay reels disponibles</p>
        <p>¡Sé el primero en publicar!</p>
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
          reel={content}
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