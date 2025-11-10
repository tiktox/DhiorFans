import { useState, useEffect, useRef } from 'react';
import { auth, useFirebaseConnection } from '../lib/firebase';
import { getUserData, UserData, UserWithId } from '../lib/userService';
import { getChatUsers, getConversations, Conversation, clearChatCache } from '../lib/chatService';
import ChatConversation from './ChatConversation';

interface ChatProps {
  onNavigateHome: () => void;
}

export default function Chat({ onNavigateHome }: ChatProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatUsers, setChatUsers] = useState<UserWithId[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const touchStartY = useRef(0);
  const conversationsRef = useRef<HTMLDivElement>(null);
  const connectionState = useFirebaseConnection();

  useEffect(() => {
    loadData();
  }, []);
  
  // Recargar cuando el componente vuelve a ser visible
  useEffect(() => {
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadData = async (isRetry = false) => {
    if (!auth.currentUser) return;
    
    try {
      if (!isRetry) {
        setLoading(true);
      }
      setError(null);
      
      console.log('💬 Cargando datos de chat...');
      
      // Cargar datos de usuario primero
      const userDataResult = await getUserData();
      setUserData(userDataResult);
      
      // Luego cargar datos de chat con manejo de errores individual
      const [chatUsersResult, conversationsResult] = await Promise.allSettled([
        getChatUsers(auth.currentUser.uid),
        getConversations(auth.currentUser.uid)
      ]);
      
      // Manejar resultados de chat users
      if (chatUsersResult.status === 'fulfilled') {
        setChatUsers(chatUsersResult.value);
        console.log(`✅ ${chatUsersResult.value.length} usuarios de chat cargados`);
      } else {
        console.error('Error loading chat users:', chatUsersResult.reason);
        setChatUsers([]);
      }
      
      // Manejar resultados de conversaciones
      if (conversationsResult.status === 'fulfilled') {
        setConversations(conversationsResult.value);
        console.log(`✅ ${conversationsResult.value.length} conversaciones cargadas`);
      } else {
        console.error('Error loading conversations:', conversationsResult.reason);
        setConversations([]);
      }
      
      setRetryCount(0); // Reset en caso de éxito
      
    } catch (error) {
      console.error('Error crítico cargando datos de chat:', error);
      setError('Error cargando el chat');
      
      // Asegurar que los estados se reseteen en caso de error
      setChatUsers([]);
      setConversations([]);
      
      // Reintentar si no se ha excedido el límite
      if (retryCount < 3 && !isRetry) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadData(true);
        }, Math.pow(2, retryCount) * 1000);
      }
      
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (conversationsRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (conversationsRef.current?.scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;
      
      if (distance > 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, 80));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      clearChatCache(); // Limpiar cache antes de recargar
      loadData();
    }
    setPullDistance(0);
  };
  
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    clearChatCache();
    loadData();
  };
  
  // Reintentar cuando la conexión se restaure
  useEffect(() => {
    if (connectionState === 'connected' && error) {
      handleRetry();
    }
  }, [connectionState, error]);

  const filteredUsers = chatUsers.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Si hay un usuario seleccionado, mostrar la conversación
  if (selectedUser && userData && auth.currentUser) {
    return (
      <ChatConversation 
        user={selectedUser}
        currentUserId={auth.currentUser.uid}
        onNavigateBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <button className="back-btn" onClick={onNavigateHome}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          </button>
        </div>
        <div className="header-center">
          <h2>Chats</h2>
        </div>
        <div className="header-right">
          <button className="chat-settings">
            ≡
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="chat-search">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-chat"
        />
        <div className="search-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
      </div>

      {/* Chat Users */}
      <div className="following-users">
        <div key="current-user" className={`following-user ${userData?.isAvatar ? 'avatar-small-chat' : ''}`} data-is-avatar={userData?.isAvatar ? 'true' : 'false'}>
          {userData?.profilePicture ? (
            <img src={userData.profilePicture} alt="Mi perfil" />
          ) : (
            <div className="default-avatar-small">👤</div>
          )}
        </div>
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className={`following-user ${user.isAvatar ? 'avatar-small-chat' : ''}`}
            data-is-avatar={user.isAvatar ? 'true' : 'false'}
            onClick={() => setSelectedUser(user)}
          >
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.fullName} />
            ) : (
              <div className="default-avatar-small">👤</div>
            )}
          </div>
        ))}
      </div>

      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="pull-refresh-indicator"
          style={{
            transform: `translateY(${pullDistance}px)`,
            opacity: pullDistance / 60
          }}
        >
          <div className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}>
            ↻
          </div>
          <span>{isRefreshing ? 'Actualizando...' : 'Desliza para actualizar'}</span>
        </div>
      )}

      {/* Indicador de estado de conexión */}
      {connectionState !== 'connected' && (
        <div className={`connection-status ${connectionState}`}>
          {connectionState === 'reconnecting' && '🔄 Reconectando chat...'}
          {connectionState === 'disconnected' && '🚫 Chat sin conexión'}
          {connectionState === 'error' && '❌ Error en el chat'}
        </div>
      )}

      {/* Conversations */}
      <div 
        className="conversations"
        ref={conversationsRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {loading ? (
          <div className="chat-loading">
            <p>Cargando chats...</p>
            {retryCount > 0 && <p>Reintento {retryCount}/3...</p>}
          </div>
        ) : error ? (
          <div className="chat-error">
            <div className="error-icon">❌</div>
            <p>Error cargando el chat</p>
            <span>{error}</span>
            <button onClick={handleRetry} className="retry-btn">
              Reintentar
            </button>
          </div>
        ) : conversations.length > 0 ? (
          conversations.map((conversation) => (
            <div 
              key={conversation.id} 
              className="conversation-item"
              onClick={() => {
                const user: UserWithId = {
                  id: conversation.userId,
                  username: conversation.userName.toLowerCase().replace(' ', ''),
                  email: '',
                  fullName: conversation.userName,
                  profilePicture: conversation.userAvatar,
                  bio: '',
                  link: '',
                  gender: undefined,
                  followers: 0,
                  following: 0,
                  posts: 0,
                  isAvatar: conversation.isAvatar || false
                };
                setSelectedUser(user);
              }}
            >
              <div className={`conversation-avatar ${conversation.isAvatar ? 'avatar-format' : ''}`} data-is-avatar={conversation.isAvatar ? 'true' : 'false'}>
                {conversation.userAvatar ? (
                  <img src={conversation.userAvatar} alt={conversation.userName} />
                ) : (
                  <div className="default-avatar-conversation">👤</div>
                )}
              </div>
              <div className="conversation-content">
                <div className="conversation-header">
                  <span className="conversation-name">{conversation.userName}</span>
                  <span className="conversation-time">
                    {new Date(conversation.timestamp).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="conversation-footer">
                  <span className="last-message">{conversation.lastMessage}</span>
                  {conversation.isRead ? (
                    <span className="read-status">Visto</span>
                  ) : (
                    <span className="unread-count">{conversation.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-conversations">
            <p>No tienes conversaciones aún</p>
            <p>Comienza a seguir usuarios para chatear con ellos</p>
          </div>
        )}
      </div>
    </div>
  );
}