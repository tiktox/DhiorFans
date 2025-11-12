// 🚀 SISTEMA ROBUSTO DE TOKENS - EJECUTAR EN CONSOLA
// Copia y pega TODO este código en la consola (F12) de tu aplicación

console.log('🚀 EJECUTANDO SISTEMA ROBUSTO DE TOKENS...');

// Sistema robusto con múltiples métodos de respaldo
(async function addTokensRobusto() {
  const userId = 'AfR6fEi9tFOYnchZkLNh2EVr7Ig2';
  const cantidad = 2100000;
  
  console.log(`👤 Usuario objetivo: ${userId}`);
  console.log(`💰 Cantidad a agregar: ${cantidad.toLocaleString()}`);
  
  // Método 1: Sistema robusto con retry y validación
  try {
    console.log('🔄 Método 1: Sistema robusto con retry...');
    const tokenModule = await import('./lib/tokenService.js');
    const result = await tokenModule.addTokens(userId, cantidad, 'admin_grant_robust');
    
    if (result.success) {
      console.log('✅ ÉXITO - Método 1: Sistema robusto');
      console.log('💰 Total:', result.totalTokens.toLocaleString());
      
      // Verificar integridad después de la operación
      const verification = await tokenModule.getUserTokens(userId);
      console.log('🔍 Verificación:', verification);
      
      alert(`🎉 ¡ÉXITO ROBUSTO! Tokens totales: ${result.totalTokens.toLocaleString()}`);
      location.reload();
      return;
    }
  } catch (error) {
    console.log('⚠️ Método 1 falló:', error.message);
    console.log('🔄 Intentando método de respaldo...');
  }

  // Método 2: Transacción atómica con auditoría
  try {
    console.log('🔄 Método 2: Transacción atómica...');
    const firebaseModule = await import('./lib/firebase.js');
    const firestoreModule = await import('firebase/firestore');
    
    const db = firebaseModule.db;
    const { doc, runTransaction } = firestoreModule;
    
    const result = await runTransaction(db, async (transaction) => {
      const tokenRef = doc(db, 'tokens', userId);
      const tokenDoc = await transaction.get(tokenRef);
      
      let currentTokens = 0;
      let lastClaim = 0;
      let followersCount = 0;
      
      if (tokenDoc.exists()) {
        const data = tokenDoc.data();
        currentTokens = Math.max(0, data.tokens || 0);
        lastClaim = Math.max(0, data.lastClaim || 0);
        followersCount = Math.max(0, data.followersCount || 0);
      }
      
      const newTotal = currentTokens + cantidad;
      
      // Actualizar tokens
      transaction.set(tokenRef, {
        tokens: newTotal,
        lastClaim: lastClaim,
        followersCount: followersCount
      });
      
      // Crear auditoría
      const auditRef = doc(db, 'tokenTransactions', `admin_${userId}_${Date.now()}`);
      transaction.set(auditRef, {
        userId,
        amount: cantidad,
        type: 'admin_grant_atomic',
        timestamp: Date.now(),
        previousBalance: currentTokens,
        newBalance: newTotal,
        metadata: { method: 'atomic_transaction' }
      });
      
      return { success: true, totalTokens: newTotal };
    });
    
    console.log('✅ ÉXITO - Método 2: Transacción atómica');
    console.log('💰 Total:', result.totalTokens.toLocaleString());
    alert(`🎉 ¡ÉXITO ATÓMICO! Tokens totales: ${result.totalTokens.toLocaleString()}`);
    location.reload();
    
  } catch (error2) {
    console.error('❌ Método 2 también falló:', error2);
    
    // Método 3: Recuperación de emergencia con validación
    try {
      console.log('🔄 Método 3: Recuperación de emergencia...');
      
      if (window.firebase && window.firebase.firestore) {
        const db = window.firebase.firestore();
        const tokenRef = db.collection('tokens').doc(userId);
        
        const tokenDoc = await tokenRef.get();
        let currentTokens = 0;
        let lastClaim = 0;
        let followersCount = 0;
        
        if (tokenDoc.exists) {
          const data = tokenDoc.data();
          currentTokens = Math.max(0, data.tokens || 0);
          lastClaim = Math.max(0, data.lastClaim || 0);
          followersCount = Math.max(0, data.followersCount || 0);
        }
        
        const newTotal = currentTokens + cantidad;
        
        await tokenRef.set({
          tokens: newTotal,
          lastClaim: lastClaim,
          followersCount: followersCount
        });
        
        console.log('✅ ÉXITO - Método 3: Recuperación de emergencia');
        console.log('💰 Total:', newTotal.toLocaleString());
        alert(`🆘 ¡RECUPERACIÓN EXITOSA! Tokens totales: ${newTotal.toLocaleString()}`);
        location.reload();
      } else {
        throw new Error('Firebase global no disponible');
      }
    } catch (error3) {
      console.error('❌ TODOS LOS MÉTODOS FALLARON');
      console.error('🔍 Error Método 1:', error);
      console.error('🔍 Error Método 2:', error2);
      console.error('🔍 Error Método 3:', error3);
      
      // Diagnóstico de emergencia
      console.log('🏥 Ejecutando diagnóstico de emergencia...');
      try {
        const diagnostico = {
          firebase: !!window.firebase,
          firestore: !!window.firebase?.firestore,
          auth: !!window.firebase?.auth,
          online: navigator.onLine,
          timestamp: new Date().toISOString()
        };
        console.log('📊 Estado del sistema:', diagnostico);
      } catch (diagError) {
        console.error('❌ Error en diagnóstico:', diagError);
      }
      
      alert('❌ ERROR CRÍTICO: No se pudieron agregar los tokens. Revisa la consola para detalles.');
    }
  }
})();

