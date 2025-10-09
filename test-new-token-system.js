// Test del nuevo sistema de tokens
function calculateDailyTokens(followersCount) {
  const baseTokens = 10;
  const bonusTokens = Math.floor(followersCount / 500) * 50;
  return baseTokens + bonusTokens;
}

function testTokenCalculation() {
  console.log('=== SISTEMA DE TOKENS ===');
  console.log('Base: 10 tokens diarios');
  console.log('Bonus: +50 tokens por cada 500 seguidores');
  console.log('');
  
  const testCases = [0, 100, 499, 500, 750, 1000, 1500, 2000];
  
  testCases.forEach(followers => {
    const dailyTokens = calculateDailyTokens(followers);
    const milestones = Math.floor(followers / 500);
    console.log(`${followers} seguidores = ${dailyTokens} tokens diarios (${milestones} hitos)`);
  });
  
  console.log('');
  console.log('=== BONUS INMEDIATOS ===');
  console.log('Al alcanzar 500 seguidores: +50 tokens');
  console.log('Al alcanzar 1000 seguidores: +50 tokens');
  console.log('Al alcanzar 1500 seguidores: +50 tokens');
}

testTokenCalculation();