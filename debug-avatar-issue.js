// Debug Avatar Purchase Issue
// Script para identificar problemas específicos en el flujo de compra de avatares

console.log('🔍 DEPURACIÓN DEL PROBLEMA DE AVATARES');
console.log('=====================================\n');

// Posibles causas del problema
const possibleIssues = [
  {
    id: 1,
    title: 'Problema de Autenticación',
    description: 'El usuario no está autenticado correctamente',
    symptoms: ['auth.currentUser es null', 'Error de permisos en Firebase'],
    solution: 'Verificar que el usuario esté logueado antes de comprar',
    code: `
// En Store.tsx, agregar verificación:
useEffect(() => {
  console.log('🔐 Estado de autenticación:', auth.currentUser);
  if (!auth.currentUser) {
    console.error('❌ Usuario no autenticado');
  }
}, []);`
  },
  {
    id: 2,
    title: 'Error en spendTokens',
    description: 'La función spendTokens falla al deducir tokens',
    symptoms: ['Error en confirmPurchase', 'Tokens no se deducen'],
    solution: 'Verificar conexión a Firestore y permisos',
    code: `
// Agregar logs en confirmPurchase:
const confirmPurchase = async () => {
  console.log('💰 Iniciando compra, tokens actuales:', userTokens);
  try {
    const result = await spendTokens(auth.currentUser.uid, 30000);
    console.log('💰 Resultado spendTokens:', result);
    // ... resto del código
  } catch (error) {
    console.error('❌ Error en spendTokens:', error);
  }
};`
  },
  {
    id: 3,
    title: 'Problema con handleFileSelect',
    description: 'La validación de dimensiones falla',
    symptoms: ['Alert de dimensiones incorrectas', 'Imagen no se procesa'],
    solution: 'Verificar que la imagen sea exactamente 140x250',
    code: `
// Agregar logs en handleFileSelect:
const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  console.log('📁 Archivo seleccionado:', file);
  
  if (file && file.type === 'image/png') {
    const img = new Image();
    img.onload = () => {
      console.log('📐 Dimensiones:', img.width, 'x', img.height);
      if (img.width === 140 && img.height === 250) {
        console.log('✅ Dimensiones correctas');
        // ... resto del código
      } else {
        console.log('❌ Dimensiones incorrectas');
        alert('El avatar debe tener exactamente 140x250 píxeles');
      }
    };
    img.src = URL.createObjectURL(file);
  }
};`
  },
  {
    id: 4,
    title: 'Error en handleAddAvatar',
    description: 'Falla al subir o guardar el avatar',
    symptoms: ['Error al guardar avatar', 'Avatar no aparece en colección'],
    solution: 'Verificar uploadProfilePicture y saveUserData',
    code: `
// Agregar logs detallados en handleAddAvatar:
const handleAddAvatar = async () => {
  console.log('🖼️ Iniciando guardado de avatar');
  console.log('🖼️ purchasedAvatar:', purchasedAvatar ? 'Presente' : 'Ausente');
  console.log('🔐 Usuario:', auth.currentUser?.uid);
  
  try {
    // Convertir DataURL a blob
    const response = await fetch(purchasedAvatar);
    const blob = await response.blob();
    console.log('📦 Blob creado:', blob.size, 'bytes');
    
    const file = new File([blob], \`avatar_\${Date.now()}.png\`, { type: 'image/png' });
    console.log('📁 File creado:', file.name);
    
    // Subir archivo
    console.log('⬆️ Subiendo archivo...');
    const avatarUrl = await uploadProfilePicture(file, auth.currentUser.uid);
    console.log('✅ Avatar subido:', avatarUrl);
    
    // Obtener datos actuales
    console.log('📊 Obteniendo datos del usuario...');
    const userData = await getUserData();
    console.log('📊 Datos actuales:', userData);
    
    const currentAvatars = userData.avatars || [];
    const updatedAvatars = [...currentAvatars, avatarUrl];
    console.log('📊 Avatares actualizados:', updatedAvatars);
    
    // Guardar datos
    console.log('💾 Guardando datos...');
    await saveUserData({ avatars: updatedAvatars });
    console.log('✅ Datos guardados');
    
    setUserAvatars(updatedAvatars);
    console.log('✅ Estado local actualizado');
    
  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('❌ Stack trace:', error.stack);
  }
};`
  },
  {
    id: 5,
    title: 'Problema de Permisos Firebase',
    description: 'Las reglas de Firebase bloquean la operación',
    symptoms: ['permission-denied errors', 'Operaciones fallan silenciosamente'],
    solution: 'Verificar y redesplegar reglas de Firestore y Storage',
    code: `
// Verificar reglas en firestore.rules:
match /users/{userId} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == userId;
}

// Verificar reglas en storage.rules:
match /profile/{userId}/{fileName} {
  allow write: if request.auth != null && request.auth.uid == userId;
}`
  },
  {
    id: 6,
    title: 'Estado de React no se actualiza',
    description: 'Los avatares no aparecen en la UI después de guardar',
    symptoms: ['Avatar guardado pero no visible', 'userAvatars no se actualiza'],
    solution: 'Verificar actualización de estado y re-renderizado',
    code: `
// Verificar que el estado se actualice correctamente:
useEffect(() => {
  console.log('🔄 userAvatars actualizado:', userAvatars);
}, [userAvatars]);

// En handleAddAvatar, después de guardar:
setUserAvatars(updatedAvatars);
console.log('🔄 Estado actualizado a:', updatedAvatars);`
  }
];

