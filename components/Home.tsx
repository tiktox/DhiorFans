import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, UserData } from '../lib/userService';
import Profile from './Profile';
import Search from './Search';
import Publish from './Publish';
import ReelsFeed from './ReelsFeed';

export default function Home() {
  const [activeTab, setActiveTab] = useState('para-ti');
  const [currentView, setCurrentView] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [refreshFeed, setRefreshFeed] = useState(0);

  useEffect(() => {
    if (auth.currentUser) {
      setUserData(getUserData());
    }
  }, []);

  if (currentView === 'profile') {
    return <Profile 
      onNavigateHome={() => setCurrentView('home')}
      onNavigatePublish={() => setCurrentView('publish')}
      onNavigateSearch={() => setCurrentView('search')}
    />;
  }

  if (currentView === 'search') {
    return <Search onNavigateHome={() => setCurrentView('home')} />;
  }

  if (currentView === 'publish') {
    return <Publish 
      onNavigateHome={() => setCurrentView('home')} 
      onPublish={() => setRefreshFeed(prev => prev + 1)}
    />;
  }

  return (
    <div className="home-container">
      {/* Video Background */}
      <ReelsFeed activeTab={activeTab} key={refreshFeed} />
      
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
        <div className="nav-icon home-icon">
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
          ) : null}
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