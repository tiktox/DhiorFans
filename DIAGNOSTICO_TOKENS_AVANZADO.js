// 🏥 DIAGNÓSTICO Y REPARACIÓN AVANZADA DEL SISTEMA DE TOKENS
// Ejecutar en la consola del navegador (F12) cuando estés logueado

console.log('🏥 INICIANDO DIAGNÓSTICO AVANZADO DEL SISTEMA DE TOKENS...');

(async function diagnosticoAvanzado() {
  try {
    // Importar módulos necesarios
    const tokenModule = await import('./lib/tokenService.js');
    const monitorModule = await import('./lib/tokenMonitor.js');
    const firebaseModule = await import('./lib/firebase.js');
    
    const { 
      getUserTokens, 
      checkTokenSystemHealth, 
      getCacheStats, 
      clearTokenCache,
      addTokens,
      claimDailyTokens,
      canClaimTokens
    } = tokenModule;
    
    const {
      runSystemDiagnostic,
      analyzeUser,
      autoRepairSystem,
      generateSystemReport
    } = monitorModule;
    
    const { auth } = firebaseModule;
    
    if (!auth.currentUser) {
      console.error('❌ No hay usuario logueado');
      alert('❌ Debes estar logueado para ejecutar el diagnóstico');
      return;
    }
    
    const userId = auth.currentUser.uid;
    console.log('👤 Usuario actual:', userId);
    
    // FASE 1: DIAGNÓSTICO INDIVIDUAL DEL USUARIO
    console.log('\n🔍 FASE 1: DIAGNÓSTICO INDIVIDUAL');
    console.log('================================');
    
    const userHealth = await checkTokenSystemHealth(userId);
    console.log('🏥 Salud del usuario:', userHealth);
    
    const userAnalysis = await analyzeUser(userId);
    console.log('📊 Análisis detallado:', userAnalysis);
    
    const currentTokens = await getUserTokens(userId);
    console.log('💰 Tokens actuales:', currentTokens);
    
    // FASE 2: DIAGNÓSTICO DEL SISTEMA COMPLETO
    console.log('\n🌐 FASE 2: DIAGNÓSTICO DEL SISTEMA');
    console.log('==================================');
    
    const systemDiagnostic = await runSystemDiagnostic();
    console.log('🏥 Estado del sistema:', systemDiagnostic.overall);
    console.log('📊 Métricas del sistema:', systemDiagnostic.metrics);
    
    if (systemDiagnostic.issues.length > 0) {
      console.log('⚠️ Problemas detectados:');
      systemDiagnostic.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        console.log(`   💡 Recomendación: ${issue.recommendation}`);
      });
    }
    
    // FASE 3: VERIFICACIÓN DE CACHE
    console.log('\n💾 FASE 3: VERIFICACIÓN DE CACHE');
    console.log('================================');
    
    const cacheStats = getCacheStats();
    console.log('📈 Estadísticas de cache:', cacheStats);
    
    // FASE 4: PRUEBAS FUNCIONALES
    console.log('\n🧪 FASE 4: PRUEBAS FUNCIONALES');
    console.log('==============================');
    
    // Probar reclamo de tokens
    const canClaim = canClaimTokens(currentTokens.lastClaim);
    console.log('⏰ ¿Puede reclamar tokens?', canClaim);
    
    if (canClaim) {
      console.log('🎯 Probando reclamo de tokens...');
      const claimResult = await claimDailyTokens(userId, currentTokens.followersCount);
      console.log('📝 Resultado del reclamo:', claimResult);
    }
    
    // FASE 5: GENERAR REPORTE COMPLETO
    console.log('\n📋 FASE 5: GENERANDO REPORTE');
    console.log('============================');
    
    const report = await generateSystemReport();
    console.log('📄 REPORTE COMPLETO:');
    console.log(report);
    
    // FASE 6: OPCIONES DE REPARACIÓN
    console.log('\n🔧 FASE 6: OPCIONES DE REPARACIÓN');
    console.log('=================================');
    
    let needsRepair = false;
    
    if (!userHealth.healthy) {
      console.log('⚠️ El usuario necesita reparación');
      needsRepair = true;
    }
    
    if (systemDiagnostic.overall === 'critical' || systemDiagnostic.overall === 'warning') {
      console.log('⚠️ El sistema necesita reparación');
      needsRepair = true;
    }
    
    if (needsRepair) {
      const shouldRepair = confirm('🔧 Se detectaron problemas. ¿Ejecutar reparación automática?');
      
      if (shouldRepair) {
        console.log('🔧 Ejecutando reparación automática...');
        const repairResult = await autoRepairSystem();
        console.log('📊 Resultado de la reparación:', repairResult);
        
        if (repairResult.repairsSuccessful > 0) {
          alert(`✅ Reparación completada: ${repairResult.repairsSuccessful}/${repairResult.repairsAttempted} exitosas`);
        } else {
          alert('❌ La reparación automática falló. Se requiere intervención manual.');
        }
      }
    }
    
    // FASE 7: FUNCIONES DE EMERGENCIA
    console.log('\n🚨 FASE 7: FUNCIONES DE EMERGENCIA DISPONIBLES');
    console.log('===============================================');
    
    // Crear funciones globales para uso manual
    window.TOKEN_EMERGENCY = {
      // Limpiar cache
      clearCache: () => {
        clearTokenCache(userId);
        console.log('🧹 Cache limpiado para usuario:', userId);
        alert('✅ Cache limpiado exitosamente');
      },
      
      // Agregar tokens de emergencia
      addEmergencyTokens: async (amount = 100000) => {
        try {
          const result = await addTokens(userId, amount, 'emergency_grant');
          if (result.success) {
            console.log(`💰 Tokens de emergencia agregados: +${amount}`);
            alert(`✅ ${amount.toLocaleString()} tokens de emergencia agregados`);
            location.reload();
          } else {
            alert('❌ Error agregando tokens de emergencia');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('❌ Error: ' + error.message);
        }
      },
      
      // Forzar reclamo diario
      forceClaimDaily: async () => {
        try {
          // Temporalmente limpiar lastClaim para permitir reclamo
          const { setDoc, doc } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase.js');
          
          await setDoc(doc(db, 'tokens', userId), {
            ...currentTokens,
            lastClaim: 0
          });
          
          const result = await claimDailyTokens(userId, currentTokens.followersCount);
          if (result.success) {
            console.log('🎯 Reclamo forzado exitoso:', result);
            alert(`✅ Reclamo forzado: +${result.tokensEarned} tokens`);
            location.reload();
          } else {
            alert('❌ Error en reclamo forzado');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('❌ Error: ' + error.message);
        }
      },
      
      // Ejecutar diagnóstico completo nuevamente
      runDiagnostic: () => {
        diagnosticoAvanzado();
      },
      
      // Mostrar ayuda
      help: () => {
        console.log(`
🆘 FUNCIONES DE EMERGENCIA DISPONIBLES:

TOKEN_EMERGENCY.clearCache()           - Limpiar cache de tokens
TOKEN_EMERGENCY.addEmergencyTokens()   - Agregar 100K tokens de emergencia
TOKEN_EMERGENCY.forceClaimDaily()      - Forzar reclamo diario
TOKEN_EMERGENCY.runDiagnostic()        - Ejecutar diagnóstico nuevamente
TOKEN_EMERGENCY.help()                 - Mostrar esta ayuda

Ejemplo de uso:
TOKEN_EMERGENCY.addEmergencyTokens(500000)  // Agregar 500K tokens
        `);
      }
    };
    
    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    console.log('========================');
    console.log('💡 Funciones de emergencia disponibles en: TOKEN_EMERGENCY');
    console.log('💡 Ejecuta TOKEN_EMERGENCY.help() para ver todas las opciones');
    
    // Mostrar resumen final
    const summary = `
🏥 RESUMEN DEL DIAGNÓSTICO:
- Usuario: ${userHealth.healthy ? '✅ Saludable' : '❌ Necesita atención'}
- Sistema: ${systemDiagnostic.overall === 'healthy' ? '✅ Saludable' : '⚠️ ' + systemDiagnostic.overall}
- Tokens actuales: ${currentTokens.tokens.toLocaleString()}
- Cache: ${cacheStats.size} entradas
- Problemas: ${systemDiagnostic.issues.length}
    `;
    
    console.log(summary);
    alert(summary + '\n\n💡 Revisa la consola para detalles completos');
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN DIAGNÓSTICO:', error);
    alert('❌ Error crítico en diagnóstico: ' + error.message);
  }
})();

console.log('🏥 Diagnóstico avanzado iniciado. Revisa los resultados arriba...');