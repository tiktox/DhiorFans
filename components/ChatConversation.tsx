import { useState, useEffect, useRef } from 'react';
import { UserWithId } from '../lib/userService';
import { sendMessage, listenToMessages, markMessagesAsRead, Message } from '../lib/chatService';
import AnimatedEmojiModal from './AnimatedEmojiModal';
import EmojiRenderer from './EmojiRenderer';
import { AnimatedEmoji } from '../lib/emojiService';

interface ChatConversationProps {
  user: UserWithId;
  currentUserId: string;
  onNavigateBack: () => void;
}

export default function ChatConversation({ user, currentUserId, onNavigateBack }: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Configurar listener para mensajes en tiempo real
    const unsubscribe = listenToMessages(currentUserId, user.id, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });
    
    unsubscribeRef.current = unsubscribe;
    
    // Marcar mensajes como leídos
    markMessagesAsRead(currentUserId, user.id);
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentUserId, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(currentUserId, user.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSelectEmoji = async (emoji: AnimatedEmoji) => {
    try {
      await sendMessage(currentUserId, user.id, `[emoji:${emoji.id}]`);
    } catch (error) {
      console.error('Error sending emoji:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const getStatusText = () => {
    if (otherUserTyping) return 'Escribiendo...';
    return `Visto ${formatTime(lastSeen)}`;
  };

  return (
    <div className="chat-conversation">
      {/* Header */}
      <div className="conversation-header">
        <button className="back-btn-chat" onClick={onNavigateBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        
        <div className="user-info-header">
          <div className="user-avatar-header" data-is-avatar={user.isAvatar ? 'true' : 'false'}>
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.fullName} />
            ) : (
              <div className="default-avatar-header">👤</div>
            )}
          </div>
          <div className="user-details">
            <h3 className="user-name">{user.fullName}</h3>
            <span className="user-status">{getStatusText()}</span>
          </div>
        </div>

        <button className="call-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>Inicia una conversación con {user.fullName}</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="date-separator">
                      <span>{formatDate(message.timestamp)}</span>
                    </div>
                  )}
                  
                  <div className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}>
                    <div className="message-content">
                      <EmojiRenderer content={message.content} />
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="message-input-container">
        <button className="emoji-btn" onClick={() => setShowEmojiModal(true)}>😊</button>
        
        <div className="input-wrapper">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe un mensaje..."
            className="message-input"
          />
          <button className="camera-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
        </div>

        <button 
          className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
          onClick={handleSendMessage}
        >
          {newMessage.trim() ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>
      </div>

      {/* Emoji Modal */}
      <AnimatedEmojiModal
        isOpen={showEmojiModal}
        onClose={() => setShowEmojiModal(false)}
        onSelectEmoji={handleSelectEmoji}
      />
    </div>
  );
}