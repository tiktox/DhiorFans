import { auth, db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { uploadFile } from './uploadService';
import { createPost } from './postService';
import { spendTokens, getUserTokens, addTokens } from './tokenService';

export interface Dynamic {
  id: string;
  userId: string;
  title: string;
  description: string;
  keywords: string[];
  mediaUrl: string;
  mediaType: 'image' | 'video';
  tokensReward: number;
  timestamp: number;
  isActive: boolean;
}

export const createDynamic = async (
  title: string,
  description: string,
  keywords: string[],
  tokensReward: number,
  file: File
): Promise<any> => {
  if (!auth.currentUser) throw new Error('Usuario no autenticado');
  if (!title.trim() && !description.trim()) throw new Error('El título o descripción es requerido');
  if (keywords.length === 0) throw new Error('Las palabras clave son requeridas');
  if (!file) throw new Error('El archivo es requerido');
  if (tokensReward <= 0) throw new Error('Los tokens deben ser mayor a 0');

  // Verificar que el usuario tenga suficientes tokens
  const userTokens = await getUserTokens(auth.currentUser.uid);
  if (userTokens.tokens < tokensReward) {
    throw new Error(`No tienes suficientes tokens. Tienes ${userTokens.tokens}, necesitas ${tokensReward}`);
  }

  // Descontar tokens del usuario
  const spendResult = await spendTokens(auth.currentUser.uid, tokensReward);
  if (!spendResult.success) {
    throw new Error('Error al descontar tokens');
  }

  try {
    const mediaType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
    const mediaUrl = await uploadFile(file, auth.currentUser.uid);

    // Crear como post normal pero con metadatos de dinámica
    const postData = {
      userId: auth.currentUser.uid,
      title: title.trim() || description.trim(),
      description: description.trim() || title.trim(),
      mediaUrl,
      mediaType,
      // Metadatos de dinámica
      isDynamic: true,
      keywords,
      tokensReward,
      isActive: true
    };

    const post = await createPost(postData);
    
    console.log(`✅ Dinámica creada. Tokens descontados: ${tokensReward}. Tokens restantes: ${spendResult.remainingTokens}`);
    
    return post;
  } catch (error) {
    // Si falla la creación del post, devolver los tokens
    try {
      await addTokens(auth.currentUser.uid, tokensReward);
      console.log(`⚠️ Error en creación de dinámica. Tokens revertidos: ${tokensReward}`);
    } catch (revertError) {
      console.error('Error revirtiendo tokens:', revertError);
    }
    throw error;
  }
};