// Función para generar código de depuración
function generateDebugCode() {
  console.log('📝 CÓDIGO DE DEPURACIÓN PARA AGREGAR:\n');
  
  console.log('1️⃣ Agregar al inicio del componente Store:');
  console.log(`
useEffect(() => {
  console.log('🔍 DEBUG - Estado inicial:');
  console.log('🔐 Usuario autenticado:', auth.currentUser?.uid);
  console.log('💰 Tokens del usuario:', userTokens);
  console.log('🖼️ Avatares actuales:', userAvatars);
}, []);
`);

  console.log('2️⃣ Modificar confirmPurchase para agregar logs:');
  console.log(`
const confirmPurchase = async () => {
  console.log('🛒 INICIO DE COMPRA');
  console.log('💰 Tokens antes:', userTokens);
  console.log('🔐 Usuario ID:', auth.currentUser?.uid);
  
  if (!auth.currentUser) {
    console.error('❌ Usuario no autenticado');
    return;
  }
  
  setShowWarning(false);
  setIsAnimating(true);
  
  try {
    const result = await spendTokens(auth.currentUser.uid, 30000);
    console.log('💰 Resultado spendTokens:', result);
    
    if (result.success) {
      onTokensUpdate(result.remainingTokens);
      console.log('✅ Tokens actualizados:', result.remainingTokens);
      
      setTimeout(() => {
        setIsAnimating(false);
        console.log('📁 Abriendo selector de archivos...');
        fileInputRef.current?.click();
      }, 2000);
    } else {
      console.error('❌ spendTokens falló:', result);
    }
  } catch (error) {
    console.error('❌ Error en confirmPurchase:', error);
    setIsAnimating(false);
  }
};
`);

  console.log('3️⃣ Modificar handleAddAvatar para agregar logs detallados:');
  console.log(`
const handleAddAvatar = async () => {
  console.log('🖼️ INICIO GUARDADO AVATAR');
  console.log('🖼️ purchasedAvatar presente:', !!purchasedAvatar);
  console.log('🔐 Usuario ID:', auth.currentUser?.uid);
  
  if (!purchasedAvatar || !auth.currentUser) {
    console.error('❌ Datos faltantes:', { purchasedAvatar: !!purchasedAvatar, user: !!auth.currentUser });
    return;
  }
  
  try {
    console.log('📦 Convirtiendo DataURL a blob...');
    const response = await fetch(purchasedAvatar);
    const blob = await response.blob();
    console.log('📦 Blob creado:', blob.size, 'bytes', blob.type);
    
    const file = new File([blob], \`avatar_\${Date.now()}.png\`, { type: 'image/png' });
    console.log('📁 File creado:', file.name, file.size, 'bytes');
    
    console.log('⬆️ Subiendo a Firebase Storage...');
    const avatarUrl = await uploadProfilePicture(file, auth.currentUser.uid);
    console.log('✅ Avatar subido exitosamente:', avatarUrl);
    
    console.log('📊 Obteniendo datos actuales del usuario...');
    const userData = await getUserData();
    console.log('📊 Datos del usuario:', userData);
    
    const currentAvatars = userData.avatars || [];
    console.log('📊 Avatares actuales:', currentAvatars);
    
    const updatedAvatars = [...currentAvatars, avatarUrl];
    console.log('📊 Avatares después de agregar:', updatedAvatars);
    
    console.log('💾 Guardando datos en Firestore...');
    await saveUserData({ avatars: updatedAvatars });
    console.log('✅ Datos guardados en Firestore');
    
    console.log('🔄 Actualizando estado local...');
    setUserAvatars(updatedAvatars);
    console.log('✅ Estado local actualizado');
    
    setShowAvatarActions(false);
    setPurchasedAvatar(null);
    
    console.log('🎉 AVATAR AGREGADO EXITOSAMENTE');
    alert('¡Avatar añadido a tu colección!');
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO en handleAddAvatar:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    alert('Error al guardar el avatar: ' + error.message);
  }
};
`);
}

