// SCRIPT DE EMERGENCIA PARA REPARAR SISTEMA DE TOKENS
// Ejecutar en la consola del navegador cuando estés logueado como administrador

async function emergencyTokenRepair() {
  console.log('🚨 INICIANDO REPARACIÓN DE EMERGENCIA DEL SISTEMA DE TOKENS');
  
  try {
    // Importar Firebase
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore, collection, getDocs, doc, setDoc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const auth = getAuth();
    const db = getFirestore();
    
    if (!auth.currentUser) {
      console.log('❌ No hay usuario logueado');
      return;
    }
    
    console.log('🔍 FASE 1: DIAGNÓSTICO DEL SISTEMA');
    
    // Obtener todos los usuarios
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const tokensSnapshot = await getDocs(collection(db, 'tokens'));
    
    console.log(`👥 Usuarios totales: ${usersSnapshot.size}`);
    console.log(`🪙 Usuarios con tokens: ${tokensSnapshot.size}`);
    
    const usersWithoutTokens = [];
    const corruptedTokens = [];
    
    // Verificar cada usuario
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        const tokenDoc = await getDoc(doc(db, 'tokens', userId));
        
        if (!tokenDoc.exists()) {
          usersWithoutTokens.push({ userId, userData });
        } else {
          const tokenData = tokenDoc.data();
          
          // Verificar integridad de datos
          if (typeof tokenData.tokens !== 'number' || 
              typeof tokenData.lastClaim !== 'number' || 
              typeof tokenData.followersCount !== 'number' ||
              tokenData.tokens < 0) {
            corruptedTokens.push({ userId, tokenData, userData });
          }
        }
      } catch (error) {
        console.error(`❌ Error verificando usuario ${userId}:`, error);
      }
    }
    
    console.log(`🔧 FASE 2: REPARACIÓN`);
    console.log(`📊 Usuarios sin tokens: ${usersWithoutTokens.length}`);
    console.log(`💥 Tokens corruptos: ${corruptedTokens.length}`);
    
    let repairedCount = 0;
    
    // Reparar usuarios sin tokens
    for (const { userId, userData } of usersWithoutTokens) {
      try {
        const initialTokens = 150; // Bonus generoso para usuarios afectados
        const tokenData = {
          tokens: initialTokens,
          lastClaim: 0, // Permitir reclamar inmediatamente
          followersCount: userData.followers || 0
        };
        
        await setDoc(doc(db, 'tokens', userId), tokenData);
        console.log(`✅ Reparado: ${userData.username || userId} - ${initialTokens} tokens`);
        repairedCount++;
        
        // Pausa para no sobrecargar Firebase
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error reparando ${userId}:`, error);
      }
    }
    
    // Reparar tokens corruptos
    for (const { userId, tokenData, userData } of corruptedTokens) {
      try {
        const repairedData = {
          tokens: Math.max(0, tokenData.tokens || 0) + 100, // Bonus por inconvenientes
          lastClaim: Math.max(0, tokenData.lastClaim || 0),
          followersCount: Math.max(0, tokenData.followersCount || userData.followers || 0)
        };
        
        await setDoc(doc(db, 'tokens', userId), repairedData);
        console.log(`🔧 Corregido: ${userData.username || userId} - datos corruptos reparados`);
        repairedCount++;
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error corrigiendo ${userId}:`, error);
      }
    }
    
    console.log('🎉 REPARACIÓN COMPLETADA');
    console.log(`✅ Usuarios reparados: ${repairedCount}`);
    console.log(`📊 Total procesados: ${usersWithoutTokens.length + corruptedTokens.length}`);
    
    // Verificar usuario actual
    const currentUserId = auth.currentUser.uid;
    const currentTokenDoc = await getDoc(doc(db, 'tokens', currentUserId));
    
    if (currentTokenDoc.exists()) {
      const currentTokens = currentTokenDoc.data();
      console.log('🔍 TUS TOKENS ACTUALES:', currentTokens);
    } else {
      console.log('⚠️ TÚ NO TIENES TOKENS - CREANDO...');
      await setDoc(doc(db, 'tokens', currentUserId), {
        tokens: 200,
        lastClaim: 0,
        followersCount: 0
      });
      console.log('✅ Tokens creados para ti: 200 tokens');
    }
    
    alert(`🎉 Reparación completada! ${repairedCount} usuarios reparados.`);
    
  } catch (error) {
    console.error('💥 ERROR CRÍTICO en reparación:', error);
    alert('❌ Error en reparación: ' + error.message);
  }
}

// Función para verificar estado actual
async function checkTokenStatus() {
  try {
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const auth = getAuth();
    const db = getFirestore();
    
    if (!auth.currentUser) {
      console.log('❌ No hay usuario logueado');
      return;
    }
    
    const [usersSnapshot, tokensSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'tokens'))
    ]);
    
    console.log('📊 ESTADO ACTUAL DEL SISTEMA:');
    console.log(`👥 Total usuarios: ${usersSnapshot.size}`);
    console.log(`🪙 Usuarios con tokens: ${tokensSnapshot.size}`);
    console.log(`📈 Cobertura: ${((tokensSnapshot.size / usersSnapshot.size) * 100).toFixed(1)}%`);
    
    if (tokensSnapshot.size < usersSnapshot.size) {
      console.log('⚠️ HAY USUARIOS SIN TOKENS - SE REQUIERE REPARACIÓN');
      return false;
    } else {
      console.log('✅ TODOS LOS USUARIOS TIENEN TOKENS');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    return false;
  }
}

// Ejecutar verificación primero
console.log('🔍 Verificando estado del sistema de tokens...');
checkTokenStatus().then(isHealthy => {
  if (!isHealthy) {
    console.log('🚨 Sistema requiere reparación. Ejecutando reparación automática...');
    emergencyTokenRepair();
  } else {
    console.log('✅ Sistema de tokens saludable');
  }
});