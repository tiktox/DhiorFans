import { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, UserData } from '../lib/userService';
import { getUserPosts, Post } from '../lib/postService';
import { initializeUserTokens, claimDailyTokens, canClaimTokens, migrateUserTokens, TokenData } from '../lib/tokenService';
import { formatLargeNumber } from '../lib/numberFormatter';
import { useIOSVideoFix } from '../hooks/useIOSVideoFix';

import EditProfile from './EditProfile';
import Settings from './Settings';
import CreateDynamic from './CreateDynamic';
import Editor from './Editor';
import Store from './Store';
import AdminTokenButton from './AdminTokenButton';

interface ProfileProps {
  onNavigateHome?: () => void;
  onNavigatePublish?: () => void;
  onNavigateSearch?: () => void;
  onNavigateChat?: () => void;
  onViewPost?: (postId: string) => void;
}

export default function Profile({ onNavigateHome, onNavigatePublish, onNavigateSearch, onNavigateChat, onViewPost }: ProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [currentView, setCurrentView] = useState('profile');
  const [showCreateDynamic, setShowCreateDynamic] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedMediaFile, setSelectedMediaFile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [showTokensTaskbar, setShowTokensTaskbar] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const taskbarRef = useRef<HTMLDivElement>(null);

  // Sistema de carga optimizado con debounce
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Aplicar fix para videos en iOS
  useIOSVideoFix();
  
  const reloadUserData = useCallback(async () => {
    if (!auth.currentUser || isLoading) return;
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await getUserData(true);
        setUserData(data);
        
        const [posts, tokens] = await Promise.allSettled([
          getUserPosts(auth.currentUser!.uid),
          initializeUserTokens(auth.currentUser!.uid)
        ]);
        
        if (posts.status === 'fulfilled') {
          setUserPosts(posts.value);
        } else {
          setUserPosts([]);
        }
        
        if (tokens.status === 'fulfilled') {
          setTokenData(tokens.value);
          
          if (canClaimTokens(tokens.value.lastClaim)) {
            claimDailyTokens(auth.currentUser!.uid, data.followers || 0)
              .then(result => {
                if (result.success) {
                  setTokenData(prev => prev ? { ...prev, tokens: result.totalTokens, lastClaim: Date.now() } : null);
                }
              })
              .catch(() => {});
          }
        } else {
          setTokenData({ tokens: 0, lastClaim: 0, followersCount: 0 });
        }
        
        migrateUserTokens(auth.currentUser!.uid, data.followers || 0).catch(() => {});
        
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [isLoading]);
  
  useEffect(() => {
    if (auth.currentUser) {
      reloadUserData();
    }
  }, [reloadUserData]);

  useEffect(() => {
    (window as any).reloadProfileData = reloadUserData;
    
    const handleAvatarChange = () => {
      if (auth.currentUser) reloadUserData();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden && auth.currentUser) reloadUserData();
    };
    
    window.addEventListener('avatarChanged', handleAvatarChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      delete (window as any).reloadProfileData;
      window.removeEventListener('avatarChanged', handleAvatarChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [reloadUserData]);

  // Cerrar barra de tareas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (taskbarRef.current && !taskbarRef.current.contains(event.target as Node)) {
        setShowTokensTaskbar(false);
      }
    };

    if (showTokensTaskbar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTokensTaskbar]);



  if (!userData) {
    return (
      <div className="profile-container">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {isLoading ? 'Cargando...' : (
            <div>
              <p>Error de conexión</p>
              <button onClick={() => reloadUserData()} style={{ marginTop: '10px', padding: '8px 16px' }}>
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'settings') {
    return <Settings onNavigateBack={() => setCurrentView('profile')} />;
  }

  if (showEditor && selectedMediaFile) {
    return (
      <Editor 
        mediaFile={selectedMediaFile}
        userTokens={tokenData?.tokens || 0}
        onNavigateBack={() => {
          setShowEditor(false);
          setSelectedMediaFile(null);
        }}
      />
    );
  }

  if (showCreateDynamic) {
    return (
      <CreateDynamic 
        onNavigateBack={() => setShowCreateDynamic(false)}
        onNavigateToEditor={(file) => {
          setSelectedMediaFile(file);
          setShowCreateDynamic(false);
          setShowEditor(true);
        }}
      />
    );
  }

  if (showStore) {
    return <Store 
      onNavigateBack={() => setShowStore(false)}
      userTokens={tokenData?.tokens || 0}
      onTokensUpdate={(newTokens) => {
        setTokenData(prev => prev ? { ...prev, tokens: newTokens } : null);
      }}
    />;
  }

  if (showEditProfile) {
    return <EditProfile 
      userData={userData} 
      onNavigateBack={() => setShowEditProfile(false)}
      onSave={(updatedData) => {
        setUserData(updatedData);
        setShowEditProfile(false);
      }}
    />;
  }
  
  return (
    <div className="profile-container">
      {/* Header with username and settings */}
      <div className="profile-header-with-settings">
        <h2 className="centered-username">{userData.username}</h2>
        <button className="settings-btn-header" onClick={() => setCurrentView('settings')}>
          ⚙️
        </button>
      </div>

      {/* Centered Profile Picture or Avatar */}
      <div className={userData.isAvatar ? "avatar-display" : "profile-pic-centered"}>
        {userData.profilePicture ? (
          <img src={userData.profilePicture} alt="Perfil" />
        ) : (
          <div className="default-avatar-profile">👤</div>
        )}
      </div>

      {/* Centered Full Name */}
      <div className="centered-name">
        <h3>{userData.fullName}</h3>
      </div>

      {/* Centered Stats */}
      <div className="centered-stats">
        <div className="stat-item">
          <span className="stat-number">{userPosts.length}</span>
          <span className="stat-label">Publicaciones</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{userData.followers || 0}</span>
          <span className="stat-label">Seguidores</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{userData.following || 0}</span>
          <span className="stat-label">Seguidos</span>
        </div>
      </div>

      {/* Centered Bio */}
      {userData.bio && (
        <div className="centered-bio">
          <p>{userData.bio}</p>
        </div>
      )}

      {/* Centered Link */}
      {userData.link && (
        <div className="centered-link">
          <a href={userData.link} target="_blank" rel="noopener noreferrer">
            {userData.link}
          </a>
        </div>
      )}

      {/* Centered Gender */}
      {userData.gender && (
        <div className="centered-gender">
          <span>{userData.gender}</span>
        </div>
      )}

      {/* Centered Action Buttons */}
      <div className="centered-actions">
        <button className="action-btn edit-btn" onClick={() => setShowEditProfile(true)}>
          Editar perfil
        </button>
        <button className="action-btn posts-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <div className="action-btn tokens-btn" onClick={() => setShowStore(true)}>
          🪙 {formatLargeNumber(tokenData?.tokens || 0)}
        </div>
      </div>

      {/* Admin Token Button */}
      {auth.currentUser && (
        <AdminTokenButton 
          userId={auth.currentUser.uid}
          onTokensAdded={(newTotal) => {
            setTokenData(prev => prev ? { ...prev, tokens: newTotal } : null);
          }}
        />
      )}

      {/* Posts Grid */}
      <div className="posts-grid">
        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <div 
              key={post.id} 
              className="post-thumbnail"
              onClick={() => {
                console.log('📱 Clic en post del perfil:', post.id);
                onViewPost?.(post.id);
              }}
            >
              {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} className="post-media" />
              ) : (
                <img src={post.mediaUrl} alt={post.title} className="post-media" />
              )}
              <div className="post-overlay">
                <span className="post-title">{post.title}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-posts">
            <p>No hay publicaciones aún</p>
            <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
              Si acabas de crear contenido, puede tardar unos minutos en aparecer
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="nav-icon home-icon" onClick={onNavigateHome}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        </div>
        <div className="nav-icon nav-search-btn" onClick={onNavigateSearch}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <div className="nav-icon add-icon" onClick={onNavigatePublish}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <div className="nav-icon message-icon" onClick={onNavigateChat}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div className={`profile-pic-nav ${userData.isAvatar ? 'avatar-format' : 'photo-format'}`} data-is-avatar={userData.isAvatar ? 'true' : 'false'}>
          {userData.profilePicture ? (
            <img src={userData.profilePicture} alt="Perfil" />
          ) : (
            <div className="default-nav-avatar">👤</div>
          )}
        </div>
      </div>
    </div>
  );
}