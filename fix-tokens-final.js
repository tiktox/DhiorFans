// SCRIPT FINAL PARA AGREGAR TOKENS - EJECUTAR EN CONSOLA
// Copia y pega en la consola del navegador (F12)

console.log('🔥 INICIANDO REPARACIÓN FINAL DE TOKENS...');

// Configuración directa de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAg2XWnxEB0c0qYEatzIzO4DEZwoO0SZjM",
  authDomain: "moment24-200cb.firebaseapp.com",
  databaseURL: "https://moment24-200cb-default-rtdb.firebaseio.com",
  projectId: "moment24-200cb",
  storageBucket: "moment24-200cb.firebasestorage.app",
  messagingSenderId: "162325479083",
  appId: "1:162325479083:web:b9c46e895f2bac327d81ee",
  measurementId: "G-2PDQBH0MER"
};

const USER_ID = 'AfR6fEi9tFOYnchZkLNh2EVr7Ig1';
const TOKENS_TO_ADD = 2100000;

(async function() {
  try {
    console.log('📡 Método 1: Usando Firebase SDK directo...');
    
    // Importar Firebase
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
    const { getFirestore, doc, setDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Obtener tokens actuales
    const tokenRef = doc(db, 'tokens', USER_ID);
    const tokenDoc = await getDoc(tokenRef);
    
    let currentTokens = 0;
    if (tokenDoc.exists()) {
      const data = tokenDoc.data();
      currentTokens = data.tokens || 0;
      console.log('📊 Tokens actuales:', currentTokens.toLocaleString());
    } else {
      console.log('📝 Creando nuevo documento de tokens');
    }
    
    const newTotal = currentTokens + TOKENS_TO_ADD;
    
    // Guardar tokens
    await setDoc(tokenRef, {
      tokens: newTotal,
      lastClaim: Date.now(),
      followersCount: 0
    });
    
    console.log('✅ ¡ÉXITO! Tokens agregados');
    console.log('💰 Total final:', newTotal.toLocaleString());
    alert(`¡ÉXITO! Tokens totales: ${newTotal.toLocaleString()}`);
    
    // Recargar página
    setTimeout(() => location.reload(), 1000);
    
  } catch (error) {
    console.error('❌ Error método 1:', error);
    
    try {
      console.log('🔄 Método 2: Usando servicios locales...');
      
      // Usar servicios existentes de la app
      const { addTokens } = await import('./lib/tokenService.js');
      const result = await addTokens(USER_ID, TOKENS_TO_ADD);
      
      if (result.success) {
        console.log('✅ ¡ÉXITO método 2!');
        console.log('💰 Total:', result.totalTokens.toLocaleString());
        alert(`¡ÉXITO! Tokens totales: ${result.totalTokens.toLocaleString()}`);
        location.reload();
      } else {
        throw new Error('addTokens falló');
      }
      
    } catch (error2) {
      console.error('❌ Error método 2:', error2);
      
      try {
        console.log('🆘 Método 3: Firebase global...');
        
        if (window.firebase && window.firebase.firestore) {
          const db = window.firebase.firestore();
          const tokenRef = db.collection('tokens').doc(USER_ID);
          
          const tokenDoc = await tokenRef.get();
          let currentTokens = 0;
          
          if (tokenDoc.exists) {
            currentTokens = tokenDoc.data().tokens || 0;
          }
          
          const newTotal = currentTokens + TOKENS_TO_ADD;
          
          await tokenRef.set({
            tokens: newTotal,
            lastClaim: Date.now(),
            followersCount: 0
          });
          
          console.log('✅ ¡ÉXITO método 3!');
          console.log('💰 Total:', newTotal.toLocaleString());
          alert(`¡ÉXITO! Tokens totales: ${newTotal.toLocaleString()}`);
          location.reload();
        } else {
          throw new Error('Firebase global no disponible');
        }
        
      } catch (error3) {
        console.error('❌ TODOS LOS MÉTODOS FALLARON');
        console.error('Errores:', { error, error2, error3 });
        alert('ERROR CRÍTICO: No se pudieron agregar tokens. Contacta soporte.');
      }
    }
  }
})();

// Función de diagnóstico
window.DIAGNOSTICAR_FIREBASE = function() {
  console.log('🔍 DIAGNÓSTICO DE FIREBASE:');
  console.log('- Firebase global:', !!window.firebase);
  console.log('- Firestore global:', !!window.firebase?.firestore);
  console.log('- Usuario actual:', window.firebase?.auth?.()?.currentUser?.uid || 'No logueado');
  console.log('- Configuración:', firebaseConfig);
};

console.log('💡 Para diagnóstico ejecuta: DIAGNOSTICAR_FIREBASE()');