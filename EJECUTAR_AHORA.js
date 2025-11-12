// EJECUTAR INMEDIATAMENTE EN CONSOLA DEL NAVEGADOR
// Copia y pega TODO este código en la consola (F12) de tu aplicación

console.log('🚀 EJECUTANDO AUTODONACIÓN DE TOKENS...');

// Método 1: Usando el servicio existente
(async function addTokensNow() {
  try {
    // Importar directamente desde el módulo
    const tokenModule = await import('./lib/tokenService.js');
    const result = await tokenModule.addTokens('AfR6fEi9tFOYnchZkLNh2EVr7Ig2', 2100000, 'admin_grant');
    
    if (result.success) {
      console.log('✅ ÉXITO - Método 1: Tokens agregados');
      console.log('💰 Total:', result.totalTokens.toLocaleString());
      alert(`¡ÉXITO! Tokens totales: ${result.totalTokens.toLocaleString()}`);
      location.reload();
      return;
    }
  } catch (error) {
    console.log('⚠️ Método 1 falló, intentando método 2...');
  }

  // Método 2: Directo a Firestore
  try {
    const firebaseModule = await import('./lib/firebase.js');
    const firestoreModule = await import('firebase/firestore');
    
    const db = firebaseModule.db;
    const { doc, setDoc, getDoc } = firestoreModule;
    
    const tokenRef = doc(db, 'tokens', 'AfR6fEi9tFOYnchZkLNh2EVr7Ig2');
    const tokenDoc = await getDoc(tokenRef);
    
    let currentTokens = 0;
    let lastClaim = 0;
    let followersCount = 0;
    
    if (tokenDoc.exists()) {
      const data = tokenDoc.data();
      currentTokens = data.tokens || 0;
      lastClaim = data.lastClaim || 0;
      followersCount = data.followersCount || 0;
    }
    
    const newTotal = currentTokens + 2100000;
    
    await setDoc(tokenRef, {
      tokens: newTotal,
      lastClaim: lastClaim,
      followersCount: followersCount
    });
    
    console.log('✅ ÉXITO - Método 2: Tokens agregados directamente');
    console.log('💰 Total:', newTotal.toLocaleString());
    alert(`¡ÉXITO! Tokens totales: ${newTotal.toLocaleString()}`);
    location.reload();
    
  } catch (error2) {
    console.error('❌ Método 2 también falló:', error2);
    
    // Método 3: Usando Firebase global si está disponible
    try {
      if (window.firebase && window.firebase.firestore) {
        const db = window.firebase.firestore();
        const tokenRef = db.collection('tokens').doc('AfR6fEi9tFOYnchZkLNh2EVr7Ig2');
        
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
        
        console.log('✅ ÉXITO - Método 3: Tokens agregados con Firebase global');
        console.log('💰 Total:', newTotal.toLocaleString());
        alert(`¡ÉXITO! Tokens totales: ${newTotal.toLocaleString()}`);
        location.reload();
      } else {
        throw new Error('Firebase global no disponible');
      }
    } catch (error3) {
      console.error('❌ TODOS LOS MÉTODOS FALLARON');
      console.error('Error 1:', error);
      console.error('Error 2:', error2);
      console.error('Error 3:', error3);
      alert('ERROR: No se pudieron agregar los tokens. Revisa la consola.');
    }
  }
})();

// También crear función global para uso manual
window.AGREGAR_TOKENS_AHORA = async function() {
  try {
    const { addTokens } = await import('./lib/tokenService.js');
    const result = await addTokens('AfR6fEi9tFOYnchZkLNh2EVr7Ig2', 2100000, 'admin_grant');
    if (result.success) {
      alert(`¡ÉXITO! Total: ${result.totalTokens.toLocaleString()}`);
      location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

console.log('💡 También puedes ejecutar: AGREGAR_TOKENS_AHORA()');