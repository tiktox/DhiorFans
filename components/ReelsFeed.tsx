import { useState, useEffect, useRef } from 'react';
import { getReels, Reel } from '../lib/reelsService';
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
  const [reels, setReels] = useState<Reel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allContent, setAllContent] = useState<Reel[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReels();
  }, [activeTab]);
  
  // Recargar cuando el componente se monta (para capturar nuevas publicaciones)
  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = () => {
    try {
      const allReels = getReels();
      const allPosts = getAllPosts(); // Esto ya obtiene TODAS las publicaciones de TODOS los usuarios
      console.log('🔍 DEBUG Feed cargado:');
      console.log('- Reels:', allReels.length);
      console.log('- Posts:', allPosts.length);
      console.log('- Posts data:', allPosts);
      
      setReels(allReels);
      setPosts(allPosts);
      
      // Convertir posts a formato reel para compatibilidad
      const postsAsReels: Reel[] = allPosts.map(post => {
        const userData = getUserDataById(post.userId);
        console.log(`🔍 Post ${post.id} - userId: ${post.userId}, userData:`, userData);
        return {
          id: post.id,
          userId: post.userId,
          username: userData?.username || post.username,
          fullName: userData?.fullName || post.username,
          profilePicture: userData?.profilePicture || post.profilePicture || '',
          videoUrl: post.mediaUrl,
          description: post.description,
          timestamp: post.timestamp,
          mediaType: post.mediaType,
          title: post.title
        };
      });
      
      // Combinar reels y posts convertidos, ordenar por timestamp
      const combined = [...allReels, ...postsAsReels].sort((a, b) => b.timestamp - a.timestamp);
      console.log('🔍 Contenido final:', combined.length, 'items');
      console.log('🔍 Usuarios únicos:', Array.from(new Set(combined.map(c => c.userId))).length);
      console.log('🔍 Combined data:', combined);
      setAllContent(combined);
      
      // Si hay un postId inicial, encontrar su índice
      if (initialPostId) {
        const postIndex = combined.findIndex(item => item.id === initialPostId);
        setCurrentIndex(postIndex >= 0 ? postIndex : 0);
      } else {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('❌ Error loading feed:', error);
      setAllContent([]);
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
        <p>No hay contenido disponible</p>
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
            loadReels();
            onPostDeleted?.();
          }}
        />
      ))}
    </div>
  );
}