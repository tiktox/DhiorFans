// EJECUTAR EN CONSOLA DEL NAVEGADOR AHORA MISMO

// 1. Verificar usuario actual
console.log('Usuario actual:', auth.currentUser?.email);

// 2. Crear documento en Firestore
async function crearUsuarioEnFirestore() {
  if (!auth.currentUser) {
    console.error('❌ No hay usuario logueado');
    return;
  }
  
  const user = auth.currentUser;
  const userData = {
    fullName: user.displayName || user.email.split('@')[0],
    username: user.email.split('@')[0].replace(/\s+/g, '_').toLowerCase(),
    email: user.email.toLowerCase(),
    bio: '',
    link: '',
    profilePicture: user.photoURL || '',
    followers: 0,
    following: 0,
    posts: 0
  };
  
  try {
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ Usuario creado:', userData);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// 3. Ejecutar
crearUsuarioEnFirestore();