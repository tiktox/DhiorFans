// Test Avatar Profile Integration
// Este archivo prueba la integración completa del sistema de avatares

const testAvatarIntegration = () => {
  console.log('🧪 INICIANDO PRUEBAS DE INTEGRACIÓN DE AVATARES');
  
  // Test 1: Verificar que los avatares se muestren con dimensiones correctas
  console.log('📏 Test 1: Verificando dimensiones de avatar (140x250)');
  const avatarDisplay = document.querySelector('.avatar-display');
  if (avatarDisplay) {
    const styles = window.getComputedStyle(avatarDisplay);
    const width = styles.width;
    const height = styles.height;
    console.log(`📐 Dimensiones encontradas: ${width} x ${height}`);
    console.log(width === '140px' && height === '250px' ? '✅ Dimensiones correctas' : '❌ Dimensiones incorrectas');
  } else {
    console.log('ℹ️ No hay avatar activo para probar dimensiones');
  }
  
  // Test 2: Verificar que el perfil circular se muestre cuando no hay avatar
  console.log('🔵 Test 2: Verificando perfil circular por defecto');
  const profilePic = document.querySelector('.profile-pic-centered');
  if (profilePic) {
    const styles = window.getComputedStyle(profilePic);
    const borderRadius = styles.borderRadius;
    console.log(`🔄 Border radius: ${borderRadius}`);
    console.log(borderRadius === '50%' ? '✅ Perfil circular correcto' : '❌ Perfil circular incorrecto');
  }
  
  // Test 3: Verificar que la navegación muestre el indicador de avatar
  console.log('🧭 Test 3: Verificando indicador de avatar en navegación');
  const navAvatar = document.querySelector('.profile-pic-nav.avatar-nav');
  if (navAvatar) {
    const styles = window.getComputedStyle(navAvatar);
    const borderColor = styles.borderColor;
    console.log(`🎨 Color de borde en navegación: ${borderColor}`);
    console.log('✅ Indicador de avatar activo en navegación');
  } else {
    console.log('ℹ️ No hay avatar activo en navegación');
  }
  
  // Test 4: Verificar espaciado cuando hay avatar
  console.log('📏 Test 4: Verificando espaciado con avatar');
  const profileContainer = document.querySelector('.profile-container');
  if (profileContainer && avatarDisplay) {
    const styles = window.getComputedStyle(profileContainer);
    const paddingBottom = styles.paddingBottom;
    console.log(`📐 Padding bottom del contenedor: ${paddingBottom}`);
  }
  
  console.log('🏁 PRUEBAS DE INTEGRACIÓN COMPLETADAS');
};

// Función para simular compra de avatar
const simulateAvatarPurchase = () => {
  console.log('🛒 SIMULANDO COMPRA DE AVATAR');
  
  // Crear un canvas con las dimensiones correctas
  const canvas = document.createElement('canvas');
  canvas.width = 140;
  canvas.height = 250;
  const ctx = canvas.getContext('2d');
  
  // Dibujar un avatar de prueba
  ctx.fillStyle = '#2196f3';
  ctx.fillRect(0, 0, 140, 250);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('AVATAR', 70, 125);
  ctx.fillText('TEST', 70, 150);
  
  const dataURL = canvas.toDataURL('image/png');
  console.log('🎨 Avatar de prueba generado');
  console.log('📄 DataURL length:', dataURL.length);
  
  return dataURL;
};

// Función para verificar la funcionalidad de recarga
const testProfileReload = () => {
  console.log('🔄 PROBANDO RECARGA DE PERFIL');
  
  if (typeof window !== 'undefined' && (window as any).reloadProfileData) {
    console.log('✅ Función de recarga disponible');
    try {
      (window as any).reloadProfileData();
      console.log('✅ Recarga ejecutada exitosamente');
    } catch (error) {
      console.error('❌ Error en recarga:', error);
    }
  } else {
    console.log('❌ Función de recarga no disponible');
  }
};

// Ejecutar pruebas cuando el DOM esté listo
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testAvatarIntegration);
  } else {
    testAvatarIntegration();
  }
}

// Exportar funciones para uso manual
if (typeof window !== 'undefined') {
  window.testAvatarIntegration = testAvatarIntegration;
  window.simulateAvatarPurchase = simulateAvatarPurchase;
  window.testProfileReload = testProfileReload;
}

console.log('🧪 Test de integración de avatares cargado');
console.log('💡 Ejecuta testAvatarIntegration() para probar');
console.log('💡 Ejecuta simulateAvatarPurchase() para generar avatar de prueba');
console.log('💡 Ejecuta testProfileReload() para probar recarga');