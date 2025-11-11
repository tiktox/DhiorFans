// Script simple para restaurar tokens
// Ejecutar en la consola del navegador cuando estés logueado

async function restaurarTokens() {
  try {
    // Importar Firebase
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const auth = getAuth();
    const db = getFirestore();
    
    if (!auth.currentUser) {
      console.log('❌ No hay usuario logueado');
      return;
    }
    
    const userId = auth.currentUser.uid;
    console.log('🔄 Restaurando tokens para usuario:', userId);
    
    // Restaurar a 200M tokens
    await updateDoc(doc(db, 'tokens', userId), {
      tokens: 200000000
    });
    
    console.log('✅ Tokens restaurados a 200,000,000');
    alert('✅ Tokens restaurados exitosamente a 200M!');
    
    // Recargar la página para ver los cambios
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error restaurando tokens: ' + error.message);
  }
}

// Ejecutar automáticamente
restaurarTokens();