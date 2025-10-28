import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';

interface DynamicResult {
  isWinner: boolean;
  tokensWon: number;
  keyword?: string;
  postTitle?: string;
  error?: string;
}

export const checkDynamicComment = async (
  postId: string, 
  comment: string, 
  userId: string, 
  onStateChange?: (postId: string, isActive: boolean) => void
): Promise<DynamicResult> => {
  try {
    // Validar parámetros de entrada
    if (!postId?.trim() || !comment?.trim() || !userId?.trim()) {
      return { isWinner: false, tokensWon: 0, error: 'Parámetros inválidos' };
    }

    // Obtener datos del post
    const postDoc = await getDoc(doc(db, 'posts', postId));
    if (!postDoc.exists()) {
      return { isWinner: false, tokensWon: 0, error: 'Post no encontrado' };
    }
    
    const postData = postDoc.data();
    if (!postData.isDynamic) {
      return { isWinner: false, tokensWon: 0, error: 'Post no es una dinámica' };
    }
    if (!Array.isArray(postData.keywords)) {
      return { isWinner: false, tokensWon: 0, error: 'Keywords no configuradas' };
    }
    if (!postData.isActive) {
      return { isWinner: false, tokensWon: 0, error: 'Dinámica no está activa' };
    }

    // Prevenir que el creador comente su propia dinámica
    if (postData.userId === userId) {
      return { isWinner: false, tokensWon: 0, error: 'No puedes participar en tu propia dinámica' };
    }

    // Validar tokens reward
    const tokensWon = Number(postData.tokensReward) || 0;
    if (tokensWon <= 0 || tokensWon > 10000) {
      return { isWinner: false, tokensWon: 0, error: 'Recompensa de tokens inválida' };
    }

    // Verificar si el comentario contiene alguna palabra clave
    const sanitizedComment = comment.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    const commentLower = sanitizedComment.toLowerCase().trim();
    const matchedKeyword = postData.keywords.find((keyword: string) => 
      typeof keyword === 'string' && commentLower.includes(keyword.toLowerCase())
    );

    if (matchedKeyword) {
      console.log('✅ Palabra clave encontrada:', matchedKeyword);
      console.log('🪙 Tokens a otorgar:', tokensWon);
      
      // Usar transacción para operaciones atómicas
      try {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'tokens', userId);
          const postRef = doc(db, 'posts', postId);
          
          // Verificar que el post sigue activo
          const currentPost = await transaction.get(postRef);
          if (!currentPost.exists() || !currentPost.data().isActive) {
            throw new Error('La dinámica ya finalizó');
          }
          
          // Verificar/crear documento de tokens del usuario
          const userTokenDoc = await transaction.get(userRef);
          if (!userTokenDoc.exists()) {
            console.log('🆕 Creando nuevo documento de tokens para usuario:', userId);
            transaction.set(userRef, {
              tokens: tokensWon,
              lastClaim: 0,
              followersCount: 0
            });
          } else {
            const currentTokens = userTokenDoc.data().tokens || 0;
            console.log('💰 Tokens actuales:', currentTokens, '+ Nuevos:', tokensWon);
            transaction.update(userRef, {
              tokens: increment(tokensWon)
            });
          }

          // Desactivar la dinámica
          transaction.update(postRef, {
            isActive: false,
            winnerId: userId,
            winnerKeyword: matchedKeyword,
            winnerTimestamp: Date.now()
          });
          
          console.log('✅ Transacción completada exitosamente');
        });

        // Notificar cambio de estado
        onStateChange?.(postId, false);
        
        console.log('✅ Usuario ganó la dinámica');
        return { 
          isWinner: true, 
          tokensWon, 
          keyword: matchedKeyword,
          postTitle: postData.title || postData.description
        };
      } catch (transactionError) {
        console.error('❌ Error en transacción:', transactionError);
        throw transactionError;
      }
    }

    return { isWinner: false, tokensWon: 0 };
  } catch (error) {
    console.error('Error en checkDynamicComment:', error instanceof Error ? error.message : 'Error desconocido');
    
    // Manejar errores específicos de transacción
    if (error instanceof Error) {
      if (error.message.includes('La dinámica ya finalizó')) {
        return { isWinner: false, tokensWon: 0, error: 'La dinámica ya finalizó' };
      }
      if (error.message.includes('permission-denied')) {
        return { isWinner: false, tokensWon: 0, error: 'Sin permisos para actualizar tokens' };
      }
    }
    
    return { isWinner: false, tokensWon: 0, error: 'Error interno del servidor' };
  }
};

export const getUserCommentCount = async (postId: string, userId: string): Promise<number> => {
  try {
    // Validar parámetros
    if (!postId?.trim() || !userId?.trim()) {
      return 0;
    }

    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('userId', '==', userId),
      where('parentId', '==', null)
    );
    
    const snapshot = await getDocs(commentsQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Error obteniendo conteo de comentarios:', error instanceof Error ? error.message : 'Error desconocido');
    return 0;
  }
};