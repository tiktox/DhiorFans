// Script de migración masiva para tokens de usuarios existentes
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  // Agregar tu configuración de Firebase aquí
  // O usar variables de entorno
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const migrateAllUsersTokens = async () => {
  console.log('🚀 Iniciando migración masiva de tokens...');
  
  try {
    // Obtener todos los usuarios
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`👥 Encontrados ${usersSnapshot.size} usuarios`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Verificar si ya tiene tokens
        const tokenDoc = await getDoc(doc(db, 'tokens', userId));
        
        if (!tokenDoc.exists()) {
          // Crear documento de tokens para usuario antiguo
          const initialTokens = 50; // Bonus para usuarios antiguos
          const followersCount = userData.followers || 0;
          
          const tokenData = {
            tokens: initialTokens,
            lastClaim: 0, // Permitir reclamar inmediatamente
            followersCount: followersCount
          };
          
          await setDoc(doc(db, 'tokens', userId), tokenData);
          
          console.log(`✅ Migrado: ${userData.username || userId} - ${initialTokens} tokens`);
          migratedCount++;
        } else {
          console.log(`⏭️  Ya migrado: ${userData.username || userId}`);
          skippedCount++;
        }
        
        // Pausa pequeña para no sobrecargar Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error migrando usuario ${userId}:`, error);
      }
    }
    
    console.log('\n🎉 MIGRACIÓN COMPLETADA:');
    console.log(`✅ Usuarios migrados: ${migratedCount}`);
    console.log(`⏭️  Usuarios ya migrados: ${skippedCount}`);
    console.log(`📊 Total procesados: ${migratedCount + skippedCount}`);
    
  } catch (error) {
    console.error('❌ Error en migración masiva:', error);
  }
};

// Ejecutar migración
migrateAllUsersTokens().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});