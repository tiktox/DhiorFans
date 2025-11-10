import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';

// Validación de configuración
const validateConfig = () => {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missing = required.filter(key => !process.env[key] || process.env[key] === 'undefined');
  if (missing.length > 0) {
    console.warn(`⚠️ Missing Firebase config: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

const isConfigValid = validateConfig();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Inicialización robusta de Firebase
let app: any;
try {
  if (!isConfigValid) {
    console.error('❌ Firebase config inválida, usando configuración por defecto');
  }
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
  // No lanzar error, permitir que la app continúe
  app = null;
}

// Servicios Firebase con configuración optimizada
export const auth = (() => {
  if (!app) {
    console.warn('⚠️ Firebase app no inicializada');
    throw new Error('Firebase not initialized');
  }
  try {
    return getAuth(app);
  } catch (error) {
    console.error('❌ Error inicializando Auth:', error);
    throw error;
  }
})();
export const storage = app ? getStorage(app) : null;

// Firestore con configuración de persistencia mejorada
export const db = (() => {
  if (!app) {
    console.warn('⚠️ Firebase app no inicializada');
    throw new Error('Firebase not initialized');
  }
  
  try {
    return getFirestore(app);
  } catch (error) {
    console.error('❌ Error inicializando Firestore:', error);
    try {
      return initializeFirestore(app, {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true
      });
    } catch (fallbackError) {
      console.error('❌ Error en fallback de Firestore:', fallbackError);
      throw fallbackError;
    }
  }
})();

// Sistema avanzado de monitoreo y recuperación de conexión
class FirebaseConnectionManager {
  private static instance: FirebaseConnectionManager;
  private connectionState: 'connected' | 'disconnected' | 'reconnecting' | 'error' = 'connected';
  private retryCount = 0;
  private maxRetries = 5;
  private connectionResetCount = 0;
  private maxResets = 3;
  private listeners: Array<(state: string) => void> = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastSuccessfulOperation = Date.now();
  
  static getInstance(): FirebaseConnectionManager {
    if (!FirebaseConnectionManager.instance) {
      FirebaseConnectionManager.instance = new FirebaseConnectionManager();
    }
    return FirebaseConnectionManager.instance;
  }
  
  constructor() {
    this.startHealthCheck();
    this.setupNetworkListeners();
  }
  
  // Monitoreo de salud de conexión
  private startHealthCheck() {
    if (typeof window === 'undefined') return;
    
    this.healthCheckInterval = setInterval(() => {
      const timeSinceLastSuccess = Date.now() - this.lastSuccessfulOperation;
      
      // Si han pasado más de 30 segundos sin operaciones exitosas
      if (timeSinceLastSuccess > 30000 && this.connectionState === 'connected') {
        console.warn('⚠️ Posible problema de conexión detectado');
        this.connectionState = 'reconnecting';
        this.notifyListeners();
        this.resetFirestoreConnection();
      }
    }, 10000); // Verificar cada 10 segundos
  }
  
  // Escuchar eventos de red del navegador
  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      console.log('🌐 Conexión a internet restaurada');
      this.connectionState = 'reconnecting';
      this.notifyListeners();
      this.resetFirestoreConnection();
    });
    
    window.addEventListener('offline', () => {
      console.log('🚫 Conexión a internet perdida');
      this.connectionState = 'disconnected';
      this.notifyListeners();
    });
  }
  
  // Reiniciar conexión Firestore con lógica mejorada
  async resetFirestoreConnection(): Promise<void> {
    if (!db) {
      console.warn('⚠️ Firestore no disponible para reiniciar');
      return;
    }
    
    if (this.connectionResetCount >= this.maxResets) {
      console.error('❌ Máximo de reinicios alcanzado');
      return;
    }
    
    try {
      this.connectionResetCount++;
      this.connectionState = 'reconnecting';
      this.notifyListeners();
      
      console.log('🔄 Reiniciando conexión Firestore...');
      
      await disableNetwork(db);
      await this.delay(2000); // Esperar más tiempo
      await enableNetwork(db);
      
      this.connectionState = 'connected';
      this.lastSuccessfulOperation = Date.now();
      this.retryCount = 0;
      
      console.log('✅ Conexión Firestore reiniciada exitosamente');
      this.notifyListeners();
      
    } catch (error) {
      console.error('❌ Error reiniciando conexión:', error);
      this.connectionState = 'error';
      this.notifyListeners();
    }
  }
  
  // Ejecutar operaciones con reintentos inteligentes
  async executeWithRetry<T>(operation: () => Promise<T>, context = 'unknown'): Promise<T> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          operation(),
          this.createTimeoutPromise(15000) // Timeout de 15 segundos
        ]);
        
        // Operación exitosa
        this.retryCount = 0;
        this.connectionState = 'connected';
        this.lastSuccessfulOperation = Date.now();
        this.notifyListeners();
        
        return result;
        
      } catch (error: any) {
        console.error(`❌ Error en operación [${context}] intento ${attempt + 1}:`, error);
        
        // Manejar errores específicos de Firestore
        if (this.isCriticalFirestoreError(error)) {
          await this.resetFirestoreConnection();
        }
        
        // Si es el último intento o error no recuperable
        if (attempt === this.maxRetries || !this.isRetryableError(error)) {
          this.connectionState = 'error';
          this.notifyListeners();
          throw new Error(`Firebase operation failed after ${attempt + 1} attempts: ${error.message}`);
        }
        
        // Espera exponencial con jitter
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        await this.delay(baseDelay + jitter);
      }
    }
    
    throw new Error('Max retries exceeded');
  }
  
  // Crear promise con timeout
  private createTimeoutPromise<T>(ms: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), ms);
    });
  }
  
  // Identificar errores críticos de Firestore
  private isCriticalFirestoreError(error: any): boolean {
    const criticalErrors = [
      'INTERNAL ASSERTION FAILED',
      'internal',
      'network-request-failed'
    ];
    return criticalErrors.some(err => error.message?.toLowerCase().includes(err.toLowerCase()));
  }
  
  // Identificar errores que permiten reintentos
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'aborted',
      'timeout',
      'network-request-failed',
      'INTERNAL ASSERTION FAILED'
    ];
    return retryableErrors.some(err => error.message?.toLowerCase().includes(err.toLowerCase()));
  }
  
  // Delay con cancelación
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Sistema de notificaciones de estado
  onConnectionStateChange(callback: (state: string) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.connectionState);
      } catch (error) {
        console.error('Error notificando listener:', error);
      }
    });
  }
  
  // Obtener estado actual
  getConnectionState() {
    return this.connectionState;
  }
  
  // Limpiar recursos
  cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.listeners = [];
  }
}

export const connectionManager = FirebaseConnectionManager.getInstance();

// Función de conveniencia para reiniciar conexión
export const resetFirestoreConnection = () => connectionManager.resetFirestoreConnection();

// Hook para monitorear estado de conexión
export const useFirebaseConnection = () => {
  if (typeof window === 'undefined') return 'connected';
  
  const [state, setState] = useState(connectionManager.getConnectionState());
  
  useEffect(() => {
    const unsubscribe = connectionManager.onConnectionStateChange(setState);
    return unsubscribe;
  }, []);
  
  return state;
};

// Importar useState y useEffect si no están disponibles
let useState: any, useEffect: any;
if (typeof window !== 'undefined') {
  try {
    const React = require('react');
    useState = React.useState;
    useEffect = React.useEffect;
  } catch {
    // React no disponible, usar valores por defecto
    useState = (initial: any) => [initial, () => {}];
    useEffect = () => {};
  }
}

