import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, getUserDataById, UserData } from '../lib/userService';
import { useProfileSync } from '../hooks/useProfileSync';
import { claimDailyTokens, canClaimTokens, getUserTokens, ensureUserTokensExist, checkTokenSystemHealth, getCacheStats, clearTokenCache } from '../lib/tokenService';
import { notifyTokens } from '../lib/notificationService';
import { getUnreadNotificationsCount } from '../lib/notificationService';
import Profile from './Profile';
import Search from './Search';
import Publish from './Publish';
import Notifications from './Notifications';
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

  const [unreadCount, setUnreadCount] = useState(0);
  
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
          
          // Cargar contador de notificaciones
          const count = await getUnreadNotificationsCount(auth.currentUser.uid);
          setUnreadCount(count);
          
          // 🚀 SISTEMA ROBUSTO DE TOKENS - VERSIÓN AVANZADA
          try {
            console.log('🔄 Iniciando sistema robusto de tokens para usuario:', auth.currentUser.uid);
            
            // ✅ PASO 1: Verificación de salud del sistema
            const { checkTokenSystemHealth } = await import('../lib/tokenService');
            const healthCheck = await checkTokenSystemHealth(auth.currentUser.uid);
            
            if (!healthCheck.healthy) {
              console.warn('⚠️ Problemas detectados en sistema de tokens:', healthCheck.issues);
              console.log('🔧 Recomendaciones:', healthCheck.recommendations);
            }
            
            // ✅ PASO 2: Obtener tokens con sistema robusto (incluye cache y retry)
            const tokenData = await getUserTokens(auth.currentUser.uid);
            console.log('🔍 Estado actual de tokens (con validación):', {
              tokens: tokenData.tokens,
              lastClaim: tokenData.lastClaim,
              followersCount: tokenData.followersCount,
              canClaim: canClaimTokens(tokenData.lastClaim),
              healthy: healthCheck.healthy
            });
            
            // ✅ PASO 3: Reclamo automático con transacciones atómicas
            if (canClaimTokens(tokenData.lastClaim)) {
              console.log('🎯 Ejecutando reclamo diario con sistema robusto...');
              const result = await claimDailyTokens(auth.currentUser.uid, data.followers || 0);
              
              if (result.success && result.tokensEarned > 0) {
                console.log(`✅ ÉXITO ROBUSTO: Tokens diarios reclamados: +${result.tokensEarned} (Total: ${result.totalTokens})`);
                
                // ✅ PASO 4: Notificación con manejo de errores
                try {
                  await notifyTokens(auth.currentUser.uid, result.tokensEarned);
                  setUnreadCount(prev => prev + 1);
                  console.log(`🔔 Notificación de tokens creada: ${result.tokensEarned} tokens`);
                  
                  // Mostrar notificación visual al usuario
                  if ((window as any).showToast) {
                    (window as any).showToast(`🪙 +${result.tokensEarned} tokens diarios recibidos!`, 'success');
                  }
                } catch (notifError) {
                  console.error('⚠️ Error creando notificación (no crítico):', notifError);
                }
              } else if (!result.success) {
                console.log('⏰ Tokens ya reclamados hoy o condición no cumplida');
              }
            } else {
              const nextClaimTime = new Date(tokenData.lastClaim + (24 * 60 * 60 * 1000));
              console.log('⏰ Tokens ya reclamados. Próximo reclamo:', nextClaimTime.toLocaleString());
            }
            
            // ✅ PASO 5: Verificación final y limpieza
            const finalTokenData = await getUserTokens(auth.currentUser.uid);
            console.log('📊 Estado final verificado:', finalTokenData);
            
            // ✅ PASO 6: Monitoreo proactivo
            const { getCacheStats } = await import('../lib/tokenService');
            const cacheStats = getCacheStats();
            console.log('💾 Estadísticas de cache:', cacheStats);
            
          } catch (tokenError) {
            console.error('❌ ERROR EN SISTEMA ROBUSTO DE TOKENS:', tokenError);
            
            // 🆘 SISTEMA DE RECUPERACIÓN MULTI-NIVEL
            try {
              console.log('🆘 Iniciando recuperación multi-nivel...');
              
              // Nivel 1: Recuperación básica
              await ensureUserTokensExist(auth.currentUser.uid, data.followers || 0);
              console.log('✅ Nivel 1: Recuperación básica completada');
              
              // Nivel 2: Verificación de integridad
              const recoveredData = await getUserTokens(auth.currentUser.uid);
              if (recoveredData.tokens >= 0) {
                console.log('✅ Nivel 2: Integridad verificada');
              } else {
                throw new Error('Datos aún corruptos después de recuperación');
              }
              
              // Nivel 3: Notificar recuperación exitosa
              if ((window as any).showToast) {
                (window as any).showToast('🔧 Sistema de tokens recuperado exitosamente', 'info');
              }
              
            } catch (emergencyError) {
              console.error('❌ FALLO CRÍTICO EN RECUPERACIÓN MULTI-NIVEL:', emergencyError);
              
              // 🚨 ÚLTIMO RECURSO: Crear documento mínimo
              try {
                const { clearTokenCache } = await import('../lib/tokenService');
                clearTokenCache(auth.currentUser.uid);
                console.log('🧹 Cache limpiado como último recurso');
                
                if ((window as any).showToast) {
                  (window as any).showToast('⚠️ Sistema de tokens en modo de emergencia', 'warning');
                }
              } catch (lastResortError) {
                console.error('💥 FALLO TOTAL DEL SISTEMA DE TOKENS:', lastResortError);
              }
            }
          }
        } catch (error) {
          console.error('❌ ERROR CRÍTICO cargando datos iniciales del usuario:', error);
          setIsLoadingUser(false);
          
          // ✅ INTENTAR RECUPERACIÓN BÁSICA
          if (auth.currentUser) {
            try {
              console.log('🆘 Intentando recuperación básica de usuario...');
              await ensureUserTokensExist(auth.currentUser.uid, 0);
            } catch (recoveryError) {
              console.error('❌ Error en recuperación básica:', recoveryError);
            }
          }
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
      key={`profile-${refreshFeed}`}
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

  if (currentView === 'notifications') {
    return <Notifications 
      onNavigateBack={() => {
        setSelectedPostId(null);
        setCurrentView('home');
      }}
      onViewProfile={(userId) => {
        handleExternalProfile(userId);
      }}
      onViewPost={(postId) => {
        setSelectedPostId(postId);
        setCurrentView('home');
      }}
    />;
  }

  if (currentView === 'editor' && editorMediaFile) {
    return <BasicEditor 
      mediaFile={editorMediaFile}
      isTextMode={editorMediaFile.file.name === 'text_background.jpg'}
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
        key="reels-feed"
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
        <div className="nav-icon notifications-icon" onClick={() => setCurrentView('notifications')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
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
