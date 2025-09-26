import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, UserData } from '../lib/userService';
import { getUserPosts, Post } from '../lib/postService';
import EditProfileModal from './EditProfileModal';
import Settings from './Settings';

interface ProfileProps {
  onNavigateHome?: () => void;
  onNavigatePublish?: () => void;
  onNavigateSearch?: () => void;
}

export default function Profile({ onNavigateHome, onNavigatePublish, onNavigateSearch }: ProfileProps = {}) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('profile');

  useEffect(() => {
    if (auth.currentUser) {
      setUserData(getUserData());
      setUserPosts(getUserPosts(auth.currentUser.uid));
    }
  }, []);

  if (!userData) {
    return <div className="profile-container">Cargando...</div>;
  }

  if (currentView === 'settings') {
    return <Settings onNavigateBack={() => setCurrentView('profile')} />;
  }
  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <h2 className="username">{userData.username}</h2>
        <div className="menu-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>
      </div>

      {/* Profile Info */}
      <div className="profile-info">
        <div className="profile-pic-large">
          {userData.profilePicture ? (
            <img src={userData.profilePicture} alt="Perfil" />
          ) : null}
        </div>
        <div className="profile-details">
          <h3 className="full-name">{userData.fullName}</h3>
          <div className="stats">
            <div className="stat">
              <span className="stat-number">{userPosts.length}</span>
              <span className="stat-label">Publicaciones</span>
            </div>
            <div className="stat">
              <span className="stat-number">{userData.followers}</span>
              <span className="stat-label">Seguidores</span>
            </div>
            <div className="stat">
              <span className="stat-number">{userData.following}</span>
              <span className="stat-label">Seguidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio and additional info */}
      <div className="profile-extra-info">
        {userData.bio && (
          <div className="bio">
            <p>{userData.bio}</p>
          </div>
        )}
        {userData.link && (
          <div className="link">
            <a href={userData.link} target="_blank" rel="noopener noreferrer">
              {userData.link}
            </a>
          </div>
        )}
        {userData.gender && (
          <div className="gender">
            <span>{userData.gender}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="edit-profile-btn" onClick={() => setIsModalOpen(true)}>Editar perfil</button>
        <div className="posts-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>
        <button className="tokens-btn">Tokens 1.3 M</button>
        <button className="settings-btn" onClick={() => setCurrentView('settings')}>⚙️</button>
      </div>

      {/* User Posts Grid */}
      {userPosts.length > 0 && (
        <div className="user-posts-grid">
          {userPosts.map((post) => (
            <div key={post.id} className="post-thumbnail">
              {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} />
              ) : (
                <img src={post.mediaUrl} alt={post.title} />
              )}
            </div>
          ))}
        </div>
      )}

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
          ) : null}
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={userData}
        onSave={(updatedData) => setUserData(updatedData)}
      />
    </div>
  );
}