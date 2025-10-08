// Script para debuggear el problema de seguimiento
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, doc, setDoc, deleteDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBJqQJhJJJJJJJJJJJJJJJJJJJJJJJJJJJ", // Placeholder
  authDomain: "moment24-200cb.firebaseapp.com",
  projectId: "moment24-200cb",
  storageBucket: "moment24-200cb.appspot.com",
};

async function testFollowPermissions() {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Autenticar usuario
    await signInAnonymously(auth);
    console.log('✅ Usuario autenticado:', auth.currentUser?.uid);
    
    const followerId = auth.currentUser.uid;
    const targetUserId = 'test-target-user';
    const followId = `${followerId}_${targetUserId}`;
    
    // Test 1: Crear follow
    console.log('🔄 Probando crear follow...');
    const followData = {
      followerId: followerId,
      followingId: targetUserId,
      timestamp: Date.now()
    };
    
    await setDoc(doc(db, 'follows', followId), followData);
    console.log('✅ Follow creado exitosamente');
    
    // Test 2: Verificar follow existe
    const followDoc = await getDoc(doc(db, 'follows', followId));
    console.log('📋 Follow existe:', followDoc.exists());
    
    // Test 3: Eliminar follow
    console.log('🔄 Probando eliminar follow...');
    await deleteDoc(doc(db, 'follows', followId));
    console.log('✅ Follow eliminado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    console.error('Código de error:', error.code);
  }
}

testFollowPermissions();