import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, UserData } from '../lib/userService';
import { getUserPosts, Post } from '../lib/postService';

import EditProfile from './EditProfile';
import Settings from './Settings';


interface ProfileProps {
  onNavigateHome?: () => void;
  onNavigatePublish?: () => void;
  onNavigateSearch?: () => void;
  onViewPost?: (postId: string) => void;
}

export default function Profile({ onNavigateHome, onNavigatePublish, onNavigateSearch, onViewPost }: ProfileProps = {}) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [currentView, setCurrentView] = useState('profile');
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  // Función para recargar datos del usuario
  const reloadUserData = async () => {
    if (auth.currentUser) {
      try {
        console.log('🔄 Cargando datos del perfil para usuario:', auth.currentUser.uid);
        const data = await getUserData();
        setUserData(data);
        console.log('👤 Datos del usuario cargados:', data);
        
        // Cargar posts del usuario
        console.log('📄 Cargando posts del usuario...');
        const posts = await getUserPosts(auth.currentUser.uid);
        console.log('📄 Posts encontrados:', posts.length, posts);
        setUserPosts(posts);
      } catch (error) {
        console.error('❌ Error al cargar datos del usuario:', error);
      }
    }
  };
  
  // Exponer la función de recarga para uso externo
  useEffect(() => {
    // Recargar posts cuando el componente se monta
    reloadUserData();
  }, []);

  // Recargar datos cuando el usuario regrese al perfil
  useEffect(() => {
    reloadUserData();
  }, []);

  if (!userData) {
    return <div className="profile-container">Cargando...</div>;
  }

  if (currentView === 'settings') {
    return <Settings onNavigateBack={() => setCurrentView('profile')} />;
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
      {/* Centered Username Header */}
      <div className="profile-centered-header">
        <h2 className="centered-username">{userData.username}</h2>
      </div>

      {/* Centered Profile Picture */}
      <div className="profile-pic-centered">
        {userData.profilePicture ? (
          <img src={userData.profilePicture} alt="Perfil" />
        ) : (
          <div className="default-avatar">👤</div>
        )}
      </div>

      {/* Centered Full Name */}
      <div className="centered-name">
        <h3>{userData.fullName}</h3>
      </div>

      {/* Centered Stats */}
      <div className="centered-stats">
        <div className="stat-item">
          <span className="stat-number">{userData.posts || 0}</span>
          <span className="stat-label">Publicaciones</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{userData.followers}</span>
          <span className="stat-label">Seguidores</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{userData.following}</span>
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
        <button className="action-btn tokens-btn">
          Tokens 1.3 M
        </button>
        <button className="action-btn settings-btn" onClick={() => setCurrentView('settings')}>
          ⚙️
        </button>
      </div>

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
        <div className="nav-icon search-icon" onClick={onNavigateSearch}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <div className="profile-pic-nav">
          {userData.profilePicture ? (
            <img src={userData.profilePicture} alt="Perfil" />
          ) : (
            <div className="default-nav-avatar">👤</div>
          )}
        </div>
        <div className="nav-icon message-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div className="nav-icon add-icon" onClick={onNavigatePublish}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
      </div>


    </div>
  );
}