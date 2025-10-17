// Test para verificar que el avatar se muestre en la barra de navegación
console.log('🧪 Iniciando test de avatar en barra de navegación...');

// Función para verificar el estado del avatar en la navegación
function testAvatarInNavbar() {
  console.log('🔍 Verificando elementos de navegación...');
  
  // Buscar el elemento de navegación del perfil
  const profileNavElement = document.querySelector('.profile-pic-nav');
  
  if (profileNavElement) {
    console.log('✅ Elemento de navegación del perfil encontrado');
    
    // Verificar si tiene la clase de avatar
    const hasAvatarClass = profileNavElement.classList.contains('avatar-nav-small');
    console.log('🎭 Tiene clase avatar-nav-small:', hasAvatarClass);
    
    // Verificar dimensiones
    const styles = window.getComputedStyle(profileNavElement);
    console.log('📏 Dimensiones actuales:');
    console.log('  - Ancho:', styles.width);
    console.log('  - Alto:', styles.height);
    console.log('  - Border radius:', styles.borderRadius);
    console.log('  - Border:', styles.border);
    
    // Verificar imagen
    const img = profileNavElement.querySelector('img');
    if (img) {
      console.log('🖼️ Imagen encontrada:', img.src);
      console.log('🖼️ Object-fit:', window.getComputedStyle(img).objectFit);
    } else {
      console.log('❌ No se encontró imagen en navegación');
    }
    
    return {
      found: true,
      hasAvatarClass,
      dimensions: {
        width: styles.width,
        height: styles.height,
        borderRadius: styles.borderRadius
      }
    };
  } else {
    console.log('❌ Elemento de navegación del perfil no encontrado');
    return { found: false };
  }
}

// Función para simular datos de usuario con avatar
function simulateAvatarUser() {
  console.log('🎭 Simulando usuario con avatar...');
  
  // Buscar el componente Home y simular userData con isAvatar: true
  const profileNavElement = document.querySelector('.profile-pic-nav');
  if (profileNavElement) {
    // Agregar clase de avatar manualmente para testing
    profileNavElement.classList.add('avatar-nav-small');
    console.log('✅ Clase avatar-nav-small agregada para testing');
    
    // Verificar cambios
    setTimeout(() => {
      testAvatarInNavbar();
    }, 100);
  }
}

// Función para verificar estilos CSS
function testAvatarStyles() {
  console.log('🎨 Verificando estilos CSS de avatar...');
  
  // Crear elemento temporal para probar estilos
  const testElement = document.createElement('div');
  testElement.className = 'profile-pic-nav avatar-nav-small';
  testElement.style.position = 'absolute';
  testElement.style.top = '-1000px';
  document.body.appendChild(testElement);
  
  const styles = window.getComputedStyle(testElement);
  console.log('🎨 Estilos de avatar-nav-small:');
  console.log('  - Ancho:', styles.width);
  console.log('  - Alto:', styles.height);
  console.log('  - Border radius:', styles.borderRadius);
  console.log('  - Border:', styles.border);
  console.log('  - Background:', styles.background);
  
  // Limpiar
  document.body.removeChild(testElement);
}

// Ejecutar tests
console.log('🚀 Ejecutando tests...');
testAvatarStyles();
testAvatarInNavbar();

// Test adicional después de un delay
setTimeout(() => {
  console.log('🔄 Test adicional después de 2 segundos...');
  simulateAvatarUser();
}, 2000);

console.log('✅ Tests de avatar en navbar completados');