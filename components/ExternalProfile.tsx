import { useState, useEffect } from 'react';
import { getUserPosts, Post } from '../lib/postService';
import { UserData } from '../lib/userService';
import { followUser, unfollowUser, isFollowing } from '../lib/followService';
import { getUserTokens, TokenData } from '../lib/tokenService';
import PostModal from './PostModal';

interface ExternalProfileProps {
  userId: string;
  userData: UserData;
  onNavigateBack: () => void;
  onViewPost?: (postId: string) => void;
}

export default function ExternalProfile({ userId, userData, onNavigateBack, onViewPost }: ExternalProfileProps) {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(userData.followers || 0);
  const [toast, setToast] = useState<{message: string; type: 'error' | 'success'} | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Cargando datos del perfil externo para usuario:', userId);
        
        const [posts, following] = await Promise.all([
          getUserPosts(userId),
          isFollowing(userId)
        ]);
        
        setUserPosts(posts);
        setIsFollowingUser(following);
        
        // Actualizar contador de seguidores con el valor actual de userData
        setFollowersCount(userData.followers || 0);
        
        console.log('👤 Estado de seguimiento:', following ? 'Siguiendo' : 'No siguiendo');
        console.log('📊 Seguidores actuales:', userData.followers);
        
        // Cargar tokens del usuario
        try {
          const tokens = await getUserTokens(userId);
          setTokenData(tokens);
          console.log('🪙 Tokens cargados para usuario externo:', userId, tokens);
        } catch (tokenError) {
          console.log('⚠️ Error cargando tokens, usando valores por defecto:', tokenError);
          setTokenData({ tokens: 0, lastClaim: 0, followersCount: 0 });
        }
      } catch (error) {
        console.error('Error cargando datos del perfil:', error);
      }
    };
    loadData();
  }, [userId, userData.followers]);

  const handleFollowToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Verificar estado actual antes de la acción
      const currentFollowingState = await isFollowing(userId);
      
      if (currentFollowingState) {
        await unfollowUser(userId);
        setIsFollowingUser(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        setToast({message: 'Has dejado de seguir a este usuario', type: 'success'});
      } else {
        await followUser(userId);
        setIsFollowingUser(true);
        setFollowersCount(prev => prev + 1);
        setToast({message: 'Ahora sigues a este usuario', type: 'success'});
      }
      
      // Recargar tokens actualizados
      try {
        const updatedTokens = await getUserTokens(userId);
        setTokenData(updatedTokens);
        console.log('🔄 Tokens actualizados:', updatedTokens);
      } catch (error) {
        console.log('Error recargando tokens:', error);
      }
      
      // Recargar datos del perfil principal si está disponible
      if ((window as any).reloadProfileData) {
        (window as any).reloadProfileData();
      }
    } catch (error: any) {
      console.error('Error al cambiar seguimiento:', error);
      setToast({message: 'Error de permisos. Verifica tu conexión.', type: 'error'});
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-ocultar toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="profile-container">
      {/* Back Button */}
      <div className="external-profile-header">
        <button className="back-btn" onClick={onNavigateBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      </div>

      {/* Centered Username Header */}
      <div className="profile-centered-header">
        <h2 className="centered-username">{userData.username}</h2>
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
          <span className="stat-number">{followersCount}</span>
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

      {/* Follow Button and Tokens */}
      <div className="centered-actions">
        <button 
          className={`action-btn ${isFollowingUser ? 'following-btn' : 'follow-btn'}`}
          onClick={handleFollowToggle}
          disabled={isLoading}
          onMouseEnter={(e) => {
            if (isFollowingUser && !isLoading) {
              e.currentTarget.textContent = 'Dejar de seguir';
            }
          }}
          onMouseLeave={(e) => {
            if (isFollowingUser && !isLoading) {
              e.currentTarget.textContent = 'Siguiendo';
            }
          }}
        >
          {isLoading ? 'Cargando...' : (isFollowingUser ? 'Siguiendo' : 'Seguir')}
        </button>
        <div className="action-btn tokens-btn-external" title={`Tokens: ${tokenData?.tokens || 0}`}>
          🪙 {tokenData?.tokens || 0}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="posts-grid">
        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <div 
              key={post.id} 
              className="post-thumbnail"
              onClick={() => onViewPost?.(post.id)}
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
            <p>No hay publicaciones</p>
          </div>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}

      {/* Toast de notificaciones */}
      {toast && (
        <div className={`toast toast-${toast.type}`} onClick={() => setToast(null)}>
          {toast.message}
        </div>
      )}
    </div>
  );
}