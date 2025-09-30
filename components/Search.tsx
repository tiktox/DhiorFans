import { useState, useEffect } from 'react';
import { searchPostsByTitle, Post } from '../lib/postService';
import { getUserDataById } from '../lib/userService';

interface SearchProps {
  onNavigateHome: () => void;
  onViewPost?: (postId: string) => void;
}

export default function Search({ onNavigateHome, onViewPost }: SearchProps) {
  const [activeFilter, setActiveFilter] = useState('usuarios');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);

  useEffect(() => {
    if (activeFilter === 'publicaciones' && searchQuery.trim()) {
      const results = searchPostsByTitle(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
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
            {/* Usuarios results will be loaded here */}
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