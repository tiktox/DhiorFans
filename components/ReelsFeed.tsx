import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startY = useRef(0);
  const startOffset = useRef(0);

  // Recargar cuando el componente se monta o cambia initialPostId
  useEffect(() => {
    loadContent();
  }, [initialPostId]);
  
  // Cleanup del timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const snapToIndex = useCallback((index: number) => {
    setScrollOffset(-index * 100);
    setCurrentIndex(index);
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.className = 'reels-scroll-container snapping';
    }
  }, []);

  const loadContent = async () => {
    const allPosts = await getAllPosts();
    
    // Ordenar por timestamp descendente (más recientes primero)
    const sortedPosts = allPosts.sort((a, b) => b.timestamp - a.timestamp);
    setAllContent(sortedPosts);
    
    // ✅ OPTIMIZACIÓN: Ejecutar inmediatamente sin timeout artificial
    if (initialPostId) {
      console.log('🎯 Buscando post:', initialPostId);
      const postIndex = sortedPosts.findIndex(item => item.id === initialPostId);
      console.log('📍 Índice encontrado:', postIndex, 'de', sortedPosts.length, 'posts');
      if (postIndex >= 0) {
        snapToIndex(postIndex);
      } else {
        console.log('❌ Post no encontrado, mostrando el primero');
        snapToIndex(0);
      }
    } else {
      snapToIndex(0);
    }
    setIsLoading(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (isDragging || isScrolling) return;
    
    setIsScrolling(true);
    const delta = e.deltaY;
    
    // Scroll directo a siguiente/anterior publicación
    if (delta > 0 && currentIndex < allContent.length - 1) {
      snapToIndex(currentIndex + 1);
    } else if (delta < 0 && currentIndex > 0) {
      snapToIndex(currentIndex - 1);
    }
    
    // Reset scroll state
    setTimeout(() => setIsScrolling(false), 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const endY = e.changedTouches[0].clientY;
    const deltaY = startY.current - endY;
    const threshold = 50; // Mínimo movimiento para cambiar
    
    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentIndex < allContent.length - 1) {
        snapToIndex(currentIndex + 1);
      } else if (deltaY < 0 && currentIndex > 0) {
        snapToIndex(currentIndex - 1);
      }
    }
  };

  useEffect(() => {
    if (initialPostId && allContent.length > 0) {
      const postIndex = allContent.findIndex(item => item.id === initialPostId);
      if (postIndex >= 0) {
        snapToIndex(postIndex);
      }
    }
  }, [allContent, initialPostId, snapToIndex]);



  if (isLoading) {
    return (
      <div className="reels-background" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '30px', height: '30px', border: '3px solid #333', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="reels-background" 
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={scrollContainerRef}
        className="reels-scroll-container"
        style={{
          transform: `translateY(${scrollOffset}vh)`
        }}
      >
        {allContent.map((content, index) => (
          <div
            key={content.id}
            className="reel-item"
          >
            <ReelPlayer
              post={content}
              isActive={currentIndex === index}
              onProfileClick={onExternalProfile}
              onPostDeleted={() => {
                loadContent();
                onPostDeleted?.();
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}