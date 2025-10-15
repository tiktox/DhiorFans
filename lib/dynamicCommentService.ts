import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';

export const checkDynamicComment = async (postId: string, comment: string, userId: string, onStateChange?: (postId: string, isActive: boolean) => void) => {
  // Obtener datos del post
  const postDoc = await getDoc(doc(db, 'posts', postId));
  if (!postDoc.exists()) return { isWinner: false, tokensWon: 0 };
  
  const postData = postDoc.data();
  if (!postData.isDynamic || !postData.keywords || !postData.isActive) {
    return { isWinner: false, tokensWon: 0 };
  }

  // Prevenir que el creador comente su propia dinámica
  if (postData.userId === userId) {
    return { isWinner: false, tokensWon: 0, error: 'No puedes participar en tu propia dinámica' };
  }

  // Verificar si el comentario contiene alguna palabra clave
  const commentLower = comment.toLowerCase().trim();
  const matchedKeyword = postData.keywords.find((keyword: string) => 
    commentLower.includes(keyword.toLowerCase())
  );

  if (matchedKeyword) {
    // Usuario ganó tokens
    const tokensWon = postData.tokensReward || 0;
    
    // Actualizar tokens del usuario ganador
    const userRef = doc(db, 'tokens', userId);
    await updateDoc(userRef, {
      tokens: increment(tokensWon)
    });

    // Desactivar la dinámica
    await updateDoc(doc(db, 'posts', postId), {
      isActive: false,
      winnerId: userId,
      winnerKeyword: matchedKeyword,
      winnerTimestamp: Date.now()
    });

    // Notificar cambio de estado inmediatamente
    onStateChange?.(postId, false);

    console.log(`🎉 Usuario ${userId} ganó ${tokensWon} tokens con la palabra "${matchedKeyword}"`);
    
    return { 
      isWinner: true, 
      tokensWon, 
      keyword: matchedKeyword,
      postTitle: postData.title || postData.description
    };
  }

  return { isWinner: false, tokensWon: 0 };
};

export const getUserCommentCount = async (postId: string, userId: string): Promise<number> => {
  const commentsQuery = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    where('userId', '==', userId),
    where('parentId', '==', null) // Solo comentarios principales, no respuestas
  );
  
  const snapshot = await getDocs(commentsQuery);
  return snapshot.size;
};