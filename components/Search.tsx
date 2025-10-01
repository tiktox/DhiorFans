import { useState, useEffect } from 'react';
import { searchPostsByTitle, Post } from '../lib/postService';
import { getUserDataById, searchUsers, UserData, UserWithId } from '../lib/userService';

interface SearchProps {
  onNavigateHome: () => void;
  onViewPost?: (postId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const PostResultItem = ({ post, onViewPost }: { post: Post, onViewPost?: (postId: string) => void }) => {
  const [postUserData, setPostUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const loadAuthorData = async () => {
      if (post.userId) {
        const data = await getUserDataById(post.userId);
        setPostUserData(data);
      }
    };
    loadAuthorData();
  }, [post.userId]);

  return (
    <div className="post-result" onClick={() => onViewPost?.(post.id)}>
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
          <span className="post-author">@{postUserData?.username || '...'}</span>
          <span className="post-likes">❤️ {post.likesCount || 0}</span>
          <span className="post-date">{new Date(post.timestamp).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default function Search({ onNavigateHome, onViewPost, onViewProfile }: SearchProps) {
  const [activeFilter, setActiveFilter] = useState('usuarios');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [userResults, setUserResults] = useState<UserWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        setIsLoading(true);
        try {
          if (activeFilter === 'publicaciones') {
            const results = await searchPostsByTitle(searchQuery);
            setSearchResults(results);
            setUserResults([]);
          } else {
            const results = await searchUsers(searchQuery);
            setUserResults(results);
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Error en búsqueda:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setUserResults([]);
        setIsLoading(false);
      }
    };
    
    // Debounce para evitar muchas consultas
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
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

      {/* Loading indicator */}
      {isLoading && (
        <div className="search-loading">
          <p>Buscando...</p>
        </div>
      )}
      
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
              userResults.map(user => (
                <div key={user.id} className="user-result" onClick={() => onViewProfile?.(user.id)}>
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
              ))
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
              searchResults.map(post => <PostResultItem key={post.id} post={post} onViewPost={onViewPost} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}