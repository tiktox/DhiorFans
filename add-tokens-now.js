// Ejecutar en consola del navegador cuando estés logueado
(async function() {
  try {
    console.log('🚀 Agregando 2.1M tokens...');
    
    const { addTokens } = await import('./lib/tokenService.js');
    const result = await addTokens('AfR6fEi9tFOYnchZkLNh2EVr7Ig2', 2100000);
    
    if (result.success) {
      console.log('✅ ¡Éxito! Total:', result.totalTokens.toLocaleString());
      alert(`¡Tokens agregados! Total: ${result.totalTokens.toLocaleString()}`);
      location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
    
    // Método directo con Firebase
    try {
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      const { db } = await import('./lib/firebase.js');
      
      const tokenRef = doc(db, 'tokens', 'AfR6fEi9tFOYnchZkLNh2EVr7Ig2');
      const tokenDoc = await getDoc(tokenRef);
      
      let current = 0;
      if (tokenDoc.exists()) {
        current = tokenDoc.data().tokens || 0;
      }
      
      const newTotal = current + 2100000;
      
      await setDoc(tokenRef, {
        tokens: newTotal,
        lastClaim: Date.now(),
        followersCount: 0
      });
      
      console.log('✅ Tokens agregados:', newTotal.toLocaleString());
      alert(`¡Éxito! Total: ${newTotal.toLocaleString()}`);
      location.reload();
    } catch (e2) {
      console.error('Error método 2:', e2);
    }
  }
})();