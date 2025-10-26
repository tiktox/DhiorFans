import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserDataById, UserData } from '../lib/userService';
import { 
  subscribeToNotifications, 
  markNotificationAsRead,
  Notification 
} from '../lib/notificationService';

interface NotificationsProps {
  onNavigateBack: () => void;
  onViewProfile?: (userId: string) => void;
  onViewPost?: (postId: string) => void;
}

export default function Notifications({ onNavigateBack, onViewProfile, onViewPost }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [usersData, setUsersData] = useState<{[key: string]: UserData}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);

    // Suscribirse a notificaciones en tiempo real
    const unsubscribe = subscribeToNotifications(
      auth.currentUser.uid,
      async (newNotifications) => {
        setNotifications(newNotifications);
        
        // Cargar datos de usuarios
        const userIds = [...new Set(newNotifications.map(n => n.fromUserId))];
        const usersDataMap: {[key: string]: UserData} = {};
        
        for (const userId of userIds) {
          const userData = await getUserDataById(userId);
          if (userData) {
            usersDataMap[userId] = userData;
          }
        }
        
        setUsersData(usersDataMap);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Ahora';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`;
    return `Hace ${Math.floor(seconds / 604800)}sem`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff3040" stroke="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        );
      case 'comment':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        );
      case 'follow':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    // Navegar según el tipo
    if (notification.type === 'follow') {
      onViewProfile?.(notification.fromUserId);
    } else if (notification.postId) {
      onViewPost?.(notification.postId);
    }
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <button className="back-btn" onClick={onNavigateBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h2>Notificaciones</h2>
        <div></div>
      </div>

      <div className="notifications-content">
        {loading ? (
          <div className="notifications-loading">
            <p>Cargando notificaciones...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon">🔔</div>
            <p>No tienes notificaciones</p>
            <span>Cuando alguien interactúe con tu contenido, lo verás aquí</span>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => {
              const userData = usersData[notification.fromUserId];
              
              return (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-avatar">
                    {userData?.profilePicture ? (
                      <img src={userData.profilePicture} alt={userData.username} />
                    ) : (
                      <div className="default-avatar">
                        {userData?.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="notification-content">
                    <div className="notification-text">
                      <span className="notification-username">
                        {userData?.username || 'Usuario'}
                      </span>
                      {' '}
                      <span className="notification-message">{notification.message}</span>
                    </div>
                    <div className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </div>
                  </div>

                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
