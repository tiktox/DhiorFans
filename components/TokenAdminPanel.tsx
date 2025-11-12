import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  getUserTokens, 
  addTokens, 
  checkTokenSystemHealth, 
  getCacheStats, 
  clearTokenCache 
} from '../lib/tokenService';
import { 
  runSystemDiagnostic, 
  analyzeUser, 
  autoRepairSystem, 
  generateSystemReport,
  TokenSystemMetrics,
  UserTokenAnalysis
} from '../lib/tokenMonitor';

interface AdminPanelProps {
  onClose: () => void;
}

export default function TokenAdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'user' | 'system' | 'repair'>('overview');
  const [systemMetrics, setSystemMetrics] = useState<TokenSystemMetrics | null>(null);
  const [userAnalysis, setUserAnalysis] = useState<UserTokenAnalysis | null>(null);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [tokenAmount, setTokenAmount] = useState(100000);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const loadSystemData = async () => {
    setLoading(true);
    try {
      addLog('🔄 Cargando datos del sistema...');
      
      const diagnostic = await runSystemDiagnostic();
      setSystemMetrics(diagnostic.metrics);
      setSystemHealth(diagnostic.overall);
      
      if (auth.currentUser) {
        const analysis = await analyzeUser(auth.currentUser.uid);
        setUserAnalysis(analysis);
      }
      
      addLog(`✅ Datos cargados. Estado: ${diagnostic.overall}`);
    } catch (error) {
      addLog(`❌ Error cargando datos: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTokens = async () => {
    if (!targetUserId || tokenAmount <= 0) {
      addLog('❌ ID de usuario o cantidad inválida');
      return;
    }

    setLoading(true);
    try {
      addLog(`🔄 Agregando ${tokenAmount.toLocaleString()} tokens a ${targetUserId}...`);
      
      const result = await addTokens(targetUserId, tokenAmount, 'admin_grant');
      
      if (result.success) {
        addLog(`✅ Tokens agregados exitosamente. Total: ${result.totalTokens.toLocaleString()}`);
        setTokenAmount(100000);
        setTargetUserId('');
      } else {
        addLog('❌ Error agregando tokens');
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemRepair = async () => {
    setLoading(true);
    try {
      addLog('🔧 Iniciando reparación automática del sistema...');
      
      const result = await autoRepairSystem();
      
      addLog(`📊 Reparación completada: ${result.repairsSuccessful}/${result.repairsAttempted} exitosas`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => addLog(`⚠️ Error: ${error}`));
      }
      
      // Recargar datos después de la reparación
      await loadSystemData();
    } catch (error) {
      addLog(`❌ Error en reparación: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    try {
      clearTokenCache();
      addLog('🧹 Cache global limpiado exitosamente');
    } catch (error) {
      addLog(`❌ Error limpiando cache: ${error}`);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      addLog('📋 Generando reporte completo...');
      
      const report = await generateSystemReport();
      
      // Crear y descargar archivo
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `token-system-report-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addLog('✅ Reporte generado y descargado');
    } catch (error) {
      addLog(`❌ Error generando reporte: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData();
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getHealthEmoji = (health: string) => {
    switch (health) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🔴';
      default: return '❓';
    }
  };

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>🏥 Panel de Administración de Tokens</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="admin-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            📊 Resumen
          </button>
          <button 
            className={activeTab === 'user' ? 'active' : ''}
            onClick={() => setActiveTab('user')}
          >
            👤 Usuario
          </button>
          <button 
            className={activeTab === 'system' ? 'active' : ''}
            onClick={() => setActiveTab('system')}
          >
            🌐 Sistema
          </button>
          <button 
            className={activeTab === 'repair' ? 'active' : ''}
            onClick={() => setActiveTab('repair')}
          >
            🔧 Reparación
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>Estado del Sistema</h3>
                  <div className="health-indicator" style={{ color: getHealthColor(systemHealth) }}>
                    {getHealthEmoji(systemHealth)} {systemHealth.toUpperCase()}
                  </div>
                </div>
                
                {systemMetrics && (
                  <>
                    <div className="metric-card">
                      <h3>Usuarios Totales</h3>
                      <div className="metric-value">{systemMetrics.totalUsers.toLocaleString()}</div>
                    </div>
                    
                    <div className="metric-card">
                      <h3>Tokens en Circulación</h3>
                      <div className="metric-value">{systemMetrics.totalTokensInCirculation.toLocaleString()}</div>
                    </div>
                    
                    <div className="metric-card">
                      <h3>Promedio por Usuario</h3>
                      <div className="metric-value">{systemMetrics.averageTokensPerUser.toFixed(2)}</div>
                    </div>
                    
                    <div className="metric-card">
                      <h3>Reclamos Hoy</h3>
                      <div className="metric-value">{systemMetrics.dailyClaimsToday}</div>
                    </div>
                    
                    <div className="metric-card">
                      <h3>Errores Hoy</h3>
                      <div className="metric-value" style={{ color: systemMetrics.failedOperationsToday > 0 ? '#ef4444' : '#10b981' }}>
                        {systemMetrics.failedOperationsToday}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="quick-actions">
                <button onClick={loadSystemData} disabled={loading}>
                  🔄 Actualizar Datos
                </button>
                <button onClick={handleGenerateReport} disabled={loading}>
                  📋 Generar Reporte
                </button>
                <button onClick={handleClearCache}>
                  🧹 Limpiar Cache
                </button>
              </div>
            </div>
          )}

          {activeTab === 'user' && (
            <div className="user-tab">
              <div className="user-actions">
                <h3>Gestión de Tokens de Usuario</h3>
                
                <div className="input-group">
                  <label>ID de Usuario:</label>
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Ingresa el ID del usuario"
                  />
                </div>
                
                <div className="input-group">
                  <label>Cantidad de Tokens:</label>
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(parseInt(e.target.value) || 0)}
                    min="1"
                    max="50000000"
                  />
                </div>
                
                <button 
                  onClick={handleAddTokens} 
                  disabled={loading || !targetUserId || tokenAmount <= 0}
                  className="add-tokens-btn"
                >
                  💰 Agregar Tokens
                </button>
              </div>
              
              {userAnalysis && (
                <div className="user-analysis">
                  <h3>Análisis del Usuario Actual</h3>
                  <div className="analysis-grid">
                    <div className="analysis-item">
                      <span>Tokens Actuales:</span>
                      <span>{userAnalysis.currentTokens.toLocaleString()}</span>
                    </div>
                    <div className="analysis-item">
                      <span>Total Ganado:</span>
                      <span>{userAnalysis.totalEarned.toLocaleString()}</span>
                    </div>
                    <div className="analysis-item">
                      <span>Total Gastado:</span>
                      <span>{userAnalysis.totalSpent.toLocaleString()}</span>
                    </div>
                    <div className="analysis-item">
                      <span>Reclamos Diarios:</span>
                      <span>{userAnalysis.dailyClaimsCount}</span>
                    </div>
                    <div className="analysis-item">
                      <span>Score de Riesgo:</span>
                      <span style={{ color: userAnalysis.riskScore > 50 ? '#ef4444' : '#10b981' }}>
                        {userAnalysis.riskScore}%
                      </span>
                    </div>
                  </div>
                  
                  {userAnalysis.anomalies.length > 0 && (
                    <div className="anomalies">
                      <h4>⚠️ Anomalías Detectadas:</h4>
                      <ul>
                        {userAnalysis.anomalies.map((anomaly, index) => (
                          <li key={index}>{anomaly}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'system' && (
            <div className="system-tab">
              <h3>Información del Sistema</h3>
              
              {systemMetrics && (
                <div className="system-details">
                  <div className="detail-item">
                    <span>Última Actualización:</span>
                    <span>{new Date(systemMetrics.lastUpdated).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span>Score de Salud:</span>
                    <span style={{ color: getHealthColor(systemHealth) }}>
                      {systemMetrics.systemHealthScore}%
                    </span>
                  </div>
                </div>
              )}
              
              <div className="cache-info">
                <h4>Información de Cache</h4>
                <button onClick={() => {
                  const stats = getCacheStats();
                  addLog(`📊 Cache: ${stats.size} entradas, Usuarios: [${stats.entries.join(', ')}]`);
                }}>
                  📊 Ver Estadísticas de Cache
                </button>
              </div>
            </div>
          )}

          {activeTab === 'repair' && (
            <div className="repair-tab">
              <h3>🔧 Herramientas de Reparación</h3>
              
              <div className="repair-actions">
                <button 
                  onClick={handleSystemRepair} 
                  disabled={loading}
                  className="repair-btn"
                >
                  🔧 Reparación Automática
                </button>
                
                <button onClick={handleClearCache} className="cache-btn">
                  🧹 Limpiar Cache Global
                </button>
                
                <button 
                  onClick={async () => {
                    if (auth.currentUser) {
                      const health = await checkTokenSystemHealth(auth.currentUser.uid);
                      addLog(`🏥 Salud del usuario: ${health.healthy ? 'Saludable' : 'Necesita atención'}`);
                      if (!health.healthy) {
                        health.issues.forEach(issue => addLog(`⚠️ ${issue}`));
                        health.recommendations.forEach(rec => addLog(`💡 ${rec}`));
                      }
                    }
                  }}
                  className="health-btn"
                >
                  🏥 Verificar Salud
                </button>
              </div>
              
              <div className="emergency-section">
                <h4>🚨 Funciones de Emergencia</h4>
                <p>Estas funciones deben usarse solo en casos críticos:</p>
                
                <button 
                  onClick={() => {
                    if (confirm('⚠️ ¿Estás seguro de que quieres limpiar TODOS los caches?')) {
                      clearTokenCache();
                      addLog('🧹 Todos los caches limpiados');
                    }
                  }}
                  className="emergency-btn"
                >
                  🚨 Limpiar Todo el Cache
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="admin-logs">
          <h3>📝 Logs del Sistema</h3>
          <div className="logs-container">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">{log}</div>
            ))}
          </div>
          <button onClick={() => setLogs([])} className="clear-logs-btn">
            🗑️ Limpiar Logs
          </button>
        </div>
      </div>

      <style jsx>{`
        .admin-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .admin-panel {
          background: #1a1a1a;
          border-radius: 12px;
          width: 90vw;
          max-width: 1200px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          color: white;
          overflow: hidden;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #333;
        }

        .admin-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .close-btn {
          background: #ef4444;
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
        }

        .admin-tabs {
          display: flex;
          border-bottom: 1px solid #333;
        }

        .admin-tabs button {
          background: none;
          border: none;
          color: #ccc;
          padding: 15px 20px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.3s;
        }

        .admin-tabs button.active {
          color: #60a5fa;
          border-bottom-color: #60a5fa;
        }

        .admin-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .metric-card {
          background: #2a2a2a;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }

        .metric-card h3 {
          margin: 0 0 10px 0;
          font-size: 0.9rem;
          color: #ccc;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #60a5fa;
        }

        .health-indicator {
          font-size: 1.2rem;
          font-weight: bold;
        }

        .quick-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .quick-actions button {
          background: #60a5fa;
          border: none;
          color: white;
          padding: 10px 15px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .quick-actions button:hover {
          background: #3b82f6;
        }

        .quick-actions button:disabled {
          background: #4a5568;
          cursor: not-allowed;
        }

        .input-group {
          margin-bottom: 15px;
        }

        .input-group label {
          display: block;
          margin-bottom: 5px;
          color: #ccc;
        }

        .input-group input {
          width: 100%;
          padding: 10px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          color: white;
        }

        .add-tokens-btn {
          background: #10b981;
          border: none;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
        }

        .add-tokens-btn:disabled {
          background: #4a5568;
          cursor: not-allowed;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        }

        .analysis-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: #2a2a2a;
          border-radius: 4px;
        }

        .anomalies {
          background: #2a1a1a;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #ef4444;
        }

        .repair-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .repair-btn {
          background: #f59e0b;
          border: none;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
        }

        .cache-btn {
          background: #8b5cf6;
          border: none;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
        }

        .health-btn {
          background: #10b981;
          border: none;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
        }

        .emergency-btn {
          background: #ef4444;
          border: none;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
        }

        .admin-logs {
          border-top: 1px solid #333;
          padding: 15px 20px;
          max-height: 200px;
          display: flex;
          flex-direction: column;
        }

        .logs-container {
          flex: 1;
          overflow-y: auto;
          background: #0a0a0a;
          padding: 10px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.8rem;
          margin-bottom: 10px;
        }

        .log-entry {
          margin-bottom: 2px;
          color: #ccc;
        }

        .clear-logs-btn {
          background: #6b7280;
          border: none;
          color: white;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          align-self: flex-start;
        }
      `}</style>
    </div>
  );
}