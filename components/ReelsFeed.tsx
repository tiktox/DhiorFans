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
    const newOffset = -index * window.innerHeight;
    setScrollOffset(newOffset);
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
    
    // Si hay un postId inicial, encontrar su índice después de que se actualice el estado
    setTimeout(() => {
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
    }, 100);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (isDragging) return;
    
    const delta = e.deltaY;
    const sensitivity = 3.9;
    const newOffset = scrollOffset - delta * sensitivity;
    const maxOffset = -(allContent.length - 1.5) * window.innerHeight;
    
    const clampedOffset = Math.max(maxOffset, Math.min(0, newOffset));
    setScrollOffset(clampedOffset);
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.className = 'reels-scroll-container scrolling';
    }
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const targetIndex = Math.round(-clampedOffset / window.innerHeight);
      snapToIndex(Math.max(0, Math.min(allContent.length - 1, targetIndex)));
    }, 150);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startOffset.current = scrollOffset;
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.className = 'reels-scroll-container scrolling';
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    const newOffset = startOffset.current + deltaY;
    const maxOffset = -(allContent.length - 1) * window.innerHeight;
    
    const clampedOffset = Math.max(maxOffset, Math.min(0, newOffset));
    setScrollOffset(clampedOffset);
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const targetIndex = Math.round(-scrollOffset / window.innerHeight);
    snapToIndex(Math.max(0, Math.min(allContent.length - 1, targetIndex)));
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
          transform: `translateY(${scrollOffset}px)`
        }}
      >
        {allContent.map((content, index) => (
          <div
            key={content.id}
            className="reel-item"
            style={{
              top: `${index * 100}vh`
            }}
          >
            <ReelPlayer
              post={content}
              isActive={Math.round(-scrollOffset / window.innerHeight) === index}
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