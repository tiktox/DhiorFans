import { useState, useEffect } from 'react';
import { searchPostsByTitle, Post } from '../lib/postService';
import { getUserDataById, searchUsers, UserData } from '../lib/userService';

interface SearchProps {
  onNavigateHome: () => void;
  onViewPost?: (postId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export default function Search({ onNavigateHome, onViewPost, onViewProfile }: SearchProps) {
  const [activeFilter, setActiveFilter] = useState('usuarios');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [userResults, setUserResults] = useState<UserData[]>([]);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        if (activeFilter === 'publicaciones') {
          const results = await searchPostsByTitle(searchQuery);
          setSearchResults(results);
          setUserResults([]);
        } else {
          // La búsqueda de usuarios también debería ser async si usa Firestore
          const results = await searchUsers(searchQuery);
          setUserResults(results);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        setUserResults([]);
      }
    };
    performSearch();
  }, [searchQuery, activeFilter]);

  return (
    <div className="search-container">
      {/* Header with back button */}
      <div className="search-header">
        <button className="back-btn" onClick={onNavigateHome}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      </div>
      {/* Search Input */}
      <div className="search-input-container">
        <div className="search-input-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${activeFilter === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveFilter('usuarios')}
        >
          Usuarios
        </button>
        <span className="filter-separator">|</span>
        <button 
          className={`filter-tab ${activeFilter === 'publicaciones' ? 'active' : ''}`}
          onClick={() => setActiveFilter('publicaciones')}
        >
          Publicaciones
        </button>
      </div>

      {/* Results Section */}
      <div className="search-results">
        {activeFilter === 'usuarios' ? (
          <div className="users-results">
            {searchQuery.trim() === '' ? (
              <div className="no-search">
                <p>Busca usuarios por nombre o username</p>
              </div>
            ) : userResults.length === 0 ? (
              <div className="no-results">
                <p>No se encontraron usuarios</p>
              </div>
            ) : (
              userResults.map(user => {
                // Buscar el userId real del usuario
                let posts = [];
                try {
                  posts = JSON.parse(localStorage.getItem('dhirofans_posts') || '[]');
                } catch {
                  posts = [];
                }
                const userPost = posts.find((p: any) => p.username === user.username);
                const userId = userPost?.userId || user.username;
                
                return (
                  <div key={user.username} className="user-result" onClick={() => onViewProfile?.(userId)}>
                    <div className="user-avatar">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.fullName} />
                      ) : (
                        <div className="default-avatar">👤</div>
                      )}
                    </div>
                    <div className="user-info">
                      <h3 className="user-fullname">{user.fullName}</h3>
                      <p className="user-username">@{user.username}</p>
                      {user.bio && <p className="user-bio">{user.bio}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="posts-results">
            {searchQuery.trim() === '' ? (
              <div className="no-search">
                <p>Busca publicaciones por título</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="no-results">
                <p>No se encontraron publicaciones</p>
              </div>
            ) : (
              searchResults.map(post => {
                const userData = getUserDataById(post.userId);
                return (
                  <div key={post.id} className="post-result" onClick={() => onViewPost?.(post.id)}>
                    <div className="post-thumbnail">
                      {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} />
                      ) : (
                        <img src={post.mediaUrl} alt={post.title} />
                      )}
                    </div>
                    <div className="post-info">
                      <h3 className="post-result-title">{post.title}</h3>
                      <p className="post-result-description">{post.description}</p>
                      <div className="post-meta">
                        <span className="post-author">@{userData?.username || 'Usuario'}</span>
                        <span className="post-date">{new Date(post.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}