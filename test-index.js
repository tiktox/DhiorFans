const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBJqzOJBJqzOJBJqzOJBJqzOJBJqzOJBJqzOJB",
  authDomain: "moment24-200cb.firebaseapp.com",
  projectId: "moment24-200cb",
  storageBucket: "moment24-200cb.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testIndex() {
  try {
    console.log('🔍 Probando el índice de comentarios...');
    
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', 'test-post-id'),
      orderBy('timestamp', 'asc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('✅ Índice funcionando correctamente');
    console.log('📊 Documentos encontrados:', querySnapshot.size);
    
  } catch (error) {
    console.error('❌ Error probando el índice:', error.message);
  }
}

testIndex();