// Script de diagnóstico completo para el sistema de comentarios
// Ejecutar en la consola del navegador cuando estés en la app

async function diagnoseCommentsSystem() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA DE COMENTARIOS');
  console.log('================================================');
  
  const results = {
    firebase: false,
    auth: false,
    firestore: false,
    rules: false,
    comments: false,
    posts: false
  };
  
  try {
    // 1. Verificar Firebase
    console.log('\n1️⃣ Verificando Firebase...');
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      console.log('✅ Firebase SDK cargado');
      results.firebase = true;
    } else {
      console.error('❌ Firebase SDK no disponible');
      return results;
    }
    
    // 2. Verificar autenticación
    console.log('\n2️⃣ Verificando autenticación...');
    const user = firebase.auth().currentUser;
    if (user) {
      console.log('✅ Usuario autenticado:', user.uid);
      console.log('📧 Email:', user.email);
      results.auth = true;
    } else {
      console.error('❌ Usuario no autenticado');
      return results;
    }
    
    // 3. Verificar conexión a Firestore
    console.log('\n3️⃣ Verificando conexión a Firestore...');
    const db = firebase.firestore();\n    \n    // Probar conexión básica\n    await db.enableNetwork();\n    console.log('✅ Conexión a Firestore establecida');\n    results.firestore = true;\n    \n    // 4. Verificar colecciones\n    console.log('\n4️⃣ Verificando colecciones...');\n    \n    // Verificar colección de comentarios\n    const commentsRef = db.collection('comments');\n    const commentsTest = await commentsRef.limit(1).get();\n    console.log('✅ Colección comments accesible, documentos:', commentsTest.size);\n    \n    // Verificar colección de posts\n    const postsRef = db.collection('posts');\n    const postsTest = await postsRef.limit(1).get();\n    console.log('✅ Colección posts accesible, documentos:', postsTest.size);\n    results.posts = true;\n    \n    // 5. Probar reglas de seguridad\n    console.log('\n5️⃣ Probando reglas de seguridad...');\n    \n    const testCommentData = {\n      postId: 'test-' + Date.now(),\n      userId: user.uid,\n      username: 'TestUser',\n      profilePicture: '',\n      text: 'Comentario de diagnóstico',\n      timestamp: firebase.firestore.Timestamp.now()\n    };\n    \n    const testDoc = await commentsRef.add(testCommentData);\n    console.log('✅ Reglas de escritura funcionando, documento creado:', testDoc.id);\n    \n    // Verificar lectura\n    const readTest = await testDoc.get();\n    if (readTest.exists) {\n      console.log('✅ Reglas de lectura funcionando');\n      results.rules = true;\n    }\n    \n    // Limpiar documento de prueba\n    await testDoc.delete();\n    console.log('🧹 Documento de prueba eliminado');\n    \n    // 6. Probar flujo completo de comentarios\n    console.log('\n6️⃣ Probando flujo completo...');\n    \n    // Buscar un post real o crear uno de prueba\n    let targetPostId;\n    if (postsTest.size > 0) {\n      targetPostId = postsTest.docs[0].id;\n      console.log('📝 Usando post existente:', targetPostId);\n    } else {\n      // Crear post de prueba\n      const testPost = {\n        userId: user.uid,\n        title: 'Post de prueba para comentarios',\n        description: 'Descripción de prueba',\n        mediaUrl: 'https://example.com/test.jpg',\n        mediaType: 'image',\n        timestamp: firebase.firestore.Timestamp.now(),\n        likes: 0,\n        comments: 0,\n        commentsCount: 0\n      };\n      \n      const postDoc = await postsRef.add(testPost);\n      targetPostId = postDoc.id;\n      console.log('📝 Post de prueba creado:', targetPostId);\n    }\n    \n    // Crear comentario en el post\n    const realCommentData = {\n      postId: targetPostId,\n      userId: user.uid,\n      username: 'DiagnosticUser',\n      profilePicture: '',\n      text: 'Comentario de diagnóstico completo - ' + new Date().toISOString(),\n      timestamp: firebase.firestore.Timestamp.now()\n    };\n    \n    const commentDoc = await commentsRef.add(realCommentData);\n    console.log('✅ Comentario real creado:', commentDoc.id);\n    \n    // Verificar que se puede leer\n    const commentsQuery = commentsRef.where('postId', '==', targetPostId);\n    const commentsSnapshot = await commentsQuery.get();\n    console.log('✅ Comentarios leídos del post:', commentsSnapshot.size);\n    \n    results.comments = true;\n    \n    // Limpiar comentario de prueba\n    await commentDoc.delete();\n    console.log('🧹 Comentario de prueba eliminado');\n    \n    console.log('\n🎉 DIAGNÓSTICO COMPLETADO EXITOSAMENTE');\n    console.log('=====================================');\n    console.log('Todos los componentes funcionan correctamente.');\n    \n  } catch (error) {\n    console.error('\n❌ ERROR EN DIAGNÓSTICO:', error);\n    console.error('Stack trace:', error.stack);\n    console.error('Código de error:', error.code);\n    console.error('Mensaje:', error.message);\n  }\n  \n  console.log('\n📊 RESUMEN DE RESULTADOS:');\n  console.log('========================');\n  Object.entries(results).forEach(([key, value]) => {\n    console.log(`${value ? '✅' : '❌'} ${key}: ${value ? 'OK' : 'FALLO'}`);\n  });\n  \n  return results;\n}\n\n// Función específica para probar la UI de comentarios\nfunction testCommentsUI() {\n  console.log('🖥️ Probando UI de comentarios...');\n  \n  // Verificar si el modal de comentarios está disponible\n  const commentsModal = document.querySelector('.comments-modal');\n  if (commentsModal) {\n    console.log('✅ Modal de comentarios encontrado en DOM');\n  } else {\n    console.log('⚠️ Modal de comentarios no visible (normal si está cerrado)');\n  }\n  \n  // Verificar botones de comentarios en reels\n  const commentButtons = document.querySelectorAll('.comment-btn');\n  console.log('💬 Botones de comentarios encontrados:', commentButtons.length);\n  \n  // Verificar contexto de comentarios\n  if (window.React && window.React.version) {\n    console.log('✅ React disponible, versión:', window.React.version);\n  }\n  \n  return {\n    modalPresent: !!commentsModal,\n    commentButtons: commentButtons.length,\n    reactAvailable: !!(window.React)\n  };\n}\n\n// Ejecutar diagnóstico automáticamente\nconsole.log('🚀 Iniciando diagnóstico automático...');\ndiagnoseCommentsSystem();\n\n// Exportar funciones para uso manual\nwindow.diagnoseCommentsSystem = diagnoseCommentsSystem;\nwindow.testCommentsUI = testCommentsUI;