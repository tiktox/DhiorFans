// Script para probar directamente la creación de comentarios
// Ejecutar en la consola del navegador

async function testDirectComment() {
  console.log('🧪 Probando creación directa de comentario...');
  
  try {
    // Verificar que estamos autenticados
    if (!firebase.auth().currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }
    
    console.log('✅ Usuario autenticado:', firebase.auth().currentUser.uid);
    
    // Obtener un post real para comentar
    const postsRef = firebase.firestore().collection('posts');
    const postsSnapshot = await postsRef.limit(1).get();
    
    if (postsSnapshot.empty) {
      console.log('⚠️ No hay posts, creando comentario en post de prueba...');
      var testPostId = 'test-post-' + Date.now();
    } else {
      var testPostId = postsSnapshot.docs[0].id;
      console.log('✅ Usando post existente:', testPostId);
    }
    
    // Crear comentario directamente en Firestore
    const commentData = {
      postId: testPostId,
      userId: firebase.auth().currentUser.uid,
      username: 'TestUser',
      profilePicture: '',
      text: 'Comentario de prueba directo - ' + new Date().toISOString(),
      timestamp: firebase.firestore.Timestamp.now()
    };
    
    console.log('📝 Datos del comentario:', commentData);
    
    const commentsRef = firebase.firestore().collection('comments');
    const docRef = await commentsRef.add(commentData);
    
    console.log('✅ Comentario creado directamente:', docRef.id);
    
    // Verificar que se guardó
    const savedDoc = await docRef.get();
    if (savedDoc.exists) {
      console.log('✅ Comentario verificado:', savedDoc.data());
    } else {
      console.error('❌ Comentario no encontrado después de crearlo');
    }
    
    // Probar leer comentarios del post
    const commentsQuery = commentsRef.where('postId', '==', testPostId);
    const commentsSnapshot = await commentsQuery.get();
    
    console.log('📊 Comentarios en el post:', commentsSnapshot.size);
    commentsSnapshot.forEach(doc => {
      console.log('💬', doc.id, doc.data());
    });
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error en prueba directa:', error);
    console.error('Stack:', error.stack);
  }
}

// Función para probar las reglas de seguridad
async function testSecurityRules() {
  console.log('🔒 Probando reglas de seguridad...');
  
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('❌ Usuario no autenticado');
      return;
    }
    
    // Probar crear comentario con datos válidos
    const validComment = {
      postId: 'test-post',
      userId: user.uid, // Mismo usuario
      username: 'TestUser',
      text: 'Comentario válido',
      timestamp: firebase.firestore.Timestamp.now()
    };
    
    const commentsRef = firebase.firestore().collection('comments');
    const docRef = await commentsRef.add(validComment);
    console.log('✅ Comentario válido creado:', docRef.id);
    
    // Limpiar
    await docRef.delete();
    console.log('🧹 Comentario de prueba eliminado');
    
    // Probar crear comentario con userId diferente (debería fallar)
    try {
      const invalidComment = {
        postId: 'test-post',
        userId: 'otro-usuario-id', // Usuario diferente
        username: 'TestUser',
        text: 'Comentario inválido',
        timestamp: firebase.firestore.Timestamp.now()
      };
      
      await commentsRef.add(invalidComment);
      console.error('❌ ERROR: Comentario inválido fue creado (no debería pasar)');
    } catch (error) {
      console.log('✅ Regla de seguridad funcionando: comentario inválido rechazado');
    }
    
  } catch (error) {
    console.error('❌ Error probando reglas:', error);
  }
}

// Ejecutar pruebas
console.log('🚀 Iniciando pruebas directas de comentarios...');
testDirectComment().then(commentId => {
  if (commentId) {
    console.log('🎉 Prueba directa exitosa, ID del comentario:', commentId);
  }
});

// Exportar funciones
window.testDirectComment = testDirectComment;
window.testSecurityRules = testSecurityRules;