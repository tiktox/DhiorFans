import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, getUserDataById, UserData } from '../lib/userService';
import { useProfileSync } from '../hooks/useProfileSync';
import { claimDailyTokens, canClaimTokens, getUserTokens } from '../lib/tokenService';
import Profile from './Profile';
import Search from './Search';
import Publish from './Publish';

import CreatePost from './CreatePost';
import CreateDynamicFlow from './CreateDynamicFlow';
import BasicEditor from './BasicEditor';
import AudioEditor from './AudioEditor';
import AudioGallery from './AudioGallery';
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
  const [editorMediaFile, setEditorMediaFile] = useState<{url: string; file: File; type: 'image' | 'video'; audioFile?: File; audioUrl?: string} | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showAudioGallery, setShowAudioGallery] = useState(false);
  
  // Usar hook de sincronización de perfil
  const profileSync = useProfileSync();

  const handleExternalProfile = async (userId: string) => {
    try {
      // Si es el propio usuario, ir al perfil normal
      if (auth.currentUser && userId === auth.currentUser.uid) {
        setCurrentView('profile');
        return;
      }
      
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
          
          // Intentar reclamar tokens diarios automáticamente
          try {
            const tokenData = await getUserTokens(auth.currentUser.uid);
            if (canClaimTokens(tokenData.lastClaim)) {
              const result = await claimDailyTokens(auth.currentUser.uid, data.followers || 0);
              if (result.success) {
                console.log(`🪙 Tokens diarios reclamados: +${result.tokensEarned} (Total: ${result.totalTokens})`);
              }
            }
          } catch (tokenError) {
            console.error('Error reclamando tokens diarios:', tokenError);
          }
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
      onOpenAudioEditor={(file) => {
        setAudioFile(file);
        setCurrentView('audio-editor');
      }}
      onOpenAudioGallery={() => {
        setShowAudioGallery(true);
        setCurrentView('audio-gallery');
      }}
    />;
  }

  if (currentView === 'audio-editor' && audioFile) {
    return <AudioEditor 
      audioFile={audioFile}
      onNavigateBack={() => {
        setAudioFile(null);
        setCurrentView('editor');
      }}
      onUseAudio={(audioBlob, name, audioUrl) => {
        console.log('Audio para usar:', name, audioBlob);
        // Crear archivo temporal para el editor
        const audioFile = new File([audioBlob], `${name}.wav`, { type: 'audio/wav' });
        // Pasar el audio al editor básico
        if (editorMediaFile) {
          setEditorMediaFile({
            ...editorMediaFile,
            audioFile,
            audioUrl
          });
        }
        setAudioFile(null);
        setCurrentView('editor');
      }}
      onPublishAudio={(audioBlob, name) => {
        console.log('Audio publicado:', name, audioBlob);
        setAudioFile(null);
        setCurrentView('editor');
      }}
    />;
  }

  if (currentView === 'audio-gallery') {
    return <AudioGallery 
      onNavigateBack={() => {
        setShowAudioGallery(false);
        setCurrentView('editor');
      }}
      onUseAudio={(audioUrl, audioName, audioBlob) => {
        console.log('Audio seleccionado de galería:', audioName, audioUrl);
        // Crear archivo de audio para el editor
        if (audioBlob && editorMediaFile) {
          const audioFile = new File([audioBlob], audioName, { type: 'audio/wav' });
          setEditorMediaFile({
            ...editorMediaFile,
            audioFile,
            audioUrl
          });
        }
        setShowAudioGallery(false);
        setCurrentView('editor');
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
