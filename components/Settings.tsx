import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useState } from 'react';

interface SettingsProps {
  onNavigateBack: () => void;
}

export default function Settings({ onNavigateBack }: SettingsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <button className="back-btn" onClick={onNavigateBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h2>Configuración</h2>
      </div>

      {/* Settings Options */}
      <div className="settings-content">
        <div className="settings-section">
          <p className="section-title">Inicio de sesión</p>
          
          <button className="settings-option logout-btn" onClick={() => setShowConfirm(true)}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Salir de todos los dispositivos</h3>
            </div>
            <div className="modal-body">
              <p>La sesión se cerrará de todos los dispositivos.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button
                className="btn-confirm"
                onClick={async () => {
                  await handleLogout();
                  setShowConfirm(false);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}