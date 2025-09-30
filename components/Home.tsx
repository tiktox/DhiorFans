import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, getUserDataById, UserData } from '../lib/userService';
import Profile from './Profile';
import Search from './Search';
import Publish from './Publish';
import ReelsFeed from './ReelsFeed';
import ExternalProfile from './ExternalProfile';
import '../lib/testData'; // Importar funciones de prueba

export default function Home() {
  const [activeTab, setActiveTab] = useState('para-ti');
  const [currentView, setCurrentView] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [refreshFeed, setRefreshFeed] = useState(0);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [externalUserData, setExternalUserData] = useState<UserData | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      setUserData(getUserData());
    }
  }, []);
  
  // Recargar datos del usuario cuando se actualice el feed
  useEffect(() => {
    if (auth.currentUser) {
      setUserData(getUserData());
    }
  }, [refreshFeed]);

  if (currentView === 'profile') {
    return <Profile 
      key={refreshFeed} // Forzar re-render cuando se actualice refreshFeed
      onNavigateHome={() => {
        setSelectedPostId(null);
        setCurrentView('home');
      }}
      onNavigatePublish={() => setCurrentView('publish')}
      onNavigateSearch={() => setCurrentView('search')}
      onViewPost={(postId) => {
        setSelectedPostId(postId);
        setCurrentView('home');
      }}
    />;
  }

  if (currentView === 'search') {
    return <Search 
      onNavigateHome={() => setCurrentView('home')} 
      onViewPost={(postId) => {
        setSelectedPostId(postId);
        setCurrentView('home');
      }}
      onViewProfile={(userId) => {
        handleExternalProfile(userId);
      }}
    />;
  }

  if (currentView === 'publish') {
    return <Publish 
      onNavigateHome={() => {
        setSelectedPostId(null);
        setCurrentView('home');
      }} 
      onPublish={() => {
        setSelectedPostId(null);
        setRefreshFeed(prev => prev + 1);
      }}
    />;
  }

  if (currentView === 'external-profile' && externalUserId && externalUserData) {
    return <ExternalProfile 
      userId={externalUserId}
      userData={externalUserData}
      onNavigateBack={() => {
        setCurrentView('home');
        setExternalUserId(null);
        setExternalUserData(null);
      }}
    />;
  }

  const handleExternalProfile = (userId: string) => {
    // Si es el usuario actual, ir a su perfil
    if (auth.currentUser && userId === auth.currentUser.uid) {
      setCurrentView('profile');
      return;
    }
    
    // Si es otro usuario, ir al perfil externo
    const userData = getUserDataById(userId);
    if (userData) {
      setExternalUserId(userId);
      setExternalUserData(userData);
      setCurrentView('external-profile');
    }
  };

  return (
    <div className="home-container">
      {/* Video Background */}
      <ReelsFeed 
        activeTab={activeTab} 
        key={`${refreshFeed}-${selectedPostId}`} 
        onExternalProfile={handleExternalProfile}
        initialPostId={selectedPostId || undefined}
        onPostDeleted={() => setRefreshFeed(prev => prev + 1)}
      />
      
      {/* UI Elements on top */}
      <div className="home-ui-overlay">
        {/* Top Section with Tabs */}
        <div className="content-tabs">
          <button 
            className={`tab ${activeTab === 'para-ti' ? 'active' : ''}`}
            onClick={() => setActiveTab('para-ti')}
          >
            Para ti
          </button>
          <button 
            className={`tab ${activeTab === 'amigos' ? 'active' : ''}`}
            onClick={() => setActiveTab('amigos')}
          >
            Amigos
          </button>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="bottom-nav">
        <div className="nav-icon home-icon" onClick={() => {
          setSelectedPostId(null);
          setRefreshFeed(prev => prev + 1);
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        </div>
        <div className="nav-icon nav-search-btn" onClick={() => setCurrentView('search')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <div className="profile-pic-nav" onClick={() => setCurrentView('profile')}>
          {userData?.profilePicture ? (
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
        <div className="nav-icon add-icon" onClick={() => setCurrentView('publish')}>
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