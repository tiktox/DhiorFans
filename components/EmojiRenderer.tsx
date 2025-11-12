import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { ANIMATED_EMOJIS } from '../lib/emojiService';

interface EmojiRendererProps {
  content: string;
}

export default function EmojiRenderer({ content }: EmojiRendererProps) {
  const [emojiData, setEmojiData] = useState<any>(null);
  const [isEmoji, setIsEmoji] = useState(false);
  const [emojiId, setEmojiId] = useState<string>('');

  useEffect(() => {
    const emojiMatch = content.match(/^\[emoji:(.+)\]$/);
    if (emojiMatch) {
      setIsEmoji(true);
      setEmojiId(emojiMatch[1]);
      loadEmoji(emojiMatch[1]);
    }
  }, [content]);

  const loadEmoji = async (id: string) => {
    const emoji = ANIMATED_EMOJIS.find(e => e.id === id);
    if (!emoji) return;

    try {
      const response = await fetch(emoji.path);
      const data = await response.json();
      setEmojiData(data);
    } catch (error) {
      console.error('Error loading emoji:', error);
    }
  };

  if (!isEmoji) {
    return <p>{content}</p>;
  }

  if (!emojiData) {
    return <div className="emoji-loading">⏳</div>;
  }

  return (
    <div className="animated-emoji-message">
      <Lottie
        animationData={emojiData}
        loop={true}
        autoplay={true}
        style={{ width: 120, height: 120 }}
      />
    </div>
  );
}
