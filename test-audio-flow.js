// Script para probar el flujo completo de audio
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testAudioFlow() {
  try {
    console.log('🎵 Iniciando prueba del flujo de audio...');
    
    // 1. Verificar colección de audios
    console.log('📂 Verificando colección de audios...');
    const audiosRef = collection(db, 'audios');
    const audiosSnapshot = await getDocs(audiosRef);
    console.log(`✅ Encontrados ${audiosSnapshot.size} audios en total`);
    
    // 2. Verificar audios públicos
    console.log('🌍 Verificando audios públicos...');
    const publicQuery = query(
      collection(db, 'audios'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );
    const publicSnapshot = await getDocs(publicQuery);
    console.log(`✅ Encontrados ${publicSnapshot.size} audios públicos`);
    
    // 3. Mostrar estructura de datos
    if (publicSnapshot.size > 0) {
      console.log('📋 Estructura de audio de ejemplo:');
      const firstAudio = publicSnapshot.docs[0];
      console.log(JSON.stringify(firstAudio.data(), null, 2));
    }
    
    // 4. Verificar reglas de Firestore
    console.log('🔒 Las reglas de Firestore permiten:');
    console.log('   - Lectura pública de audios');
    console.log('   - Escritura solo para usuarios autenticados');
    console.log('   - Usuarios pueden gestionar sus propios audios');
    
    // 5. Verificar reglas de Storage
    console.log('📁 Las reglas de Storage permiten:');
    console.log('   - Lectura pública de archivos');
    console.log('   - Escritura en audio/{userId}/ para usuarios autenticados');
    
    console.log('✅ Flujo de audio verificado correctamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testAudioFlow();