const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// Configuración de Firebase (usar la misma de tu proyecto)
const firebaseConfig = {
  // Copia aquí tu configuración de Firebase desde lib/firebase.ts
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTokensToUser(userId, tokenAmount) {
  try {
    console.log(`🚀 Agregando ${tokenAmount.toLocaleString()} tokens al usuario: ${userId}`);
    
    // Obtener datos actuales del usuario
    const tokenRef = doc(db, 'tokens', userId);
    const tokenDoc = await getDoc(tokenRef);
    
    let currentTokens = 0;
    let lastClaim = 0;
    let followersCount = 0;
    
    if (tokenDoc.exists()) {
      const data = tokenDoc.data();
      currentTokens = data.tokens || 0;
      lastClaim = data.lastClaim || 0;
      followersCount = data.followersCount || 0;
      console.log(`📊 Tokens actuales: ${currentTokens.toLocaleString()}`);
    } else {
      console.log('📝 Creando nuevo documento de tokens');
    }
    
    const newTotal = currentTokens + tokenAmount;
    
    // Guardar en Firestore
    await setDoc(tokenRef, {
      tokens: newTotal,
      lastClaim: lastClaim,
      followersCount: followersCount
    });
    
    console.log(`✅ ¡Éxito! Tokens agregados: +${tokenAmount.toLocaleString()}`);
    console.log(`💰 Total de tokens: ${newTotal.toLocaleString()}`);
    
    return { success: true, totalTokens: newTotal };
  } catch (error) {
    console.error('❌ Error agregando tokens:', error);
    return { success: false, error: error.message };
  }
}

// Ejecutar el script
async function main() {
  // Reemplaza 'TU_USER_ID' con tu ID de usuario real
  const userId = 'TU_USER_ID'; // Obtén esto de Firebase Auth
  const tokenAmount = 2100000; // 2.1M tokens
  
  const result = await addTokensToUser(userId, tokenAmount);
  
  if (result.success) {
    console.log('🎉 Proceso completado exitosamente');
  } else {
    console.log('💥 Error en el proceso:', result.error);
  }
  
  process.exit(0);
}

main();