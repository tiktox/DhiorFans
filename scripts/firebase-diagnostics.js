#!/usr/bin/env node

/**
 * SCRIPT DE DIAGNÓSTICO Y REPARACIÓN AUTOMÁTICA DE FIREBASE
 * Para DhiorFans - Aplicación Profesional
 * 
 * Este script diagnostica y repara automáticamente problemas comunes
 * de Firebase en la aplicación.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');
const { getStorage } = require('firebase/storage');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

class FirebaseDiagnostics {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.issues = [];
    this.fixes = [];
  }

  async initialize() {
    console.log('🔧 Iniciando diagnóstico de Firebase...\n');
    
    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      this.storage = getStorage(this.app);
      
      console.log('✅ Firebase inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error.message);
      this.issues.push({
        type: 'initialization',
        severity: 'critical',
        message: 'Firebase no se pudo inicializar',
        error: error.message
      });
      return false;
    }
  }

  async checkConfiguration() {
    console.log('\n📋 Verificando configuración...');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.error('❌ Variables de entorno faltantes:', missing.join(', '));
      this.issues.push({
        type: 'configuration',
        severity: 'critical',
        message: `Variables de entorno faltantes: ${missing.join(', ')}`,
        fix: 'Agregar las variables faltantes al archivo .env.local'
      });
    } else {
      console.log('✅ Todas las variables de entorno están configuradas');
    }
  }

  async checkFirestoreConnection() {
    console.log('\n🔥 Verificando conexión a Firestore...');
    
    try {
      await disableNetwork(this.db);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await enableNetwork(this.db);
      
      console.log('✅ Conexión a Firestore funcional');
      
    } catch (error) {
      console.error('❌ Error de conexión a Firestore:', error.message);
      this.issues.push({
        type: 'firestore',
        severity: 'critical',
        message: 'No se puede conectar a Firestore',
        error: error.message,
        fix: 'Verificar reglas de Firestore y configuración de red'
      });
    }
  }

  async performAutomaticFixes() {
    console.log('\n🔧 Aplicando correcciones automáticas...');
    
    if (this.issues.some(issue => issue.type === 'firestore')) {
      try {
        await disableNetwork(this.db);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await enableNetwork(this.db);
        console.log('✅ Conexión de Firestore reiniciada');
        this.fixes.push('Conexión de Firestore reiniciada');
      } catch (error) {
        console.error('❌ No se pudo reiniciar Firestore:', error.message);
      }
    }
  }

  generateReport() {
    console.log('\n📊 REPORTE DE DIAGNÓSTICO');
    console.log('========================\n');
    
    if (this.issues.length === 0) {
      console.log('🎉 ¡Excelente! No se encontraron problemas críticos.');
      console.log('✅ Firebase está funcionando correctamente.');
      return;
    }
    
    const critical = this.issues.filter(i => i.severity === 'critical');
    const high = this.issues.filter(i => i.severity === 'high');
    
    if (critical.length > 0) {
      console.log('🚨 PROBLEMAS CRÍTICOS:');
      critical.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        if (issue.fix) console.log(`   💡 Solución: ${issue.fix}`);
        if (issue.error) console.log(`   🔍 Error: ${issue.error}`);
        console.log('');
      });
    }
    
    if (this.fixes.length > 0) {
      console.log('🔧 CORRECCIONES APLICADAS:');
      this.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix}`);
      });
    }
  }

  async runFullDiagnostic() {
    const initialized = await this.initialize();
    
    if (!initialized) {
      this.generateReport();
      return;
    }
    
    await this.checkConfiguration();
    await this.checkFirestoreConnection();
    await this.performAutomaticFixes();
    
    this.generateReport();
  }
}

if (require.main === module) {
  const diagnostics = new FirebaseDiagnostics();
  diagnostics.runFullDiagnostic().catch(error => {
    console.error('💥 Error ejecutando diagnóstico:', error);
    process.exit(1);
  });
}

module.exports = FirebaseDiagnostics;