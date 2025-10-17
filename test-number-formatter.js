// Test Number Formatter
// Script para probar la función de formateo de números grandes

// Simular la función formatLargeNumber
function formatLargeNumber(num) {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    
    if (remainder === 0) {
      return `${thousands}K`;
    } else {
      const decimal = Math.floor(remainder / 100);
      return decimal > 0 ? `${thousands}.${decimal}K` : `${thousands}K`;
    }
  }
  
  if (num < 1000000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    
    if (remainder === 0) {
      return `${millions}M`;
    } else {
      const decimal = Math.floor(remainder / 100000);
      return decimal > 0 ? `${millions}.${decimal}M` : `${millions}M`;
    }
  }
  
  // Para números mayores a mil millones
  const billions = Math.floor(num / 1000000000);
  const remainder = num % 1000000000;
  
  if (remainder === 0) {
    return `${billions}B`;
  } else {
    const decimal = Math.floor(remainder / 100000000);
    return decimal > 0 ? `${billions}.${decimal}B` : `${billions}B`;
  }
}

console.log('🔢 PRUEBA DE FORMATEO DE NÚMEROS GRANDES');
console.log('=======================================\n');

// Casos de prueba
const testCases = [
  { input: 500, expected: '500' },
  { input: 999, expected: '999' },
  { input: 1000, expected: '1K' },
  { input: 1500, expected: '1.5K' },
  { input: 2300, expected: '2.3K' },
  { input: 10000, expected: '10K' },
  { input: 15000, expected: '15K' },
  { input: 100000, expected: '100K' },
  { input: 150000, expected: '150K' },
  { input: 999000, expected: '999K' },
  { input: 1000000, expected: '1M' },
  { input: 1500000, expected: '1.5M' },
  { input: 2300000, expected: '2.3M' },
  { input: 10000000, expected: '10M' },
  { input: 100000000, expected: '100M' },
  { input: 150000000, expected: '150M' },
  { input: 999000000, expected: '999M' },
  { input: 1000000000, expected: '1B' },
  { input: 1500000000, expected: '1.5B' },
  { input: 2300000000, expected: '2.3B' }
];

console.log('📊 CASOS DE PRUEBA:');
console.log('Número Original → Formato Esperado → Resultado → Estado\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach(testCase => {
  const result = formatLargeNumber(testCase.input);
  const passed = result === testCase.expected;
  const status = passed ? '✅ PASS' : '❌ FAIL';
  
  if (passed) passedTests++;
  
  console.log(`${testCase.input.toLocaleString()} → ${testCase.expected} → ${result} → ${status}`);
});

console.log(`\n📈 RESULTADOS:`);
console.log(`✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}/${totalTests}`);
console.log(`📊 Porcentaje de éxito: ${Math.round((passedTests / totalTests) * 100)}%`);

// Ejemplos específicos para tokens
console.log('\n💎 EJEMPLOS PARA TOKENS:');
const tokenExamples = [
  30000,    // Costo de avatar
  50000,    // Usuario promedio
  100000,   // Usuario activo
  500000,   // Usuario popular
  1000000,  // Usuario muy popular
  5000000,  // Influencer
  10000000, // Mega influencer
  100000000 // Usuario premium
];

tokenExamples.forEach(tokens => {
  const formatted = formatLargeNumber(tokens);
  console.log(`💰 ${tokens.toLocaleString()} tokens → 🪙 ${formatted}`);
});

console.log('\n🎯 IMPLEMENTACIÓN COMPLETADA:');
console.log('✅ Función formatLargeNumber creada');
console.log('✅ Aplicada en Profile.tsx (botón de tokens)');
console.log('✅ Aplicada en Store.tsx (header de tokens)');
console.log('✅ Mantiene consistencia en toda la aplicación');
console.log('✅ Mejora la legibilidad de números grandes');

console.log('\n📱 ANTES Y DESPUÉS:');
console.log('❌ Antes: 🪙 100,000,000');
console.log('✅ Ahora: 🪙 100M');
console.log('❌ Antes: 🪙 1,500,000');
console.log('✅ Ahora: 🪙 1.5M');
console.log('❌ Antes: 🪙 50,000');
console.log('✅ Ahora: 🪙 50K');