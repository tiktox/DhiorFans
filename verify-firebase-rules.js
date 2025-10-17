// Verificar reglas de Firebase
// Este script ayuda a verificar que las reglas estén correctamente configuradas

const fs = require('fs');
const path = require('path');

console.log('🔥 VERIFICACIÓN DE REGLAS DE FIREBASE');
console.log('====================================\n');

// Leer reglas de Firestore
function checkFirestoreRules() {
  console.log('📋 REGLAS DE FIRESTORE:');
  
  try {
    const rulesPath = path.join(__dirname, 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    console.log('✅ Archivo firestore.rules encontrado');
    
    // Verificar reglas específicas para usuarios
    if (rules.includes('match /users/{userId}')) {
      console.log('✅ Reglas para /users/{userId} encontradas');
      
      if (rules.includes('allow write: if request.auth != null')) {
        console.log('✅ Permisos de escritura para usuarios autenticados');
      } else {
        console.log('⚠️  Verificar permisos de escritura para usuarios');
      }
    } else {
      console.log('❌ Reglas para usuarios no encontradas');
    }
    
    // Verificar reglas para tokens
    if (rules.includes('match /tokens/{userId}')) {
      console.log('✅ Reglas para /tokens/{userId} encontradas');
    } else {
      console.log('❌ Reglas para tokens no encontradas');
    }
    
  } catch (error) {
    console.log('❌ Error leyendo firestore.rules:', error.message);
  }
  
  console.log('');
}

// Leer reglas de Storage
function checkStorageRules() {
  console.log('💾 REGLAS DE STORAGE:');
  
  try {
    const rulesPath = path.join(__dirname, 'storage.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    console.log('✅ Archivo storage.rules encontrado');
    
    // Verificar reglas para perfiles
    if (rules.includes('match /profile/{userId}/{fileName}')) {
      console.log('✅ Reglas para /profile/{userId}/{fileName} encontradas');
      
      if (rules.includes('allow write: if request.auth != null && request.auth.uid == userId')) {
        console.log('✅ Permisos de escritura correctos para perfiles');
      } else {
        console.log('⚠️  Verificar permisos de escritura para perfiles');
      }
    } else {
      console.log('❌ Reglas para perfiles no encontradas');
    }
    
    // Verificar lectura pública
    if (rules.includes('allow read: if true')) {
      console.log('✅ Lectura pública habilitada');
    } else {
      console.log('⚠️  Verificar permisos de lectura');
    }
    
  } catch (error) {
    console.log('❌ Error leyendo storage.rules:', error.message);
  }
  
  console.log('');
}

// Verificar configuración de Firebase
function checkFirebaseConfig() {
  console.log('⚙️  CONFIGURACIÓN DE FIREBASE:');
  
  try {
    const configPath = path.join(__dirname, 'lib', 'firebase.ts');
    const config = fs.readFileSync(configPath, 'utf8');
    
    console.log('✅ Archivo firebase.ts encontrado');
    
    if (config.includes('initializeApp')) {
      console.log('✅ Firebase App inicializada');
    }
    
    if (config.includes('getFirestore')) {
      console.log('✅ Firestore configurado');
    }
    
    if (config.includes('getStorage')) {
      console.log('✅ Storage configurado');
    }
    
    if (config.includes('getAuth')) {
      console.log('✅ Auth configurado');
    }
    
  } catch (error) {
    console.log('❌ Error leyendo firebase.ts:', error.message);
  }
  
  console.log('');
}

// Verificar archivos de despliegue
function checkDeploymentFiles() {
  console.log('🚀 ARCHIVOS DE DESPLIEGUE:');
  
  const deployFiles = [
    'firebase.json',
    'firestore.indexes.json',
    '.firebaserc'
  ];
  
  deployFiles.forEach(file => {
    try {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} encontrado`);
      } else {
        console.log(`❌ ${file} no encontrado`);
      }
    } catch (error) {
      console.log(`❌ Error verificando ${file}:`, error.message);
    }
  });
  
  console.log('');
}

// Comandos de despliegue
function showDeploymentCommands() {
  console.log('📝 COMANDOS DE DESPLIEGUE:');
  console.log('');
  console.log('Para desplegar las reglas de Firestore:');
  console.log('   firebase deploy --only firestore:rules');
  console.log('');
  console.log('Para desplegar las reglas de Storage:');
  console.log('   firebase deploy --only storage');
  console.log('');
  console.log('Para desplegar todo:');
  console.log('   firebase deploy');
  console.log('');
  console.log('Para verificar el proyecto actual:');
  console.log('   firebase projects:list');
  console.log('   firebase use --add');
  console.log('');
}

// Checklist de verificación
function showChecklist() {
  console.log('📋 CHECKLIST DE VERIFICACIÓN:');
  console.log('');
  console.log('□ Reglas de Firestore desplegadas');
  console.log('□ Reglas de Storage desplegadas');
  console.log('□ Usuario autenticado en la aplicación');
  console.log('□ Conexión a internet estable');
  console.log('□ Proyecto Firebase correcto seleccionado');
  console.log('□ Permisos de escritura en /users/{userId}');
  console.log('□ Permisos de escritura en /profile/{userId}');
  console.log('□ Permisos de lectura pública habilitados');
  console.log('');
}

// Función principal
function main() {
  checkFirestoreRules();
  checkStorageRules();
  checkFirebaseConfig();
  checkDeploymentFiles();
  showDeploymentCommands();
  showChecklist();
  
  console.log('🎯 PRÓXIMOS PASOS:');
  console.log('1. Verificar que las reglas estén desplegadas');
  console.log('2. Probar el flujo de compra de avatar');
  console.log('3. Revisar logs en la consola del navegador');
  console.log('4. Verificar que el usuario esté autenticado');
  console.log('5. Confirmar que el usuario tenga suficientes tokens');
}

// Ejecutar
main();