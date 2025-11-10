import { useState, useEffect } from 'react';
import { auth, useFirebaseConnection } from '../lib/firebase';
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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const connectionState = useFirebaseConnection();

  useEffect(() => {
    if (!auth.currentUser) return;

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const setupNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // Suscribirse a notificaciones en tiempo real
        unsubscribe = subscribeToNotifications(
          auth.currentUser!.uid,
          async (newNotifications) => {
            if (!isMounted) return;
            
            try {
              setNotifications(newNotifications);
              
              // Cargar datos de usuarios con manejo de errores individual
              const userIdsSet = new Set(
                newNotifications
                  .map(n => n.fromUserId)
                  .filter(id => id && id !== 'system')
              );
              const userIds = Array.from(userIdsSet);
              const usersDataMap: {[key: string]: UserData} = {};
              
              // Cargar usuarios en paralelo con manejo de errores
              const userPromises = userIds.map(async (userId) => {
                try {
                  const userData = await getUserDataById(userId);
                  if (userData && isMounted) {
                    usersDataMap[userId] = userData;
                  }
                } catch (userError) {
                  console.warn(`Error cargando usuario ${userId}:`, userError);
                }
              });
              
              await Promise.allSettled(userPromises);
              
              if (isMounted) {
                setUsersData(usersDataMap);
                setLoading(false);
                setRetryCount(0);
              }
              
            } catch (callbackError) {
              console.error('Error procesando notificaciones:', callbackError);
              if (isMounted) {
                setError('Error procesando notificaciones');
                setLoading(false);
              }
            }
          }
        );
        
      } catch (setupError) {
        console.error('Error configurando notificaciones:', setupError);
        if (isMounted) {
          setError('Error conectando con las notificaciones');
          setLoading(false);
          
          // Reintentar si no se ha excedido el límite
          if (retryCount < 3) {
            setTimeout(() => {
              if (isMounted) {
                setRetryCount(prev => prev + 1);
                setupNotifications();
              }
            }, Math.pow(2, retryCount) * 1000);
          }
        }
      }
    };

    setupNotifications();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [retryCount]);
  
  // Reintentar cuando la conexión se restaure
  useEffect(() => {
    if (connectionState === 'connected' && error) {
      setRetryCount(0);
    }
  }, [connectionState, error]);

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
      case 'tokens':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffc107" stroke="none">
            <circle cx="12" cy="12" r="10" fill="#ffc107"/>
            <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#000">🪙</text>
          </svg>
        );
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Marcar como leída
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
      }

      // Navegar según el tipo
      if (notification.type === 'follow') {
        onViewProfile?.(notification.fromUserId);
      } else if (notification.type === 'tokens') {
        // No navegar, solo marcar como leída
        return;
      } else if (notification.postId) {
        onViewPost?.(notification.postId);
      }
    } catch (error) {
      console.error('Error manejando click de notificación:', error);
      // Continuar con la navegación aunque falle marcar como leída
      if (notification.type === 'follow') {
        onViewProfile?.(notification.fromUserId);
      } else if (notification.postId && notification.type !== 'tokens') {
        onViewPost?.(notification.postId);
      }
    }
  };
  
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
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
        {/* Indicador de estado de conexión */}
        {connectionState !== 'connected' && (
          <div className={`connection-status ${connectionState}`}>
            {connectionState === 'reconnecting' && '🔄 Reconectando...'}
            {connectionState === 'disconnected' && '🚫 Sin conexión'}
            {connectionState === 'error' && '❌ Error de conexión'}
          </div>
        )}
        
        {loading ? (
          <div className="notifications-loading">
            <p>Cargando notificaciones...</p>
            {retryCount > 0 && <p>Reintento {retryCount}/3...</p>}
          </div>
        ) : error ? (
          <div className="notifications-error">
            <div className="error-icon">❌</div>
            <p>Error cargando notificaciones</p>
            <span>{error}</span>
            <button onClick={handleRetry} className="retry-btn">
              Reintentar
            </button>
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
                  <div className="notification-avatar" data-is-avatar={userData?.isAvatar ? 'true' : 'false'}>
                    {notification.type === 'tokens' ? (
                      <div className="tokens-avatar">🪙</div>
                    ) : userData?.profilePicture ? (
                      <img src={userData.profilePicture} alt={userData.username} />
                    ) : (
                      <div className="default-avatar">
                        {userData?.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="notification-content">
                    <div className="notification-text">
                      {notification.type === 'tokens' ? (
                        <span className="notification-message tokens-message">{notification.message}</span>
                      ) : (
                        <>
                          <span className="notification-username">
                            {userData?.username || 'Usuario'}
                          </span>
                          {' '}
                          <span className="notification-message">{notification.message}</span>
                        </>
                      )}
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
