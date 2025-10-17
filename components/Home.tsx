import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, getUserDataById, UserData } from '../lib/userService';
import { useProfileSync } from '../hooks/useProfileSync';
import Profile from './Profile';
import Search from './Search';
import Publish from './Publish';

import CreatePost from './CreatePost';
import CreateDynamicFlow from './CreateDynamicFlow';
import BasicEditor from './BasicEditor';
import Chat from './Chat';
import ReelsFeed from './ReelsFeed';
import ExternalProfile from './ExternalProfile';
import '../lib/testData'; // Importar funciones de prueba

export default function Home() {
  const [activeTab, setActiveTab] = useState('para-ti');
  const [currentView, setCurrentView] = useState('home');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [refreshFeed, setRefreshFeed] = useState(0);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [externalUserData, setExternalUserData] = useState<UserData | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editorMediaFile, setEditorMediaFile] = useState<{url: string; file: File; type: 'image' | 'video'} | null>(null);
  
  // Usar hook de sincronización de perfil
  const profileSync = useProfileSync();



  useEffect(() => {
    const loadData = async () => {
      if (auth.currentUser) {
        try {
          const data = await getUserData();
          setUserData(data);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };
    loadData();
  }, [refreshFeed]);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const loadUserData = async () => {
      if (auth.currentUser) {
        try {
          const data = await getUserData();
          console.log('🔍 Datos del usuario cargados en Home:', data);
          console.log('🎭 isAvatar:', data?.isAvatar);
          setUserData(data);
          setIsLoadingUser(false);
        } catch (error) {
          console.error('Error loading initial user data:', error);
          setIsLoadingUser(false);
        }
      }
    };
    loadUserData();
    
    // Escuchar cambios de avatar y perfil
    const handleAvatarChange = () => {
      loadUserData();
    };
    
    const handleProfileChange = () => {
      loadUserData();
    };
    
    window.addEventListener('avatarChanged', handleAvatarChange);
    window.addEventListener('profileChanged', handleProfileChange);
    
    return () => {
      window.removeEventListener('avatarChanged', handleAvatarChange);
      window.removeEventListener('profileChanged', handleProfileChange);
    };
  }, []);

  // Función global para recargar datos del usuario
  useEffect(() => {
    (window as any).reloadUserData = async () => {
      if (auth.currentUser) {
        try {
          const data = await getUserData();
          setUserData(data);
        } catch (error) {
          console.error('Error reloading user data:', error);
        }
      }
    };
    
    return () => {
      delete (window as any).reloadUserData;
    };
  }, []);

  if (currentView === 'profile') {
    return <Profile 
      key={`profile-${refreshFeed}`} // Forzar re-render cuando se actualice refreshFeed
      onNavigateHome={() => {
        setSelectedPostId(null);
        setCurrentView('home');
      }}
      onNavigatePublish={() => setCurrentView('publish')}
      onNavigateSearch={() => setCurrentView('search')}
      onNavigateChat={() => setCurrentView('chat')}
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
      onNavigateToCreatePost={() => setCurrentView('create-post')}
      onNavigateToCreateDynamic={() => setCurrentView('create-dynamic')}
      onNavigateToEditor={(mediaFile) => {
        setEditorMediaFile(mediaFile);
        setCurrentView('editor');
      }}
    />;
  }

  if (currentView === 'create-post') {
    return <CreatePost 
      onNavigateBack={() => {
        setSelectedPostId(null);
        setCurrentView('home');
      }} 
      onPublish={() => {
        setSelectedPostId(null);
        setRefreshFeed(prev => prev + 1);
      }}
      onSwitchToDynamic={() => setCurrentView('create-dynamic')}
    />;
  }

  if (currentView === 'create-dynamic') {
    return <CreateDynamicFlow 
      onNavigateBack={() => {
        setSelectedPostId(null);
        setCurrentView('home');
      }} 
      onPublish={() => {
        setSelectedPostId(null);
        setRefreshFeed(prev => prev + 1);
      }}
      onSwitchToPost={() => setCurrentView('create-post')}
    />;
  }

  if (currentView === 'chat') {
    return <Chat 
      onNavigateHome={() => {
        setSelectedPostId(null);
        setCurrentView('home');
      }}
    />;
  }

  if (currentView === 'editor' && editorMediaFile) {
    return <BasicEditor 
      mediaFile={editorMediaFile}
      onNavigateBack={() => {
        setEditorMediaFile(null);
        setCurrentView('publish');
      }}
      onPublish={() => {
        setEditorMediaFile(null);
        setRefreshFeed(prev => prev + 1);
        setCurrentView('home');
      }}
    />;
  }

  const handleExternalProfile = async (userId: string) => {
    // Si es el usuario actual, ir a su perfil
    if (auth.currentUser && userId === auth.currentUser.uid) {
      setCurrentView('profile');
      return;
    }

    // Si es otro usuario, ir al perfil externo
    try {
      // getUserDataById debe ser async si usa Firestore
      const userData = await getUserDataById(userId);
      if (userData) {
        setExternalUserId(userId);
        setExternalUserData(userData);
        setCurrentView('external-profile');
      }
    } catch (error) {
      console.error('Error loading external profile:', error);
    }
  };

  if (currentView === 'external-profile' && externalUserId && externalUserData) {
    return <ExternalProfile 
      userId={externalUserId}
      userData={externalUserData}
      onNavigateBack={() => {
        setCurrentView('home');
        setExternalUserId(null);
        setExternalUserData(null);
      }}
      onViewPost={(postId) => {
        setSelectedPostId(postId);
        setCurrentView('home');
      }}
    />;
  }

  return (
    <div className="home-container">
      {/* Video Background */}
      <ReelsFeed 
        activeTab={activeTab} 
        key={`${refreshFeed}-${selectedPostId}-${activeTab}`} 
        onExternalProfile={handleExternalProfile}
        initialPostId={selectedPostId || undefined}
        onPostDeleted={() => setRefreshFeed(prev => prev + 1)}
      />
      
      {/* UI Elements on top */}
      <div className="home-ui-overlay">


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
        <div className="nav-icon add-icon" onClick={() => setCurrentView('publish')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <div className="nav-icon message-icon" onClick={() => setCurrentView('chat')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div 
          className={`profile-pic-nav ${profileSync.isAvatar ? 'avatar-format' : ''}`}
          data-is-avatar={profileSync.isAvatar ? 'true' : 'false'}
          onClick={() => setCurrentView('profile')}
        >
          {profileSync.profilePicture ? (
            <img src={profileSync.profilePicture} alt="Perfil" />
          ) : (
            <div className="default-nav-avatar">👤</div>
          )}
        </div>
      </div>



    </div>
  );
}    
