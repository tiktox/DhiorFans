const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAOZ3lbTP8Ej8YJJhJJhJhJhJhJhJhJhJhJ",
  authDomain: "dhirofans.firebaseapp.com",
  projectId: "dhirofans",
  storageBucket: "dhirofans.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function restoreTokens() {
  try {
    console.log('🔄 Iniciando restauración de tokens...');
    
    // Obtener el usuario actual (necesitarás proporcionar tu userId)
    const userId = 'TU_USER_ID_AQUI'; // Reemplaza con tu ID de usuario
    
    // Verificar tokens actuales
    const tokenDoc = await getDoc(doc(db, 'tokens', userId));
    
    if (tokenDoc.exists()) {
      const currentData = tokenDoc.data();
      console.log('📊 Tokens actuales:', currentData.tokens);
      
      // Restaurar a 200M tokens
      await updateDoc(doc(db, 'tokens', userId), {
        tokens: 200000000, // 200 millones
        lastClaim: currentData.lastClaim || 0,
        followersCount: currentData.followersCount || 0
      });
      
      console.log('✅ Tokens restaurados exitosamente a 200,000,000');
      
      // Verificar la actualización
      const updatedDoc = await getDoc(doc(db, 'tokens', userId));
      const updatedData = updatedDoc.data();
      console.log('🎉 Tokens finales:', updatedData.tokens.toLocaleString());
      
    } else {
      console.log('❌ No se encontró documento de tokens para el usuario');
    }
    
  } catch (error) {
    console.error('❌ Error restaurando tokens:', error);
  }
}

// Ejecutar la restauración
restoreTokens();