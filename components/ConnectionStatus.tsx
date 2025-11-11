import { useState, useEffect } from 'react';

interface ConnectionStatusProps {
  show: boolean;
  message: string;
  type: 'loading' | 'error' | 'success' | 'warning';
}

export default function ConnectionStatus({ show, message, type }: ConnectionStatusProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'loading': return '🔄';
      case 'error': return '⚠️';
      case 'success': return '✅';
      case 'warning': return '⚡';
      default: return '📡';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'loading': return '#2196f3';
      case 'error': return '#f44336';
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      default: return '#666';
    }
  };

  return (
    <div 
      className={`connection-status ${show ? 'show' : 'hide'}`}
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: `linear-gradient(135deg, ${getColor()}, ${getColor()}dd)`,
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        opacity: show ? 1 : 0,
        transition: 'all 0.3s ease',
        maxWidth: '280px',
        textAlign: 'center'
      }}
    >
      <span style={{ fontSize: '14px' }}>{getIcon()}</span>
      {message}
    </div>
  );
}