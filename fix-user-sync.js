// Script para sincronizar usuario actual con Firestore
// Ejecutar en consola del navegador cuando estés logueado

async function syncCurrentUser() {
  try {
    console.log('🔄 Sincronizando usuario actual...');
    
    // Verificar si hay usuario autenticado
    if (!auth.currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }
    
    const user = auth.currentUser;
    console.log('👤 Usuario autenticado:', user.email);
    
    // Verificar si ya existe en Firestore
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      console.log('✅ Usuario ya existe en Firestore:', docSnap.data());
      return;
    }
    
    // Crear documento del usuario
    const userData = {
      fullName: user.displayName || user.email?.split('@')[0] || 'Usuario',
      username: (user.email?.split('@')[0] || 'usuario').replace(/\s+/g, '_').toLowerCase(),
      email: user.email || '',
      bio: '',
      link: '',
      profilePicture: user.photoURL || '',
      followers: 0,
      following: 0,
      posts: 0
    };
    
    await setDoc(userRef, userData);
    console.log('✅ Usuario sincronizado correctamente:', userData);
    
    // Verificar que se guardó
    const verifySnap = await getDoc(userRef);
    if (verifySnap.exists()) {
      console.log('✅ Verificación exitosa - Usuario guardado en Firestore');
    }
    
  } catch (error) {
    console.error('❌ Error sincronizando usuario:', error);
  }
}

// Función para verificar todos los usuarios
async function checkAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    console.log('📊 Total usuarios en Firestore:', querySnapshot.size);
    
    querySnapshot.forEach((doc, index) => {
      const userData = doc.data();
      console.log(`${index + 1}. ${userData.email} (${userData.username})`);
    });
    
  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
  }
}

// Hacer funciones disponibles globalmente
window.syncCurrentUser = syncCurrentUser;
window.checkAllUsers = checkAllUsers;

console.log('🛠️ Funciones disponibles:');
console.log('- syncCurrentUser() - Sincronizar usuario actual');
console.log('- checkAllUsers() - Ver todos los usuarios');