// Crear funciones globales robustas para uso manual
window.TOKENS_ROBUSTO = {
  // Agregar tokens con sistema robusto
  agregar: async function(cantidad = 2100000) {
    try {
      console.log(`🚀 Agregando ${cantidad.toLocaleString()} tokens...`);
      const { addTokens } = await import('./lib/tokenService.js');
      const result = await addTokens(userId, cantidad, 'manual_robust');
      
      if (result.success) {
        console.log('✅ Tokens agregados exitosamente');
        alert(`🎉 ¡ÉXITO! Total: ${result.totalTokens.toLocaleString()}`);
        location.reload();
      } else {
        alert('❌ Error agregando tokens');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error: ' + error.message);
    }
  },
  
  // Verificar estado actual
  verificar: async function() {
    try {
      const { getUserTokens, checkTokenSystemHealth } = await import('./lib/tokenService.js');
      const tokens = await getUserTokens(userId);
      const health = await checkTokenSystemHealth(userId);
      
      console.log('📊 Estado actual:', tokens);
      console.log('🏥 Salud del sistema:', health);
      
      alert(`💰 Tokens: ${tokens.tokens.toLocaleString()}\n🏥 Salud: ${health.healthy ? 'Saludable' : 'Necesita atención'}`);
    } catch (error) {
      console.error('❌ Error verificando:', error);
      alert('❌ Error verificando: ' + error.message);
    }
  },
  
  // Reparar sistema si hay problemas
  reparar: async function() {
    try {
      console.log('🔧 Reparando sistema...');
      const { ensureUserTokensExist, clearTokenCache } = await import('./lib/tokenService.js');
      
      clearTokenCache(userId);
      await ensureUserTokensExist(userId, 0);
      
      console.log('✅ Sistema reparado');
      alert('✅ Sistema reparado exitosamente');
    } catch (error) {
      console.error('❌ Error reparando:', error);
      alert('❌ Error reparando: ' + error.message);
    }
  },
  
  // Mostrar ayuda
  ayuda: function() {
    console.log(`
🆘 FUNCIONES DISPONIBLES:

TOKENS_ROBUSTO.agregar()     - Agregar tokens (default: 2.1M)
TOKENS_ROBUSTO.verificar()   - Verificar estado actual
TOKENS_ROBUSTO.reparar()     - Reparar sistema
TOKENS_ROBUSTO.ayuda()       - Mostrar esta ayuda

Ejemplos:
TOKENS_ROBUSTO.agregar(5000000)  // Agregar 5M tokens
TOKENS_ROBUSTO.verificar()       // Ver estado
`);
  }
};

console.log('💡 Funciones disponibles: TOKENS_ROBUSTO.ayuda()');