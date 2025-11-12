// 🔍 VERIFICACIÓN COMPLETA DEL SISTEMA DE TOKENS Y FIREBASE
// Ejecutar en la consola del navegador (F12) cuando estés logueado

console.log('🔍 INICIANDO VERIFICACIÓN COMPLETA DEL SISTEMA...');

(async function verificacionCompleta() {
  const resultados = {
    firebase: { status: '❓', detalles: [] },
    tokens: { status: '❓', detalles: [] },
    usuario: { status: '❓', detalles: [] },
    sistema: { status: '❓', detalles: [] }
  };

  try {
    // ===== VERIFICACIÓN 1: FIREBASE =====
    console.log('\n🔥 VERIFICANDO FIREBASE...');
    
    try {
      const firebaseModule = await import('./lib/firebase.js');
      const { auth, db } = firebaseModule;
      
      // Verificar autenticación
      if (auth.currentUser) {
        resultados.firebase.detalles.push('✅ Usuario autenticado: ' + auth.currentUser.uid);
      } else {
        resultados.firebase.detalles.push('❌ No hay usuario autenticado');
        resultados.firebase.status = '❌';
      }
      
      // Verificar Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const testDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || 'test'));
      resultados.firebase.detalles.push('✅ Firestore conectado correctamente');
      
      resultados.firebase.status = '✅';
    } catch (error) {
      resultados.firebase.detalles.push('❌ Error Firebase: ' + error.message);
      resultados.firebase.status = '❌';
    }

    // ===== VERIFICACIÓN 2: SISTEMA DE TOKENS =====
    console.log('\n🪙 VERIFICANDO SISTEMA DE TOKENS...');
    
    try {
      const tokenModule = await import('./lib/tokenService.js');
      const { getUserTokens, checkTokenSystemHealth, getCacheStats } = tokenModule;
      
      if (!auth.currentUser) {
        throw new Error('No hay usuario para verificar tokens');
      }
      
      // Verificar tokens del usuario
      const tokenData = await getUserTokens(auth.currentUser.uid);
      resultados.tokens.detalles.push(`✅ Tokens actuales: ${tokenData.tokens.toLocaleString()}`);
      resultados.tokens.detalles.push(`✅ Último reclamo: ${new Date(tokenData.lastClaim).toLocaleString()}`);
      resultados.tokens.detalles.push(`✅ Seguidores: ${tokenData.followersCount}`);
      
      // Verificar salud del sistema
      const health = await checkTokenSystemHealth(auth.currentUser.uid);
      if (health.healthy) {
        resultados.tokens.detalles.push('✅ Sistema de tokens saludable');
      } else {
        resultados.tokens.detalles.push('⚠️ Problemas detectados:');
        health.issues.forEach(issue => {
          resultados.tokens.detalles.push('  - ' + issue);
        });
      }
      
      // Verificar cache
      const cacheStats = getCacheStats();
      resultados.tokens.detalles.push(`✅ Cache: ${cacheStats.size} entradas`);
      
      resultados.tokens.status = health.healthy ? '✅' : '⚠️';
    } catch (error) {
      resultados.tokens.detalles.push('❌ Error tokens: ' + error.message);
      resultados.tokens.status = '❌';
    }

    // ===== VERIFICACIÓN 3: DATOS DEL USUARIO =====
    console.log('\n👤 VERIFICANDO DATOS DEL USUARIO...');
    
    try {
      const userModule = await import('./lib/userService.js');
      const { getUserData } = userModule;
      
      const userData = await getUserData();
      if (userData) {
        resultados.usuario.detalles.push(`✅ Usuario: ${userData.username || 'Sin nombre'}`);
        resultados.usuario.detalles.push(`✅ Seguidores: ${userData.followers || 0}`);
        resultados.usuario.detalles.push(`✅ Siguiendo: ${userData.following || 0}`);
        resultados.usuario.detalles.push(`✅ Posts: ${userData.posts || 0}`);
        resultados.usuario.status = '✅';
      } else {
        resultados.usuario.detalles.push('❌ No se pudieron cargar datos del usuario');
        resultados.usuario.status = '❌';
      }
    } catch (error) {
      resultados.usuario.detalles.push('❌ Error usuario: ' + error.message);
      resultados.usuario.status = '❌';
    }

    // ===== VERIFICACIÓN 4: SISTEMA GENERAL =====
    console.log('\n🌐 VERIFICANDO SISTEMA GENERAL...');
    
    try {
      // Verificar si el monitoreo está disponible
      try {
        const monitorModule = await import('./lib/tokenMonitor.js');
        const { runSystemDiagnostic } = monitorModule;
        
        const diagnostic = await runSystemDiagnostic();
        resultados.sistema.detalles.push(`✅ Estado del sistema: ${diagnostic.overall}`);
        resultados.sistema.detalles.push(`✅ Usuarios totales: ${diagnostic.metrics.totalUsers}`);
        resultados.sistema.detalles.push(`✅ Tokens en circulación: ${diagnostic.metrics.totalTokensInCirculation.toLocaleString()}`);
        resultados.sistema.detalles.push(`✅ Reclamos hoy: ${diagnostic.metrics.dailyClaimsToday}`);
        resultados.sistema.detalles.push(`✅ Errores hoy: ${diagnostic.metrics.failedOperationsToday}`);
        
        resultados.sistema.status = diagnostic.overall === 'healthy' ? '✅' : 
                                   diagnostic.overall === 'warning' ? '⚠️' : '❌';
      } catch (monitorError) {
        resultados.sistema.detalles.push('⚠️ Sistema de monitoreo no disponible');
        resultados.sistema.status = '⚠️';
      }
      
      // Verificar conexión de red
      if (navigator.onLine) {
        resultados.sistema.detalles.push('✅ Conexión a internet activa');
      } else {
        resultados.sistema.detalles.push('❌ Sin conexión a internet');
        resultados.sistema.status = '❌';
      }
      
    } catch (error) {
      resultados.sistema.detalles.push('❌ Error sistema: ' + error.message);
      resultados.sistema.status = '❌';
    }

    // ===== MOSTRAR RESULTADOS =====
    console.log('\n📊 RESULTADOS DE LA VERIFICACIÓN:');
    console.log('================================');
    
    Object.entries(resultados).forEach(([categoria, resultado]) => {
      console.log(`\n${resultado.status} ${categoria.toUpperCase()}:`);
      resultado.detalles.forEach(detalle => {
        console.log(`  ${detalle}`);
      });
    });

    // ===== RESUMEN GENERAL =====
    const todosSaludables = Object.values(resultados).every(r => r.status === '✅');
    const hayProblemas = Object.values(resultados).some(r => r.status === '❌');
    
    let estadoGeneral, mensaje, color;
    if (todosSaludables) {
      estadoGeneral = '✅ SISTEMA COMPLETAMENTE SALUDABLE';
      mensaje = 'Todos los componentes funcionan correctamente';
      color = '#10b981';
    } else if (hayProblemas) {
      estadoGeneral = '❌ PROBLEMAS CRÍTICOS DETECTADOS';
      mensaje = 'Se requiere atención inmediata';
      color = '#ef4444';
    } else {
      estadoGeneral = '⚠️ ADVERTENCIAS DETECTADAS';
      mensaje = 'El sistema funciona pero necesita monitoreo';
      color = '#f59e0b';
    }

    console.log(`\n🎯 ESTADO GENERAL: ${estadoGeneral}`);
    console.log(`💡 ${mensaje}`);

    // ===== CREAR FUNCIONES DE REPARACIÓN =====
    window.REPARACION_RAPIDA = {
      // Reparar tokens
      repararTokens: async () => {
        try {
          console.log('🔧 Reparando sistema de tokens...');
          const { ensureUserTokensExist, clearTokenCache } = await import('./lib/tokenService.js');
          
          clearTokenCache();
          await ensureUserTokensExist(auth.currentUser.uid, 0);
          
          console.log('✅ Sistema de tokens reparado');
          alert('✅ Sistema de tokens reparado exitosamente');
        } catch (error) {
          console.error('❌ Error reparando tokens:', error);
          alert('❌ Error reparando tokens: ' + error.message);
        }
      },

      // Reiniciar Firebase
      reiniciarFirebase: async () => {
        try {
          console.log('🔧 Reiniciando conexión Firebase...');
          const { resetFirestoreConnection } = await import('./lib/firebase.js');
          
          await resetFirestoreConnection();
          
          console.log('✅ Firebase reiniciado');
          alert('✅ Firebase reiniciado exitosamente');
        } catch (error) {
          console.error('❌ Error reiniciando Firebase:', error);
          alert('❌ Error reiniciando Firebase: ' + error.message);
        }
      },

      // Verificación rápida
      verificarRapido: () => {
        verificacionCompleta();
      },

      // Agregar tokens de emergencia
      tokensEmergencia: async (cantidad = 100000) => {
        try {
          const { addTokens } = await import('./lib/tokenService.js');
          const result = await addTokens(auth.currentUser.uid, cantidad, 'emergency_repair');
          
          if (result.success) {
            console.log(`✅ ${cantidad.toLocaleString()} tokens de emergencia agregados`);
            alert(`✅ ${cantidad.toLocaleString()} tokens agregados. Total: ${result.totalTokens.toLocaleString()}`);
          } else {
            alert('❌ Error agregando tokens de emergencia');
          }
        } catch (error) {
          console.error('❌ Error:', error);
          alert('❌ Error: ' + error.message);
        }
      },

      // Mostrar ayuda
      ayuda: () => {
        console.log(`
🆘 FUNCIONES DE REPARACIÓN RÁPIDA:

REPARACION_RAPIDA.repararTokens()        - Reparar sistema de tokens
REPARACION_RAPIDA.reiniciarFirebase()    - Reiniciar conexión Firebase
REPARACION_RAPIDA.verificarRapido()      - Ejecutar verificación nuevamente
REPARACION_RAPIDA.tokensEmergencia()     - Agregar tokens de emergencia
REPARACION_RAPIDA.ayuda()                - Mostrar esta ayuda

Ejemplo:
REPARACION_RAPIDA.tokensEmergencia(500000)  // Agregar 500K tokens
        `);
      }
    };

    // ===== MOSTRAR MENSAJE FINAL =====
    const resumenFinal = `
🔍 VERIFICACIÓN COMPLETADA

${estadoGeneral}
${mensaje}

📊 Resumen:
- Firebase: ${resultados.firebase.status}
- Tokens: ${resultados.tokens.status}  
- Usuario: ${resultados.usuario.status}
- Sistema: ${resultados.sistema.status}

💡 Funciones disponibles: REPARACION_RAPIDA.ayuda()
    `;

    console.log(resumenFinal);
    alert(resumenFinal);

    // Aplicar estilo visual al resumen
    console.log('%c' + estadoGeneral, `color: ${color}; font-size: 16px; font-weight: bold;`);

  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN VERIFICACIÓN:', error);
    alert('❌ Error crítico en verificación: ' + error.message);
  }
})();

console.log('🔍 Verificación iniciada. Espera los resultados...');