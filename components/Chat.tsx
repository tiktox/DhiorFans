import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, UserData } from '../lib/userService';
import { getChatUsers, getConversations, Conversation } from '../lib/chatService';
import ChatConversation from './ChatConversation';

interface ChatProps {
  onNavigateHome: () => void;
}

export default function Chat({ onNavigateHome }: ChatProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatUsers, setChatUsers] = useState<UserData[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      const [userDataResult, chatUsersResult, conversationsResult] = await Promise.all([
        getUserData(),
        getChatUsers(auth.currentUser.uid),
        getConversations(auth.currentUser.uid)
      ]);
      
      setUserData(userDataResult);
      setChatUsers(chatUsersResult);
      setConversations(conversationsResult);
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

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
            ←
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
        <div className="search-icon">🔍</div>
      </div>

      {/* Chat Users */}
      <div className="following-users">
        <div key="current-user" className="following-user">
          {userData?.profilePicture ? (
            <img src={userData.profilePicture} alt="Mi perfil" />
          ) : (
            <div className="default-avatar-small">👤</div>
          )}
        </div>
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className="following-user"
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

      {/* Conversations */}
      <div className="conversations">
        {loading ? (
          <div className="chat-loading">
            <p>Cargando chats...</p>
          </div>
        ) : conversations.length > 0 ? (
          conversations.map((conversation) => (
            <div key={conversation.id} className="conversation-item">
              <div className="conversation-avatar">
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