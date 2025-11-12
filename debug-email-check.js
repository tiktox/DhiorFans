// Script para verificar correos en Firestore
// Ejecutar en consola del navegador

async function debugEmailCheck(email) {
  console.log('🔍 Iniciando verificación de correo:', email);
  
  try {
    // Importar Firebase
    const { db } = await import('./lib/firebase.js');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const normalizedEmail = email.toLowerCase().trim();
    console.log('📧 Email normalizado:', normalizedEmail);
    
    // Consultar usuarios
    const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);
    
    console.log('📊 Resultados de la consulta:');
    console.log('- Documentos encontrados:', querySnapshot.size);
    console.log('- Query vacía:', querySnapshot.empty);
    
    if (!querySnapshot.empty) {
      console.log('👥 Usuarios encontrados:');
      querySnapshot.forEach((doc, index) => {
        console.log(`Usuario ${index + 1}:`, doc.data());
      });
    } else {
      console.log('✅ No se encontraron usuarios con este email');
    }
    
    return querySnapshot.empty;
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    return false;
  }
}

// Función para verificar todos los usuarios
async function listAllUsers() {
  try {
    const { db } = await import('./lib/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const querySnapshot = await getDocs(collection(db, 'users'));
    console.log('👥 Todos los usuarios registrados:');
    
    querySnapshot.forEach((doc, index) => {
      const userData = doc.data();
      console.log(`${index + 1}. Email: ${userData.email}, Username: ${userData.username}`);
    });
    
    console.log(`📊 Total de usuarios: ${querySnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
  }
}

// Exportar funciones para uso en consola
window.debugEmailCheck = debugEmailCheck;
window.listAllUsers = listAllUsers;

console.log('🛠️ Funciones de debug disponibles:');
console.log('- debugEmailCheck("tu-email@ejemplo.com")');
console.log('- listAllUsers()');