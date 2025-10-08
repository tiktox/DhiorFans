// Test del sistema de tokens y seguimiento
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, updateDoc, increment } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "moment24-200cb",
  // Agregar otras configuraciones necesarias
};

async function testTokenSystem() {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    await signInAnonymously(auth);
    console.log('✅ Autenticado como:', auth.currentUser?.uid);
    
    const testUserId = 'test-user-' + Date.now();
    
    // Test 1: Crear usuario con 0 seguidores
    console.log('🔄 Creando usuario de prueba...');
    await setDoc(doc(db, 'users', testUserId), {
      username: 'testuser',
      followers: 0,
      following: 0
    });
    
    // Test 2: Crear tokens iniciales
    console.log('🔄 Creando tokens iniciales...');
    await setDoc(doc(db, 'tokens', testUserId), {
      tokens: 0,
      lastClaim: 0,
      followersCount: 0
    });
    
    // Test 3: Simular primer seguidor
    console.log('🔄 Simulando primer seguidor...');
    await updateDoc(doc(db, 'users', testUserId), {
      followers: increment(1)
    });
    
    // Test 4: Otorgar bonus de 50 tokens
    console.log('🔄 Otorgando bonus de tokens...');
    const tokenRef = doc(db, 'tokens', testUserId);
    const tokenDoc = await getDoc(tokenRef);
    const tokenData = tokenDoc.data();
    
    await setDoc(tokenRef, {
      tokens: tokenData.tokens + 50,
      lastClaim: tokenData.lastClaim,
      followersCount: 1
    });
    
    // Test 5: Verificar resultado
    const finalTokenDoc = await getDoc(tokenRef);
    const finalTokens = finalTokenDoc.data();
    
    console.log('🎉 Resultado final:', finalTokens);
    console.log('✅ Test completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testTokenSystem();
}