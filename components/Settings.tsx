import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface SettingsProps {
  onNavigateBack: () => void;
}

export default function Settings({ onNavigateBack }: SettingsProps) {
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
          
          <button className="settings-option logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}