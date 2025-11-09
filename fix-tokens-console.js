// Script para ejecutar en la consola del navegador
// Copia y pega este código en la consola de Chrome/Firefox cuando estés en tu app

async function fixAllUserTokens() {
  console.log('🚀 Iniciando reparación de tokens para todos los usuarios...');
  
  try {
    // Importar Firebase desde la app
    const { db } = window; // Asumiendo que db está disponible globalmente
    const { collection, getDocs, doc, setDoc, getDoc } = firebase.firestore || window.firebase.firestore;
    
    if (!db) {
      console.error('❌ Base de datos no disponible. Asegúrate de estar en la app.');
      return;
    }
    
    // Obtener todos los usuarios
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`👥 Encontrados ${usersSnapshot.size} usuarios`);
    
    let fixed = 0;
    let alreadyFixed = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Verificar si ya tiene tokens
        const tokenRef = doc(db, 'tokens', userId);
        const tokenDoc = await getDoc(tokenRef);
        
        if (!tokenDoc.exists()) {
          // Crear tokens para usuario antiguo
          const tokenData = {
            tokens: 50, // Bonus para usuarios antiguos
            lastClaim: 0, // Puede reclamar inmediatamente
            followersCount: userData.followers || 0
          };
          
          await setDoc(tokenRef, tokenData);
          console.log(`✅ Reparado: @${userData.username} recibió 50 tokens`);
          fixed++;
        } else {
          console.log(`⏭️ Ya tiene tokens: @${userData.username}`);
          alreadyFixed++;
        }
        
        // Pausa para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Error con usuario ${userId}:`, error);
      }
    }
    
    console.log('\n🎉 REPARACIÓN COMPLETADA:');
    console.log(`✅ Usuarios reparados: ${fixed}`);
    console.log(`⏭️ Ya tenían tokens: ${alreadyFixed}`);
    console.log(`📊 Total: ${fixed + alreadyFixed}`);
    
    alert(`🎉 ¡Reparación completada!\n✅ ${fixed} usuarios recibieron tokens\n⏭️ ${alreadyFixed} ya los tenían`);
    
  } catch (error) {
    console.error('❌ Error en reparación:', error);
    alert('❌ Error en la reparación. Ver consola para detalles.');
  }
}

// Ejecutar automáticamente
fixAllUserTokens();