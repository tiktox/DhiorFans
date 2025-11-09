// Script para probar los comentarios después de las correcciones
// Ejecutar en la consola del navegador

async function testFixedComments() {
  console.log('🧪 Probando sistema de comentarios corregido...');
  
  try {
    // Verificar autenticación
    if (!firebase.auth().currentUser) {
      console.error('❌ Usuario no autenticado');
      return;
    }
    
    console.log('✅ Usuario autenticado:', firebase.auth().currentUser.uid);
    
    // Buscar posts en ambas colecciones
    const db = firebase.firestore();
    
    console.log('🔍 Buscando posts en colección "posts"...');
    const postsSnapshot = await db.collection('posts').limit(3).get();
    console.log('📊 Posts encontrados:', postsSnapshot.size);
    
    console.log('🔍 Buscando posts en colección "reels"...');
    const reelsSnapshot = await db.collection('reels').limit(3).get();
    console.log('📊 Reels encontrados:', reelsSnapshot.size);
    
    // Usar el primer post disponible
    let testPostId, testCollection;
    
    if (postsSnapshot.size > 0) {
      testPostId = postsSnapshot.docs[0].id;
      testCollection = 'posts';
      console.log('📝 Usando post de colección "posts":', testPostId);
    } else if (reelsSnapshot.size > 0) {
      testPostId = reelsSnapshot.docs[0].id;
      testCollection = 'reels';
      console.log('📝 Usando post de colección "reels":', testPostId);
    } else {
      console.error('❌ No hay posts disponibles para probar');
      return;
    }
    
    // Crear comentario de prueba
    const testComment = {
      postId: testPostId,
      userId: firebase.auth().currentUser.uid,
      username: 'TestUser',
      profilePicture: '',
      text: 'Comentario de prueba corregido - ' + new Date().toISOString(),
      timestamp: firebase.firestore.Timestamp.now()
    };
    
    console.log('💬 Creando comentario de prueba...');
    const commentRef = await db.collection('comments').add(testComment);
    console.log('✅ Comentario creado:', commentRef.id);
    
    // Verificar que se guardó
    const savedComment = await commentRef.get();
    if (savedComment.exists) {
      console.log('✅ Comentario verificado:', savedComment.data());
    }
    
    // Verificar contador del post
    const postRef = db.collection(testCollection).doc(testPostId);
    const postDoc = await postRef.get();
    
    if (postDoc.exists) {
      const postData = postDoc.data();
      console.log('📊 Contador de comentarios del post:', postData.commentsCount || 0);
    }
    
    // Limpiar comentario de prueba
    await commentRef.delete();
    console.log('🧹 Comentario de prueba eliminado');
    
    console.log('🎉 ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar automáticamente
testFixedComments();

// Exportar para uso manual
window.testFixedComments = testFixedComments;