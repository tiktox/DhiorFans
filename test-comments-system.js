// Script de prueba para verificar el sistema de comentarios
// Ejecutar en la consola del navegador cuando estés en la app

async function testCommentsSystem() {
  console.log('🧪 Iniciando prueba del sistema de comentarios...');
  
  try {
    // Verificar Firebase
    if (!window.firebase || !window.db) {
      console.error('❌ Firebase no está disponible');
      return;
    }
    
    console.log('✅ Firebase conectado');
    
    // Verificar autenticación
    const { auth } = window;
    if (!auth.currentUser) {
      console.error('❌ Usuario no autenticado');
      return;
    }
    
    console.log('✅ Usuario autenticado:', auth.currentUser.uid);
    
    // Verificar colección de comentarios
    const { collection, getDocs, query, limit } = window.firebase.firestore || firebase.firestore;
    const commentsRef = collection(window.db, 'comments');
    
    console.log('🔍 Verificando colección de comentarios...');
    const testQuery = query(commentsRef, limit(1));
    const snapshot = await getDocs(testQuery);
    
    console.log('✅ Colección de comentarios accesible');
    console.log('📊 Comentarios encontrados:', snapshot.size);
    
    // Verificar colección de posts
    const postsRef = collection(window.db, 'posts');
    const postsQuery = query(postsRef, limit(5));
    const postsSnapshot = await getDocs(postsQuery);
    
    console.log('✅ Colección de posts accesible');
    console.log('📊 Posts encontrados:', postsSnapshot.size);
    
    if (postsSnapshot.size > 0) {
      const firstPost = postsSnapshot.docs[0];
      console.log('📝 Primer post ID:', firstPost.id);
      console.log('📝 Datos del post:', firstPost.data());
    }
    
    // Probar crear un comentario de prueba
    console.log('🧪 Probando crear comentario...');
    
    const testComment = {
      postId: 'test-post-id',
      userId: auth.currentUser.uid,
      username: 'TestUser',
      profilePicture: '',
      text: 'Comentario de prueba - ' + new Date().toISOString(),
      timestamp: firebase.firestore.Timestamp.now()
    };
    
    const { addDoc } = window.firebase.firestore || firebase.firestore;
    const docRef = await addDoc(commentsRef, testComment);
    
    console.log('✅ Comentario de prueba creado:', docRef.id);
    
    // Verificar que se guardó correctamente
    const { getDoc, doc } = window.firebase.firestore || firebase.firestore;
    const savedComment = await getDoc(doc(window.db, 'comments', docRef.id));
    
    if (savedComment.exists()) {
      console.log('✅ Comentario verificado en Firebase:', savedComment.data());
    } else {
      console.error('❌ Comentario no encontrado después de crearlo');
    }
    
    // Limpiar comentario de prueba
    const { deleteDoc } = window.firebase.firestore || firebase.firestore;
    await deleteDoc(doc(window.db, 'comments', docRef.id));
    console.log('🧹 Comentario de prueba eliminado');
    
    console.log('🎉 TODAS LAS PRUEBAS PASARON - El sistema de comentarios funciona correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Función para probar comentarios en un post específico
async function testCommentsOnPost(postId) {
  console.log('🧪 Probando comentarios en post:', postId);
  
  try {
    const { collection, query, where, getDocs } = window.firebase.firestore || firebase.firestore;
    const commentsRef = collection(window.db, 'comments');
    const q = query(commentsRef, where('postId', '==', postId));
    
    const snapshot = await getDocs(q);
    console.log(`📊 Comentarios en post ${postId}:`, snapshot.size);
    
    snapshot.forEach(doc => {
      console.log('💬 Comentario:', doc.id, doc.data());
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo comentarios:', error);
  }
}

// Función para verificar reglas de Firestore
async function testFirestoreRules() {
  console.log('🔒 Verificando reglas de Firestore...');
  
  try {
    const { auth } = window;
    if (!auth.currentUser) {
      console.error('❌ Necesitas estar autenticado para probar las reglas');
      return;
    }
    
    // Intentar leer comentarios (debería funcionar)
    const { collection, getDocs, query, limit } = window.firebase.firestore || firebase.firestore;
    const commentsRef = collection(window.db, 'comments');
    const testQuery = query(commentsRef, limit(1));
    
    await getDocs(testQuery);
    console.log('✅ Lectura de comentarios permitida');
    
    // Intentar escribir comentario (debería funcionar si está autenticado)
    const { addDoc } = window.firebase.firestore || firebase.firestore;
    const testDoc = await addDoc(commentsRef, {
      postId: 'rule-test',
      userId: auth.currentUser.uid,
      text: 'Test de reglas',
      timestamp: firebase.firestore.Timestamp.now()
    });
    
    console.log('✅ Escritura de comentarios permitida');
    
    // Limpiar
    const { deleteDoc, doc } = window.firebase.firestore || firebase.firestore;
    await deleteDoc(doc(window.db, 'comments', testDoc.id));
    console.log('🧹 Documento de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error en reglas de Firestore:', error);
  }
}

// Ejecutar pruebas automáticamente
console.log('🚀 Ejecutando pruebas del sistema de comentarios...');
testCommentsSystem();

// Exportar funciones para uso manual
window.testCommentsSystem = testCommentsSystem;
window.testCommentsOnPost = testCommentsOnPost;
window.testFirestoreRules = testFirestoreRules;