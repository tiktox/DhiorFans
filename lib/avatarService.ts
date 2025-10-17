import { saveUserData, getUserData } from './userService';
import { uploadProfilePicture } from './uploadService';
import { auth } from './firebase';

export interface AvatarData {
  url: string;
  timestamp: number;
  isActive: boolean;
}

/**
 * Establece un avatar como foto de perfil del usuario
 */
export async function setAvatarAsProfile(avatarUrl: string): Promise<boolean> {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    // Obtener datos actuales del usuario
    const userData = await getUserData();
    
    // Guardar la foto original si no existe
    if (!userData.originalProfilePicture && userData.profilePicture && userData.profilePicture !== avatarUrl) {
      await saveUserData({ originalProfilePicture: userData.profilePicture });
    }
    
    // Establecer el avatar como foto de perfil
    await saveUserData({
      profilePicture: avatarUrl,
      avatar: avatarUrl,
      isAvatar: true
    });
    
    // Recargar datos en todos los componentes
    await reloadAllComponents();
    
    return true;
  } catch (error) {
    console.error('Error estableciendo avatar como perfil:', error);
    return false;
  }
}

/**
 * Restaura la foto de perfil original del usuario
 */
export async function restoreOriginalProfile(): Promise<boolean> {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const userData = await getUserData();
    
    if (!userData.originalProfilePicture) {
      throw new Error('No hay foto original para restaurar');
    }
    
    await saveUserData({
      profilePicture: userData.originalProfilePicture,
      avatar: userData.originalProfilePicture,
      isAvatar: false
    });
    
    // Recargar datos en todos los componentes
    await reloadAllComponents();
    
    return true;
  } catch (error) {
    console.error('Error restaurando foto original:', error);
    return false;
  }
}

/**
 * Compra y procesa un nuevo avatar
 */
export async function purchaseAvatar(file: File): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    // Redimensionar imagen a 140x250
    const resizedDataURL = await resizeImageToAvatar(file);
    
    // Convertir a blob y crear archivo
    const response = await fetch(resizedDataURL);
    const blob = await response.blob();
    const avatarFile = new File([blob], `avatar_${Date.now()}.png`, { type: 'image/png' });
    
    // Subir a Firebase Storage
    const avatarUrl = await uploadProfilePicture(avatarFile, auth.currentUser.uid);
    
    // Agregar a avatares comprados
    const userData = await getUserData();
    const currentPurchased = userData.purchasedAvatars || [];
    const updatedPurchased = [...currentPurchased, avatarUrl];
    
    await saveUserData({
      purchasedAvatars: updatedPurchased
    });
    
    return avatarUrl;
  } catch (error) {
    console.error('Error comprando avatar:', error);
    throw error;
  }
}

/**
 * Redimensiona una imagen a las dimensiones de avatar (140x250)
 */
export function resizeImageToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Establecer dimensiones del canvas
      canvas.width = 140;
      canvas.height = 250;
      
      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, 140, 250);
      
      // Convertir a DataURL
      const resizedDataURL = canvas.toDataURL('image/png');
      resolve(resizedDataURL);
    };
    
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Recarga datos en todos los componentes que muestran el perfil del usuario
 */
async function reloadAllComponents(): Promise<void> {
  // Recargar datos del perfil si la función está disponible
  if ((window as any).reloadProfileData) {
    await (window as any).reloadProfileData();
  }
  
  // Recargar datos del usuario en Home
  if ((window as any).reloadUserData) {
    await (window as any).reloadUserData();
  }
  
  // Forzar re-render después de un pequeño delay
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('avatarChanged'));
  }, 100);
}

/**
 * Verifica si el usuario actual tiene un avatar activo
 */
export async function hasActiveAvatar(): Promise<boolean> {
  try {
    const userData = await getUserData();
    return userData.isAvatar === true;
  } catch (error) {
    console.error('Error verificando avatar activo:', error);
    return false;
  }
}

/**
 * Obtiene la URL del avatar actual del usuario
 */
export async function getCurrentAvatarUrl(): Promise<string | null> {
  try {
    const userData = await getUserData();
    return userData.isAvatar ? userData.profilePicture || null : null;
  } catch (error) {
    console.error('Error obteniendo URL del avatar:', error);
    return null;
  }
}