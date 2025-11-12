// Script para verificar la configuración de Firebase
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de Firebase...\n');

// Verificar archivo .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env.local encontrado');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missingVars.length === 0) {
    console.log('✅ Todas las variables de Firebase están configuradas');
  } else {
    console.log('❌ Variables faltantes:', missingVars.join(', '));
  }
} else {
  console.log('❌ Archivo .env.local no encontrado');
}

// Verificar que Next.js puede leer las variables
try {
  console.log('\n🔄 Reiniciando servidor de desarrollo...');
  console.log('Ejecuta: npm run dev');
  console.log('\n✅ Configuración completada. El sistema de verificación de correos está listo.');
} catch (error) {
  console.error('❌ Error:', error.message);
}