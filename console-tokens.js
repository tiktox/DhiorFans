// Ejecutar este código en la consola del navegador (F12)
// cuando estés logueado en tu aplicación

(async function addTokensFromConsole() {
  try {
    console.log('🚀 Iniciando autodonación de tokens desde consola...');
    
    // Verificar que Firebase esté disponible
    if (typeof firebase === 'undefined' && typeof window.firebase === 'undefined') {
      console.error('❌ Firebase no está disponible');
      return;
    }
    
    // Obtener el usuario actual
    const auth = firebase?.auth?.() || window.firebase?.auth?.();
    const user = auth?.currentUser;
    
    if (!user) {
      console.error('❌ No hay usuario logueado');
      return;
    }
    
    console.log('👤 Usuario encontrado:', user.uid);
    
    // Importar función de tokens
    const { addTokens } = await import('./lib/tokenService.js');
    
    // Agregar tokens
    const result = await addTokens(user.uid, 2100000);
    
    if (result.success) {
      console.log('✅ ¡Éxito! Tokens agregados:', result.totalTokens.toLocaleString());
      alert(`¡Éxito! Tokens totales: ${result.totalTokens.toLocaleString()}`);
      window.location.reload();
    } else {
      console.error('❌ Error agregando tokens');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // Método alternativo usando fetch directo a Firestore
    try {
      console.log('🔄 Intentando método alternativo...');
      
      // Este método requiere que tengas acceso a las funciones de Firebase
      const db = window.firebase?.firestore?.();
      const auth = window.firebase?.auth?.();
      const user = auth?.currentUser;
      
      if (db && user) {
        const tokenRef = db.collection('tokens').doc(user.uid);
        const tokenDoc = await tokenRef.get();
        
        let currentTokens = 0;
        if (tokenDoc.exists) {
          currentTokens = tokenDoc.data().tokens || 0;
        }
        
        const newTotal = currentTokens + 2100000;
        
        await tokenRef.set({
          tokens: newTotal,
          lastClaim: Date.now(),
          followersCount: 0
        });
        
        console.log('✅ Tokens agregados exitosamente:', newTotal.toLocaleString());
        alert(`¡Éxito! Tokens totales: ${newTotal.toLocaleString()}`);
        window.location.reload();
      }
    } catch (altError) {
      console.error('❌ Error en método alternativo:', altError);
    }
  }
})();

// También crear una función global para uso manual
window.addMyTokens = async function() {
  try {
    const { addTokens } = await import('./lib/tokenService.js');
    const auth = firebase?.auth?.() || window.firebase?.auth?.();
    const user = auth?.currentUser;
    
    if (!user) {
      alert('No hay usuario logueado');
      return;
    }
    
    const result = await addTokens(user.uid, 2100000);
    if (result.success) {
      alert(`¡Éxito! Tokens totales: ${result.totalTokens.toLocaleString()}`);
      window.location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error agregando tokens');
  }
};

console.log('💡 También puedes ejecutar: addMyTokens()');