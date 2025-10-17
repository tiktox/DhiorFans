import { saveUserData, getUserData } from './userService';
import { auth } from './firebase';

/**
 * Servicio para manejar fotos de perfil y avatares de forma correcta
 */

/**
 * Establece una nueva foto de perfil (NO avatar)
 * Guarda la foto como la última foto real del usuario
 */
export async function setProfilePicture(imageUrl: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    await saveUserData({
      profilePicture: imageUrl,
      lastRealProfilePicture: imageUrl, // Siempre guardar como última foto real
      avatar: imageUrl,
      isAvatar: false // Desactivar estado de avatar
    });

    // Disparar evento de cambio global
    dispatchGlobalProfileChange(imageUrl, false);

    console.log('✅ Foto de perfil establecida:', imageUrl);
  } catch (error) {
    console.error('❌ Error estableciendo foto de perfil:', error);
    throw error;
  }
}

/**
 * Establece un avatar como foto de perfil
 * Preserva la última foto real para restauración
 */
export async function setAvatarAsProfile(avatarUrl: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const userData = await getUserData();
    
    // CRÍTICO: Preservar la última foto real antes de cambiar a avatar
    if (!userData.lastRealProfilePicture && userData.profilePicture && !userData.isAvatar) {
      console.log('💾 Guardando foto real antes de avatar:', userData.profilePicture);
      await saveUserData({ lastRealProfilePicture: userData.profilePicture });
    }

    await saveUserData({
      profilePicture: avatarUrl,
      avatar: avatarUrl,
      isAvatar: true
    });

    // Disparar evento de cambio global
    dispatchGlobalProfileChange(avatarUrl, true);

    console.log('✅ Avatar establecido como perfil:', avatarUrl);
    console.log('📋 Foto real preservada:', userData.lastRealProfilePicture);
  } catch (error) {
    console.error('❌ Error estableciendo avatar:', error);
    throw error;
  }
}

/**
 * Restaura la última foto de perfil real (no avatar)
 */
export async function restoreRealProfilePicture(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const userData = await getUserData();
    
    if (!userData.lastRealProfilePicture) {
      throw new Error('No hay foto de perfil para restaurar');
    }

    await saveUserData({
      profilePicture: userData.lastRealProfilePicture,
      avatar: userData.lastRealProfilePicture,
      isAvatar: false
    });

    // Disparar evento de cambio global con transición
    dispatchGlobalProfileChange(userData.lastRealProfilePicture, false);
    
    // Forzar actualización de elementos con transición suave
    setTimeout(() => {
      if (userData.lastRealProfilePicture) {
        updateAllProfileElements(userData.lastRealProfilePicture, false);
      }
    }, 100);

    console.log('✅ Foto de perfil real restaurada con marco circular blanco:', userData.lastRealProfilePicture);
  } catch (error) {
    console.error('❌ Error restaurando foto real:', error);
    throw error;
  }
}

/**
 * Obtiene la URL de la última foto de perfil real
 */
export async function getLastRealProfilePicture(): Promise<string | null> {
  try {
    const userData = await getUserData();
    return userData.lastRealProfilePicture || null;
  } catch (error) {
    console.error('❌ Error obteniendo última foto real:', error);
    return null;
  }
}

/**
 * Verifica si el usuario tiene una foto de perfil real para restaurar
 */
export async function hasRealProfilePictureToRestore(): Promise<boolean> {
  try {
    const userData = await getUserData();
    return !!(userData.lastRealProfilePicture && userData.isAvatar);
  } catch (error) {
    console.error('❌ Error verificando foto para restaurar:', error);
    return false;
  }
}

/**
 * Dispara evento global de cambio de perfil para actualizar toda la UI
 */
function dispatchGlobalProfileChange(imageUrl: string, isAvatar: boolean): void {
  // Evento principal
  window.dispatchEvent(new CustomEvent('profileChanged', {
    detail: { imageUrl, isAvatar }
  }));
  
  // Eventos específicos para diferentes componentes
  window.dispatchEvent(new CustomEvent('profilePictureUpdated', {
    detail: { imageUrl, isAvatar }
  }));
  
  window.dispatchEvent(new CustomEvent('avatarStatusChanged', {
    detail: { imageUrl, isAvatar }
  }));
  
  // Forzar actualización de elementos específicos
  updateAllProfileElements(imageUrl, isAvatar);
}

/**
 * Actualiza todos los elementos de perfil en la página
 */
function updateAllProfileElements(imageUrl: string, isAvatar: boolean): void {
  // Actualizar imágenes de perfil en navegación
  const navProfilePics = document.querySelectorAll('.profile-pic-nav');
  navProfilePics.forEach(pic => {
    const img = pic.querySelector('img');
    if (img) {
      img.src = imageUrl;
    }
    
    // Aplicar formato según tipo de imagen
    if (isAvatar) {
      pic.setAttribute('data-is-avatar', 'true');
      pic.classList.add('avatar-format');
      pic.classList.remove('photo-format');
    } else {
      pic.removeAttribute('data-is-avatar');
      pic.classList.remove('avatar-format');
      pic.classList.add('photo-format');
    }
  });
  
  // Actualizar imagen principal del perfil
  const mainProfilePics = document.querySelectorAll('.profile-pic-main, .profile-pic-large');
  mainProfilePics.forEach(pic => {
    const img = pic.querySelector('img');
    if (img) {
      img.src = imageUrl;
    }
    
    if (isAvatar) {
      pic.classList.add('avatar-format');
      pic.classList.remove('photo-format');
    } else {
      pic.classList.remove('avatar-format');
      pic.classList.add('photo-format');
    }
  });
  
  // Actualizar avatares en búsqueda y comentarios
  const userAvatars = document.querySelectorAll('.user-avatar');
  userAvatars.forEach(avatar => {
    const img = avatar.querySelector('img');
    if (img && img.src.includes(auth.currentUser?.uid || '')) {
      img.src = imageUrl;
      
      if (isAvatar) {
        avatar.setAttribute('data-is-avatar', 'true');
        avatar.classList.add('avatar-format');
        avatar.classList.remove('photo-format');
      } else {
        avatar.removeAttribute('data-is-avatar');
        avatar.classList.remove('avatar-format');
        avatar.classList.add('photo-format');
      }
    }
  });
  
  // Actualizar elementos específicos del perfil
  const profileElements = document.querySelectorAll('.profile-pic-centered, .avatar-display');
  profileElements.forEach(element => {
    const img = element.querySelector('img');
    if (img) {
      img.src = imageUrl;
    }
    
    if (isAvatar) {
      element.classList.remove('profile-pic-centered');
      element.classList.add('avatar-display');
    } else {
      element.classList.remove('avatar-display');
      element.classList.add('profile-pic-centered');
    }
  });
}