import { useEffect, useState } from 'react';
import { getUserData } from '../lib/userService';

interface ProfileData {
  profilePicture: string;
  isAvatar: boolean;
}

/**
 * Hook para sincronizar cambios de perfil globalmente
 */
export function useProfileSync() {
  const [profileData, setProfileData] = useState<ProfileData>({
    profilePicture: '',
    isAvatar: false
  });

  useEffect(() => {
    // Cargar datos iniciales
    const loadInitialData = async () => {
      try {
        const userData = await getUserData();
        setProfileData({
          profilePicture: userData.profilePicture || '',
          isAvatar: userData.isAvatar || false
        });
      } catch (error) {
        console.error('Error cargando datos iniciales de perfil:', error);
      }
    };

    loadInitialData();

    // Escuchar eventos de cambio de perfil
    const handleProfileChange = (event: CustomEvent) => {
      const { imageUrl, isAvatar } = event.detail;
      setProfileData({
        profilePicture: imageUrl,
        isAvatar: isAvatar
      });
    };

    // Registrar listeners
    window.addEventListener('profileChanged', handleProfileChange as EventListener);
    window.addEventListener('profilePictureUpdated', handleProfileChange as EventListener);
    window.addEventListener('avatarStatusChanged', handleProfileChange as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('profileChanged', handleProfileChange as EventListener);
      window.removeEventListener('profilePictureUpdated', handleProfileChange as EventListener);
      window.removeEventListener('avatarStatusChanged', handleProfileChange as EventListener);
    };
  }, []);

  return profileData;
}

/**
 * Hook para forzar recarga de datos de perfil
 */
export function useProfileReload() {
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const reloadProfile = () => {
    setReloadTrigger(prev => prev + 1);
  };

  // Exponer función globalmente para otros componentes
  useEffect(() => {
    (window as any).reloadProfileData = reloadProfile;
    (window as any).reloadUserData = reloadProfile;

    return () => {
      delete (window as any).reloadProfileData;
      delete (window as any).reloadUserData;
    };
  }, []);

  return { reloadTrigger, reloadProfile };
}