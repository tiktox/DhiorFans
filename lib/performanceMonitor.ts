// Monitor de rendimiento para operaciones críticas
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  async measureOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      this.recordMetric(operationName, performance.now() - startTime);
      return result;
    } catch (error) {
      this.recordMetric(`${operationName}_ERROR`, performance.now() - startTime);
      throw error;
    }
  }

  private recordMetric(operationName: string, duration: number) {
    const existing = this.metrics.get(operationName) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.metrics.set(operationName, existing);

    // Log operaciones lentas
    if (duration > 2000) {
      console.warn(`⚠️ Operación lenta detectada: ${operationName} (${duration.toFixed(2)}ms)`);
    }
  }

  getMetrics(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    const result: Record<string, { count: number; totalTime: number; avgTime: number }> = {};
    this.metrics.forEach((value, key) => {
      result[key] = { ...value };
    });
    return result;
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();