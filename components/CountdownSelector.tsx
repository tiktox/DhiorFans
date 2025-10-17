import { useState, useEffect } from 'react';

interface CountdownSelectorProps {
  isActive: boolean;
  contentType: string;
  onCountdownComplete: () => void;
  onCancel: () => void;
}

export default function CountdownSelector({ 
  isActive, 
  contentType, 
  onCountdownComplete, 
  onCancel 
}: CountdownSelectorProps) {
  const [countdown, setCountdown] = useState(5);
  const [isRunning, setIsRunning] = useState(false);

  // Solo activar countdown para tipos específicos
  const shouldShowCountdown = ['dinamica', 'escribir', 'live'].includes(contentType);

  useEffect(() => {
    if (isActive && shouldShowCountdown) {
      setCountdown(5);
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [isActive, shouldShowCountdown]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onCountdownComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, countdown, onCountdownComplete]);

  if (!isActive || !shouldShowCountdown || !isRunning) {
    return null;
  }

  return (
    <div className="countdown-overlay">
      <div className="countdown-content">
        <div className="countdown-circle">
          <svg className="countdown-svg" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#2196f3"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - (countdown / 5))}`}
              className="countdown-progress"
            />
          </svg>
          <div className="countdown-number">{countdown}</div>
        </div>
        <p className="countdown-text">
          Seleccionando "{contentType === 'dinamica' ? 'Crear Dinámica' : 
                         contentType === 'escribir' ? 'Escribe Algo!!' : 'Live'}"
        </p>
        <button className="countdown-cancel" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}