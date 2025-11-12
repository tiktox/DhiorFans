// Script simple para agregar tokens directamente
// Ejecutar con: node add-tokens-simple.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// Configuración directa (reemplaza con tus valores reales)
const firebaseConfig = {
  apiKey: "AIzaSyBYour_API_Key_Here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// IMPORTANTE: Reemplaza estos valores
const USER_ID = "TU_USER_ID_AQUI"; // Tu ID de usuario de Firebase Auth
const TOKENS_TO_ADD = 2100000; // 2.1M tokens

async function addTokens() {
  try {
    console.log('🚀 Iniciando proceso de tokens...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const tokenRef = doc(db, 'tokens', USER_ID);
    const tokenDoc = await getDoc(tokenRef);
    
    let currentTokens = 0;
    if (tokenDoc.exists()) {
      currentTokens = tokenDoc.data().tokens || 0;
      console.log(`📊 Tokens actuales: ${currentTokens.toLocaleString()}`);
    }
    
    const newTotal = currentTokens + TOKENS_TO_ADD;
    
    await setDoc(tokenRef, {
      tokens: newTotal,
      lastClaim: Date.now(),
      followersCount: 0
    });
    
    console.log(`✅ ¡Éxito! Tokens agregados: +${TOKENS_TO_ADD.toLocaleString()}`);
    console.log(`💰 Total de tokens: ${newTotal.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTokens();