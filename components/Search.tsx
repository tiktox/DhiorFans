import { useState } from 'react';

interface SearchProps {
  onNavigateHome: () => void;
}

export default function Search({ onNavigateHome }: SearchProps) {
  const [activeFilter, setActiveFilter] = useState('usuarios');
  const [searchQuery, setSearchQuery] = useState('');

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
            {/* Publicaciones results will be loaded here */}
          </div>
        )}
      </div>
    </div>
  );
}