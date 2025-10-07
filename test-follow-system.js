// Script de prueba para el sistema de seguimiento
// Ejecutar con: node test-follow-system.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  // Configuración de Firebase (usar las mismas variables de entorno)
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function testFollowSystem() {
  try {
    console.log('🔥 Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase inicializado correctamente');
    console.log('📊 Proyecto ID:', firebaseConfig.projectId);
    
    // Verificar que podemos acceder a la base de datos
    console.log('🔍 Verificando acceso a Firestore...');
    
    // Intentar leer un documento de prueba
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc);
    
    console.log('✅ Conexión a Firestore exitosa');
    console.log('🎉 Sistema de seguimiento listo para usar');
    
  } catch (error) {
    console.error('❌ Error en el sistema:', error.message);
    console.error('🔧 Verifica tu configuración de Firebase');
  }
}

// Ejecutar prueba si se ejecuta directamente
if (require.main === module) {
  testFollowSystem();
}

module.exports = { testFollowSystem };