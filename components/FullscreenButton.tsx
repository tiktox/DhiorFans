import { useState } from 'react';
import { useFullscreen } from '../hooks/useFullscreen';
import styles from './FullscreenButton.module.css';

interface FullscreenButtonProps {
  className?: string;
}

export default function FullscreenButton({ className }: FullscreenButtonProps) {
  const { isFullscreen, capabilities, toggleFullscreen } = useFullscreen();
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState<string | null>(null);





  const handleClick = async () => {
    setError(null);
    
    if (capabilities.canFullscreen) {
      const success = await toggleFullscreen();
      if (!success && capabilities.isIOS && !capabilities.isPWA) {
        setShowInstructions(true);
      } else if (!success) {
        setError('No se pudo activar pantalla completa. Verifica los permisos del navegador.');
      }
    } else if (capabilities.isIOS && !capabilities.isPWA) {
      setShowInstructions(true);
    } else {
      setError('Tu navegador no soporta pantalla completa.');
    }
  };

  const closeInstructions = () => {
    setShowInstructions(false);
    setError(null);
  };

  return (
    <>
      <button
        className={`${styles.fullscreenBtn} ${className || ''}`}
        onClick={handleClick}
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {isFullscreen ? (
          // Icono salir de fullscreen
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/>
          </svg>
        ) : (
          // Icono entrar a fullscreen
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
          </svg>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className={styles.errorToast}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {/* Modal de instrucciones para iOS */}
      {showInstructions && (
        <div className={styles.instructionsOverlay} onClick={closeInstructions}>
          <div className={styles.instructionsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.instructionsHeader}>
              <h3>Pantalla Completa</h3>
              <button className={styles.closeBtn} onClick={closeInstructions}>×</button>
            </div>
            <div className={styles.instructionsContent}>
              <p>Para una experiencia de pantalla completa:</p>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>1</span>
                <p>Toca el botón <strong>Compartir</strong> en Safari</p>
              </div>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>2</span>
                <p>Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
              </div>
              <div className={styles.instructionStep}>
                <span className={styles.stepNumber}>3</span>
                <p>Abre la app desde tu pantalla de inicio</p>
              </div>
              <div className={styles.pwaIcon}>📱</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}