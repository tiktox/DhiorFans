// Sistema avanzado de manejo de errores y monitoreo
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ timestamp: number; error: string; context: string; severity: 'low' | 'medium' | 'high' | 'critical' }> = [];
  private performanceMetrics: Array<{ timestamp: number; operation: string; duration: number; success: boolean }> = [];
  private maxLogSize = 200;
  private maxMetricsSize = 100;
  private criticalErrorCount = 0;
  private lastCriticalError = 0;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  logError(error: any, context: string = 'unknown', severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    const errorEntry = {
      timestamp: Date.now(),
      error: error.message || String(error),
      context,
      severity
    };

    this.errorLog.push(errorEntry);
    
    // Mantener solo los últimos errores
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Tracking de errores críticos
    if (severity === 'critical' || this.isFirestoreError(error)) {
      this.criticalErrorCount++;
      this.lastCriticalError = Date.now();
      console.error(`🚨 CRITICAL ERROR [${context}]:`, error);
      
      // Enviar métricas si hay demasiados errores críticos
      if (this.criticalErrorCount > 5) {
        this.reportCriticalIssue(context, error);
      }
    }

    // Log según severidad
    if (this.isFirestoreError(error)) {
      console.error(`🔥 FIRESTORE ERROR [${context}]:`, error);
    } else if (severity === 'high') {
      console.error(`⚠️ HIGH SEVERITY [${context}]:`, error);
    } else if (severity === 'medium') {
      console.warn(`⚡ MEDIUM SEVERITY [${context}]:`, error);
    }
  }

  logPerformance(operation: string, duration: number, success: boolean) {
    const metric = {
      timestamp: Date.now(),
      operation,
      duration,
      success
    };

    this.performanceMetrics.push(metric);
    
    if (this.performanceMetrics.length > this.maxMetricsSize) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsSize);
    }

    // Alertar sobre operaciones lentas
    if (duration > 10000) { // Más de 10 segundos
      console.warn(`🐌 SLOW OPERATION [${operation}]: ${duration}ms`);
    }
  }

  private isFirestoreError(error: any): boolean {
    const firestoreErrors = [
      'INTERNAL ASSERTION FAILED',
      'permission-denied',
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'network-request-failed'
    ];
    return firestoreErrors.some(err => error.message?.toLowerCase().includes(err.toLowerCase()));
  }

  private reportCriticalIssue(context: string, error: any) {
    console.error(`🚨 CRITICAL ISSUE DETECTED: ${this.criticalErrorCount} critical errors in ${context}`);
    
    // Aquí podrías enviar a un servicio de monitoreo externo
    // como Sentry, LogRocket, etc.
    
    // Reset counter después de reportar
    this.criticalErrorCount = 0;
  }

  getRecentErrors(minutes: number = 5): Array<{ timestamp: number; error: string; context: string; severity: string }> {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.errorLog.filter(entry => entry.timestamp > cutoff);
  }

  getPerformanceMetrics(minutes: number = 5): Array<{ timestamp: number; operation: string; duration: number; success: boolean }> {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.performanceMetrics.filter(entry => entry.timestamp > cutoff);
  }

  hasRecentFirestoreErrors(): boolean {
    return this.getRecentErrors().some(entry => 
      entry.error.includes('INTERNAL ASSERTION FAILED')
    );
  }

  getHealthStatus(): { status: 'healthy' | 'degraded' | 'critical'; details: any } {
    const recentErrors = this.getRecentErrors(5);
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
    const recentMetrics = this.getPerformanceMetrics(5);
    
    const avgDuration = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length 
      : 0;
    
    const successRate = recentMetrics.length > 0 
      ? recentMetrics.filter(m => m.success).length / recentMetrics.length 
      : 1;

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (criticalErrors.length > 2 || successRate < 0.7) {
      status = 'critical';
    } else if (recentErrors.length > 5 || avgDuration > 5000 || successRate < 0.9) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        recentErrors: recentErrors.length,
        criticalErrors: criticalErrors.length,
        avgDuration: Math.round(avgDuration),
        successRate: Math.round(successRate * 100),
        lastCriticalError: this.lastCriticalError
      }
    };
  }

  // Función para medir rendimiento de operaciones
  async measureOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await operation();
      success = true;
      return result;
    } catch (error) {
      this.logError(error, operationName, 'high');
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.logPerformance(operationName, duration, success);
    }
  }

  // Limpiar logs antiguos
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.errorLog = this.errorLog.filter(entry => entry.timestamp > oneHourAgo);
    this.performanceMetrics = this.performanceMetrics.filter(entry => entry.timestamp > oneHourAgo);
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Hook para monitorear salud del sistema
export const useSystemHealth = () => {
  if (typeof window === 'undefined') return { status: 'healthy', details: {} };
  
  const [health, setHealth] = useState(errorHandler.getHealthStatus());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(errorHandler.getHealthStatus());
    }, 30000); // Actualizar cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  return health;
};

// Importar useState y useEffect si no están disponibles
let useState: any, useEffect: any;
if (typeof window !== 'undefined') {
  try {
    const React = require('react');
    useState = React.useState;
    useEffect = React.useEffect;
  } catch {
    useState = (initial: any) => [initial, () => {}];
    useEffect = () => {};
  }
}

// Limpiar logs cada hora
if (typeof window !== 'undefined') {
  setInterval(() => {
    errorHandler.cleanup();
  }, 60 * 60 * 1000);
}