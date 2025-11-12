import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { ANIMATED_EMOJIS, EMOJI_CATEGORIES, getEmojisByCategory, AnimatedEmoji } from '../lib/emojiService';

interface AnimatedEmojiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: AnimatedEmoji) => void;
}

export default function AnimatedEmojiModal({ isOpen, onClose, onSelectEmoji }: AnimatedEmojiModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const [emojiData, setEmojiData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadEmojiData = async (emoji: AnimatedEmoji) => {
    if (emojiData[emoji.id]) return emojiData[emoji.id];
    
    try {
      const response = await fetch(emoji.path);
      const data = await response.json();
      setEmojiData(prev => ({ ...prev, [emoji.id]: data }));
      return data;
    } catch (error) {
      console.error('Error loading emoji:', error);
      return null;
    }
  };

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
            <div
              key={emoji.id}
              className="emoji-item"
              onClick={() => handleEmojiClick(emoji)}
              onMouseEnter={() => {
                setHoveredEmoji(emoji.id);
                loadEmojiData(emoji);
              }}
              onMouseLeave={() => setHoveredEmoji(null)}
            >
              {emojiData[emoji.id] ? (
                <Lottie
                  animationData={emojiData[emoji.id]}
                  loop={hoveredEmoji === emoji.id}
                  autoplay={hoveredEmoji === emoji.id}
                  style={{ width: 60, height: 60 }}
                />
              ) : (
                <div className="emoji-placeholder">
                  <span>{emoji.name[0]}</span>
                </div>
              )}
              <span className="emoji-name">{emoji.name}</span>
            </div>
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
