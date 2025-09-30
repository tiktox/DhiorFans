import { useState, useEffect } from 'react';
import { getUserPosts, Post } from '../lib/postService';
import { UserData } from '../lib/userService';
import PostModal from './PostModal';

interface ExternalProfileProps {
  userId: string;
  userData: UserData;
  onNavigateBack: () => void;
}

export default function ExternalProfile({ userId, userData, onNavigateBack }: ExternalProfileProps) {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setUserPosts(await getUserPosts(userId));
    };
    loadPosts();
  }, [userId]);

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
          <span className="stat-number">{userPosts.length}</span>
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

      {/* Follow Button */}
      <div className="centered-actions">
        <button className="action-btn follow-btn">
          Seguir
        </button>
      </div>

      {/* User Posts Grid */}
      {userPosts.length > 0 && (
        <div className="user-posts-grid">
          {userPosts.map((post) => (
            <div key={post.id} className="post-thumbnail" onClick={() => setSelectedPost(post)}>
              {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} />
              ) : (
                <img src={post.mediaUrl} alt={post.title} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </div>
  );
}