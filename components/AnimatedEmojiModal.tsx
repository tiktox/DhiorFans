import { useState, useEffect, useRef, useCallback } from 'react';
import Lottie from 'lottie-react';
import { ANIMATED_EMOJIS, EMOJI_CATEGORIES, getEmojisByCategory, AnimatedEmoji } from '../lib/emojiService';
import { emojiCache } from '../lib/emojiCache';

interface AnimatedEmojiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: AnimatedEmoji) => void;
}

// Componente optimizado para cada emoji
const EmojiItem = ({ emoji, emojiData, isLoading, isHovered, observer, onClick, onMouseEnter, onMouseLeave }: {
  emoji: AnimatedEmoji;
  emojiData: any;
  isLoading: boolean;
  isHovered: boolean;
  observer: IntersectionObserver | null;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (observer && itemRef.current) {
      itemRef.current.setAttribute('data-emoji-id', emoji.id);
      observer.observe(itemRef.current);
      return () => {
        if (itemRef.current) observer.unobserve(itemRef.current);
      };
    }
  }, [observer, emoji.id]);
  
  return (
    <div
      ref={itemRef}
      className="emoji-item"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {emojiData ? (
        <Lottie
          animationData={emojiData}
          loop={isHovered}
          autoplay={isHovered}
          style={{ width: 60, height: 60 }}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice'
          }}
        />
      ) : isLoading ? (
        <div style={{ background: 'none' }}>
          <div style={{ background: 'none' }}></div>
        </div>
      ) : (
        <div className="emoji-placeholder">
          <span>{emoji.name[0]}</span>
        </div>
      )}
      <span className="emoji-name">{emoji.name}</span>
    </div>
  );
};

export default function AnimatedEmojiModal({ isOpen, onClose, onSelectEmoji }: AnimatedEmojiModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const [emojiData, setEmojiData] = useState<{ [key: string]: any }>({});
  const [loadingEmojis, setLoadingEmojis] = useState<Set<string>>(new Set());
  const [visibleEmojis, setVisibleEmojis] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cacheRef = useRef<{ [key: string]: any }>({});

  const loadEmojiData = useCallback(async (emoji: AnimatedEmoji) => {
    if (loadingEmojis.has(emoji.id)) return null;
    
    setLoadingEmojis(prev => new Set(Array.from(prev).concat(emoji.id)));
    
    try {
      const data = await emojiCache.get(emoji.id, emoji.path);
      setEmojiData(prev => ({ ...prev, [emoji.id]: data }));
      setLoadingEmojis(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(emoji.id);
        return newSet;
      });
      return data;
    } catch (error) {
      console.error(`Error loading emoji ${emoji.id}:`, error);
      setLoadingEmojis(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(emoji.id);
        return newSet;
      });
      return null;
    }
  }, [loadingEmojis]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Precargar emojis más populares usando cache
      const popularEmojis = ANIMATED_EMOJIS.slice(0, 8);
      const popularIds = popularEmojis.map(e => e.id);
      const popularPaths = popularEmojis.map(e => e.path);
      emojiCache.preload(popularIds, popularPaths);
      
      // Cargar datos ya cacheados
      popularEmojis.forEach(emoji => {
        setTimeout(() => loadEmojiData(emoji), 50);
      });
      
      // Configurar Intersection Observer para lazy loading
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const emojiId = entry.target.getAttribute('data-emoji-id');
              if (emojiId) {
                setVisibleEmojis(prev => new Set(Array.from(prev).concat(emojiId)));
                const emoji = ANIMATED_EMOJIS.find(e => e.id === emojiId);
                if (emoji) loadEmojiData(emoji);
              }
            }
          });
        },
        { rootMargin: '50px' }
      );
    } else {
      document.body.style.overflow = 'unset';
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isOpen, loadEmojiData]);

  const handleEmojiClick = (emoji: AnimatedEmoji) => {
    onSelectEmoji(emoji);
    onClose();
  };

  const filteredEmojis = searchQuery 
    ? ANIMATED_EMOJIS.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : getEmojisByCategory(selectedCategory);

  if (!isOpen) return null;

  return (
    <div className="emoji-modal-overlay" onClick={onClose}>
      <div className="emoji-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="emoji-modal-header">
          <h3>Emojis Animados</h3>
          <button className="emoji-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="emoji-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        {!searchQuery && (
          <div className="emoji-categories">
            {EMOJI_CATEGORIES.map(category => (
              <button
                key={category.id}
                className={`emoji-category ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emoji Grid */}
        <div className="emoji-grid">
          {filteredEmojis.map(emoji => (
            <EmojiItem
              key={emoji.id}
              emoji={emoji}
              emojiData={emojiData[emoji.id]}
              isLoading={loadingEmojis.has(emoji.id)}
              isHovered={hoveredEmoji === emoji.id}
              observer={observerRef.current}
              onClick={() => handleEmojiClick(emoji)}
              onMouseEnter={() => {
                setHoveredEmoji(emoji.id);
                if (!emojiData[emoji.id] && !loadingEmojis.has(emoji.id)) {
                  loadEmojiData(emoji);
                }
              }}
              onMouseLeave={() => setHoveredEmoji(null)}
            />
          ))}
        </div>

        {filteredEmojis.length === 0 && (
          <div className="no-emojis">
            <p>No se encontraron emojis</p>
          </div>
        )}
      </div>
    </div>
  );
}
