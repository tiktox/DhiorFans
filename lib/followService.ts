import { auth, db } from './firebase';
import { doc, updateDoc, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { updateFollowersCount, grantFollowerBonus } from './tokenService';

export interface FollowData {
  followerId: string;
  followingId: string;
  timestamp: number;
}

export const followUser = async (targetUserId: string): Promise<void> => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado');
  if (auth.currentUser.uid === targetUserId) throw new Error('No puedes seguirte a ti mismo');

  const followerId = auth.currentUser.uid;
  const followId = `${followerId}_${targetUserId}`;

  try {
    // Verificar si ya sigue al usuario
    const followRef = doc(db, 'follows', followId);
    const existingFollow = await getDoc(followRef);
    
    if (existingFollow.exists()) {
      console.log('Usuario ya sigue a este usuario, saltando...');
      return;
    }

    // Crear registro de seguimiento
    await setDoc(followRef, {
      followerId,
      followingId: targetUserId,
      timestamp: Date.now()
    });

    // Incrementar contador de seguidos del usuario actual
    const followerRef = doc(db, 'users', followerId);
    await updateDoc(followerRef, {
      following: increment(1)
    });

    // Incrementar contador de seguidores del usuario objetivo
    const followingRef = doc(db, 'users', targetUserId);
    await updateDoc(followingRef, {
      followers: increment(1)
    });
    
    // Obtener el nuevo contador después de la actualización
    const updatedUserDoc = await getDoc(followingRef);
    const newFollowersCount = updatedUserDoc.data()?.followers || 0;
    
    // Actualizar contador de seguidores en tokens y otorgar bonus si es el primer seguidor
    await updateFollowersCount(targetUserId, newFollowersCount);
    
    // Otorgar bonus de tokens si es el primer seguidor
    const bonus = await grantFollowerBonus(targetUserId, newFollowersCount);
    if (bonus) {
      console.log(`🎉 Usuario ${targetUserId} recibió ${bonus.tokensGranted} tokens por su primer seguidor!`);
    }

    console.log(`✅ Usuario ${followerId} ahora sigue a ${targetUserId}`);

  } catch (error) {
    console.error('Error siguiendo usuario:', error);
    throw error;
  }
};

export const unfollowUser = async (targetUserId: string): Promise<void> => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado');

  const followerId = auth.currentUser.uid;
  const followId = `${followerId}_${targetUserId}`;

  try {
    // Verificar si realmente sigue al usuario
    const followRef = doc(db, 'follows', followId);
    const existingFollow = await getDoc(followRef);
    
    if (!existingFollow.exists()) {
      console.log('Usuario no sigue a este usuario, saltando...');
      return;
    }

    // Eliminar registro de seguimiento
    await deleteDoc(followRef);

    // Decrementar contador de seguidos del usuario actual
    const followerRef = doc(db, 'users', followerId);
    await updateDoc(followerRef, {
      following: increment(-1)
    });

    // Decrementar contador de seguidores del usuario objetivo
    const followingRef = doc(db, 'users', targetUserId);
    await updateDoc(followingRef, {
      followers: increment(-1)
    });
    
    // Obtener el nuevo contador después de la actualización
    const updatedUserDoc = await getDoc(followingRef);
    const newFollowersCount = Math.max(0, updatedUserDoc.data()?.followers || 0);
    
    // Actualizar contador de seguidores en tokens
    await updateFollowersCount(targetUserId, newFollowersCount);

    console.log(`✅ Usuario ${followerId} dejó de seguir a ${targetUserId}`);

  } catch (error) {
    console.error('Error dejando de seguir usuario:', error);
    throw error;
  }
};

export const isFollowing = async (targetUserId: string): Promise<boolean> => {
  if (!auth.currentUser) return false;

  const followerId = auth.currentUser.uid;
  const followId = `${followerId}_${targetUserId}`;

  try {
    const followRef = doc(db, 'follows', followId);
    const followDoc = await getDoc(followRef);
    return followDoc.exists();
  } catch (error) {
    console.error('Error verificando seguimiento:', error);
    return false;
  }
};