// Función para verificar configuración de Firebase
function checkFirebaseConfig() {
  console.log('🔥 VERIFICACIÓN DE CONFIGURACIÓN FIREBASE:\n');
  
  const checks = [
    '✅ Verificar que firebase.js esté configurado correctamente',
    '✅ Verificar que las reglas de Firestore estén desplegadas',
    '✅ Verificar que las reglas de Storage estén desplegadas',
    '✅ Verificar que el usuario tenga permisos de escritura',
    '✅ Verificar conexión a internet',
    '✅ Verificar que no haya errores en la consola del navegador'
  ];
  
  checks.forEach(check => console.log(check));
}

// Función principal
function main() {
  console.log('🎯 POSIBLES CAUSAS DEL PROBLEMA:\n');
  
  possibleIssues.forEach(issue => {
    console.log(`${issue.id}️⃣ ${issue.title}`);
    console.log(`   📝 ${issue.description}`);
    console.log(`   🔍 Síntomas: ${issue.symptoms.join(', ')}`);
    console.log(`   💡 Solución: ${issue.solution}\n`);
  });
  
  generateDebugCode();
  checkFirebaseConfig();
  
  console.log('\n🚀 PASOS PARA DEPURAR:');
  console.log('1. Agregar el código de depuración al componente Store.tsx');
  console.log('2. Abrir las herramientas de desarrollador del navegador');
  console.log('3. Intentar comprar un avatar');
  console.log('4. Revisar los logs en la consola');
  console.log('5. Identificar en qué paso falla el proceso');
  console.log('6. Aplicar la solución correspondiente');
  
  console.log('\n📋 CHECKLIST DE VERIFICACIÓN:');
  console.log('□ Usuario autenticado (auth.currentUser no es null)');
  console.log('□ Usuario tiene suficientes tokens (≥ 30,000)');
  console.log('□ Archivo seleccionado es PNG');
  console.log('□ Dimensiones del archivo son exactamente 140x250');
  console.log('□ No hay errores en spendTokens');
  console.log('□ No hay errores en uploadProfilePicture');
  console.log('□ No hay errores en saveUserData');
  console.log('□ Estado userAvatars se actualiza correctamente');
  console.log('□ Avatar aparece en la sección "Tus Avatares"');
}

// Ejecutar
main();