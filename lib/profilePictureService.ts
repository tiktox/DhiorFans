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
      lastRealProfilePicture: imageUrl, // Guardar como última foto real
      avatar: imageUrl,
      isAvatar: false // Desactivar estado de avatar
    });

    // Disparar evento de cambio
    window.dispatchEvent(new CustomEvent('profileChanged', {
      detail: { imageUrl, isAvatar: false }
    }));

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
    
    // Si no hay lastRealProfilePicture y hay una foto actual que no es avatar, guardarla
    if (!userData.lastRealProfilePicture && userData.profilePicture && !userData.isAvatar) {
      await saveUserData({ lastRealProfilePicture: userData.profilePicture });
    }

    await saveUserData({
      profilePicture: avatarUrl,
      avatar: avatarUrl,
      isAvatar: true
    });

    // Disparar evento de cambio
    window.dispatchEvent(new CustomEvent('profileChanged', {
      detail: { imageUrl: avatarUrl, isAvatar: true }
    }));

    console.log('✅ Avatar establecido como perfil:', avatarUrl);
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

    // Disparar evento de cambio
    window.dispatchEvent(new CustomEvent('profileChanged', {
      detail: { imageUrl: userData.lastRealProfilePicture, isAvatar: false }
    }));

    console.log('✅ Foto de perfil real restaurada:', userData.lastRealProfilePicture);
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