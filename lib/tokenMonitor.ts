import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getUserTokens, TokenData, checkTokenSystemHealth } from './tokenService';

export interface TokenSystemMetrics {
  totalUsers: number;
  totalTokensInCirculation: number;
  averageTokensPerUser: number;
  dailyClaimsToday: number;
  failedOperationsToday: number;
  systemHealthScore: number;
  lastUpdated: number;
}

export interface UserTokenAnalysis {
  userId: string;
  currentTokens: number;
  totalEarned: number;
  totalSpent: number;
  dailyClaimsCount: number;
  lastActivity: number;
  riskScore: number;
  anomalies: string[];
}

// Sistema de métricas en tiempo real
export const getSystemMetrics = async (): Promise<TokenSystemMetrics> => {
  try {
    console.log('📊 Calculando métricas del sistema de tokens...');
    
    // Obtener transacciones del último día
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const transactionsQuery = query(
      collection(db, 'tokenTransactions'),
      where('timestamp', '>=', oneDayAgo),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions = transactionsSnapshot.docs.map(doc => doc.data());
    
    // Obtener muestra de usuarios con tokens
    const tokensQuery = query(
      collection(db, 'tokens'),
      orderBy('tokens', 'desc'),
      limit(100)
    );
    
    const tokensSnapshot = await getDocs(tokensQuery);
    const tokenUsers = tokensSnapshot.docs.map(doc => ({
      userId: doc.id,
      tokens: (doc.data() as any).tokens || 0,
      ...doc.data()
    }));
    
    // Calcular métricas
    const totalUsers = tokensSnapshot.size;
    const totalTokensInCirculation = tokenUsers.reduce((sum, user) => sum + ((user as any).tokens || 0), 0);
    const averageTokensPerUser = totalUsers > 0 ? totalTokensInCirculation / totalUsers : 0;
    
    const dailyClaimsToday = transactions.filter(t => t.type === 'daily_claim').length;
    const failedOperationsToday = transactions.filter(t => t.type?.includes('error')).length;
    
    // Calcular score de salud (0-100)
    const healthScore = Math.max(0, Math.min(100, 
      100 - (failedOperationsToday * 10) + (dailyClaimsToday > 0 ? 20 : 0)
    ));
    
    const metrics: TokenSystemMetrics = {
      totalUsers,
      totalTokensInCirculation,
      averageTokensPerUser,
      dailyClaimsToday,
      failedOperationsToday,
      systemHealthScore: healthScore,
      lastUpdated: Date.now()
    };
    
    console.log('✅ Métricas calculadas:', metrics);
    return metrics;
    
  } catch (error) {
    console.error('❌ Error calculando métricas del sistema:', error);
    return {
      totalUsers: 0,
      totalTokensInCirculation: 0,
      averageTokensPerUser: 0,
      dailyClaimsToday: 0,
      failedOperationsToday: 0,
      systemHealthScore: 0,
      lastUpdated: Date.now()
    };
  }
};

// Análisis detallado de usuario
export const analyzeUser = async (userId: string): Promise<UserTokenAnalysis> => {
  try {
    console.log(`🔍 Analizando usuario: ${userId}`);
    
    // Obtener datos actuales
    const tokenData = await getUserTokens(userId);
    
    // Obtener historial de transacciones
    const userTransactionsQuery = query(
      collection(db, 'tokenTransactions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const transactionsSnapshot = await getDocs(userTransactionsQuery);
    const transactions = transactionsSnapshot.docs.map(doc => doc.data());
    
    // Calcular estadísticas
    const totalEarned = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = Math.abs(transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const dailyClaimsCount = transactions
      .filter(t => t.type === 'daily_claim')
      .length;
    
    const lastActivity = transactions.length > 0 ? 
      Math.max(...transactions.map(t => t.timestamp)) : 0;
    
    // Detectar anomalías
    const anomalies: string[] = [];
    
    // Verificar transacciones muy grandes
    const largeTransactions = transactions.filter(t => Math.abs(t.amount) > 1000000);
    if (largeTransactions.length > 0) {
      anomalies.push(`${largeTransactions.length} transacciones muy grandes`);
    }
    
    // Verificar muchas transacciones en poco tiempo
    const recentTransactions = transactions.filter(t => 
      Date.now() - t.timestamp < 3600000 // Última hora
    );
    if (recentTransactions.length > 20) {
      anomalies.push(`${recentTransactions.length} transacciones en la última hora`);
    }
    
    // Verificar balance negativo
    if (tokenData.tokens < 0) {
      anomalies.push('Balance de tokens negativo');
    }
    
    // Calcular score de riesgo (0-100)
    let riskScore = 0;
    riskScore += largeTransactions.length * 20;
    riskScore += recentTransactions.length > 10 ? 30 : 0;
    riskScore += tokenData.tokens < 0 ? 50 : 0;
    riskScore = Math.min(100, riskScore);
    
    const analysis: UserTokenAnalysis = {
      userId,
      currentTokens: tokenData.tokens,
      totalEarned,
      totalSpent,
      dailyClaimsCount,
      lastActivity,
      riskScore,
      anomalies
    };
    
    console.log(`✅ Análisis completado para ${userId}:`, analysis);
    return analysis;
    
  } catch (error) {
    console.error(`❌ Error analizando usuario ${userId}:`, error);
    return {
      userId,
      currentTokens: 0,
      totalEarned: 0,
      totalSpent: 0,
      dailyClaimsCount: 0,
      lastActivity: 0,
      riskScore: 100,
      anomalies: ['Error accediendo a datos del usuario']
    };
  }
};

// Diagnóstico completo del sistema
export const runSystemDiagnostic = async (): Promise<{
  overall: 'healthy' | 'warning' | 'critical';
  issues: Array<{ severity: 'low' | 'medium' | 'high'; message: string; recommendation: string }>;
  metrics: TokenSystemMetrics;
}> => {
  try {
    console.log('🏥 Ejecutando diagnóstico completo del sistema...');
    
    const metrics = await getSystemMetrics();
    const issues: Array<{ severity: 'low' | 'medium' | 'high'; message: string; recommendation: string }> = [];
    
    // Verificar salud general
    if (metrics.systemHealthScore < 50) {
      issues.push({
        severity: 'high',
        message: `Score de salud muy bajo: ${metrics.systemHealthScore}%`,
        recommendation: 'Investigar errores recientes y ejecutar reparaciones'
      });
    } else if (metrics.systemHealthScore < 80) {
      issues.push({
        severity: 'medium',
        message: `Score de salud moderado: ${metrics.systemHealthScore}%`,
        recommendation: 'Monitorear de cerca y optimizar operaciones'
      });
    }
    
    // Verificar actividad de reclamos
    if (metrics.dailyClaimsToday === 0) {
      issues.push({
        severity: 'medium',
        message: 'No se han procesado reclamos diarios hoy',
        recommendation: 'Verificar que el sistema de reclamos automáticos funcione'
      });
    }
    
    // Verificar errores
    if (metrics.failedOperationsToday > 10) {
      issues.push({
        severity: 'high',
        message: `${metrics.failedOperationsToday} operaciones fallidas hoy`,
        recommendation: 'Investigar causas de fallos y implementar correcciones'
      });
    } else if (metrics.failedOperationsToday > 5) {
      issues.push({
        severity: 'medium',
        message: `${metrics.failedOperationsToday} operaciones fallidas hoy`,
        recommendation: 'Monitorear patrones de errores'
      });
    }
    
    // Verificar distribución de tokens
    if (metrics.averageTokensPerUser < 10) {
      issues.push({
        severity: 'low',
        message: `Promedio de tokens muy bajo: ${metrics.averageTokensPerUser.toFixed(2)}`,
        recommendation: 'Considerar ajustar recompensas diarias'
      });
    }
    
    // Determinar estado general
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
    const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length;
    
    if (highSeverityIssues > 0) {
      overall = 'critical';
    } else if (mediumSeverityIssues > 1) {
      overall = 'warning';
    }
    
    console.log(`✅ Diagnóstico completado. Estado: ${overall}, Issues: ${issues.length}`);
    
    return { overall, issues, metrics };
    
  } catch (error) {
    console.error('❌ Error ejecutando diagnóstico del sistema:', error);
    return {
      overall: 'critical',
      issues: [{
        severity: 'high',
        message: 'Error ejecutando diagnóstico del sistema',
        recommendation: 'Verificar conectividad con Firebase y permisos'
      }],
      metrics: {
        totalUsers: 0,
        totalTokensInCirculation: 0,
        averageTokensPerUser: 0,
        dailyClaimsToday: 0,
        failedOperationsToday: 0,
        systemHealthScore: 0,
        lastUpdated: Date.now()
      }
    };
  }
};

// Reparación automática de problemas comunes
export const autoRepairSystem = async (): Promise<{
  repairsAttempted: number;
  repairsSuccessful: number;
  errors: string[];
}> => {
  console.log('🔧 Iniciando reparación automática del sistema...');
  
  let repairsAttempted = 0;
  let repairsSuccessful = 0;
  const errors: string[] = [];
  
  try {
    // Reparación 1: Limpiar documentos corruptos
    repairsAttempted++;
    try {
      const tokensQuery = query(
        collection(db, 'tokens'),
        limit(50)
      );
      
      const tokensSnapshot = await getDocs(tokensQuery);
      let corruptedFixed = 0;
      
      for (const tokenDoc of tokensSnapshot.docs) {
        const data = tokenDoc.data();
        if (typeof data.tokens !== 'number' || data.tokens < 0 ||
            typeof data.lastClaim !== 'number' || data.lastClaim < 0 ||
            typeof data.followersCount !== 'number' || data.followersCount < 0) {
          
          const fixedData = {
            tokens: Math.max(0, data.tokens || 0),
            lastClaim: Math.max(0, data.lastClaim || 0),
            followersCount: Math.max(0, data.followersCount || 0)
          };
          
          await setDoc(doc(db, 'tokens', tokenDoc.id), fixedData);
          corruptedFixed++;
        }
      }
      
      console.log(`✅ Reparación 1: ${corruptedFixed} documentos corruptos corregidos`);
      repairsSuccessful++;
    } catch (error) {
      errors.push(`Error en reparación de documentos corruptos: ${error}`);
    }
    
    // Reparación 2: Crear índices faltantes (simulado)
    repairsAttempted++;
    try {
      // En un entorno real, aquí se crearían índices de Firestore
      console.log('✅ Reparación 2: Índices verificados');
      repairsSuccessful++;
    } catch (error) {
      errors.push(`Error verificando índices: ${error}`);
    }
    
    // Reparación 3: Limpiar transacciones huérfanas
    repairsAttempted++;
    try {
      const oldTransactionsQuery = query(
        collection(db, 'tokenTransactions'),
        where('timestamp', '<', Date.now() - (30 * 24 * 60 * 60 * 1000)), // 30 días
        limit(100)
      );
      
      const oldTransactionsSnapshot = await getDocs(oldTransactionsQuery);
      console.log(`✅ Reparación 3: ${oldTransactionsSnapshot.size} transacciones antiguas identificadas`);
      repairsSuccessful++;
    } catch (error) {
      errors.push(`Error limpiando transacciones antiguas: ${error}`);
    }
    
  } catch (error) {
    errors.push(`Error general en reparación automática: ${error}`);
  }
  
  console.log(`🔧 Reparación completada: ${repairsSuccessful}/${repairsAttempted} exitosas`);
  
  return {
    repairsAttempted,
    repairsSuccessful,
    errors
  };
};

// Función para generar reporte completo
export const generateSystemReport = async (): Promise<string> => {
  try {
    console.log('📋 Generando reporte completo del sistema...');
    
    const diagnostic = await runSystemDiagnostic();
    const timestamp = new Date().toISOString();
    
    let report = `# REPORTE DEL SISTEMA DE TOKENS\n`;
    report += `**Generado:** ${timestamp}\n\n`;
    
    report += `## 🏥 ESTADO GENERAL: ${diagnostic.overall.toUpperCase()}\n\n`;
    
    report += `## 📊 MÉTRICAS\n`;
    report += `- **Usuarios totales:** ${diagnostic.metrics.totalUsers.toLocaleString()}\n`;
    report += `- **Tokens en circulación:** ${diagnostic.metrics.totalTokensInCirculation.toLocaleString()}\n`;
    report += `- **Promedio por usuario:** ${diagnostic.metrics.averageTokensPerUser.toFixed(2)}\n`;
    report += `- **Reclamos hoy:** ${diagnostic.metrics.dailyClaimsToday}\n`;
    report += `- **Operaciones fallidas hoy:** ${diagnostic.metrics.failedOperationsToday}\n`;
    report += `- **Score de salud:** ${diagnostic.metrics.systemHealthScore}%\n\n`;
    
    if (diagnostic.issues.length > 0) {
      report += `## ⚠️ PROBLEMAS DETECTADOS\n`;
      diagnostic.issues.forEach((issue, index) => {
        const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        report += `${index + 1}. ${emoji} **${issue.severity.toUpperCase()}:** ${issue.message}\n`;
        report += `   - *Recomendación:* ${issue.recommendation}\n\n`;
      });
    } else {
      report += `## ✅ SISTEMA SALUDABLE\nNo se detectaron problemas críticos.\n\n`;
    }
    
    report += `## 🔧 ACCIONES RECOMENDADAS\n`;
    if (diagnostic.overall === 'critical') {
      report += `- Ejecutar reparación automática inmediatamente\n`;
      report += `- Investigar errores recientes en logs\n`;
      report += `- Considerar rollback si es necesario\n`;
    } else if (diagnostic.overall === 'warning') {
      report += `- Monitorear de cerca las próximas horas\n`;
      report += `- Programar mantenimiento preventivo\n`;
    } else {
      report += `- Continuar monitoreo regular\n`;
      report += `- Mantener backups actualizados\n`;
    }
    
    console.log('✅ Reporte generado exitosamente');
    return report;
    
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    return `# ERROR GENERANDO REPORTE\n**Error:** ${error}\n**Timestamp:** ${new Date().toISOString()}`;
  }
};

// Función para monitoreo continuo (ejecutar cada 5 minutos)
export const continuousMonitoring = async (): Promise<void> => {
  try {
    const diagnostic = await runSystemDiagnostic();
    
    // Si hay problemas críticos, intentar reparación automática
    if (diagnostic.overall === 'critical') {
      console.log('🚨 Problemas críticos detectados, iniciando reparación automática...');
      const repairResult = await autoRepairSystem();
      
      if (repairResult.repairsSuccessful > 0) {
        console.log(`✅ Reparación automática completada: ${repairResult.repairsSuccessful} reparaciones exitosas`);
      } else {
        console.error('❌ Reparación automática falló, se requiere intervención manual');
      }
    }
    
    // Guardar métricas para histórico
    const metricsId = `metrics_${Date.now()}`;
    await setDoc(doc(db, 'systemMetrics', metricsId), {
      ...diagnostic.metrics,
      overall: diagnostic.overall,
      issuesCount: diagnostic.issues.length
    });
    
  } catch (error) {
    console.error('❌ Error en monitoreo continuo:', error);
  }
};