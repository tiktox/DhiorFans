import { useState, useEffect } from 'react';
import { checkEmailAvailability } from '../lib/emailVerificationService';

export default function EmailVerificationDemo() {
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const checkEmail = async (value: string) => {
    if (!value.trim()) {
      setEmailStatus('idle');
      return;
    }
    
    setEmailStatus('checking');
    
    const available = await checkEmailAvailability(value);
    
    setEmailStatus(available ? 'available' : 'taken');
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }
    
    if (!value.trim()) {
      setEmailStatus('idle');
      return;
    }
    
    const timeout = setTimeout(() => {
      checkEmail(value);
    }, 800);
    
    setEmailCheckTimeout(timeout);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Demo: Verificación de Correos en Tiempo Real</h2>
      
      <div className="email-input-wrapper">
        <input
          type="email"
          placeholder="Ingresa un correo electrónico"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          className={emailStatus === 'taken' ? 'input-error' : emailStatus === 'available' ? 'input-success' : ''}
          style={{
            width: '100%',
            padding: '12px 15px',
            border: '1px solid #ccc',
            borderRadius: '25px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.3s ease'
          }}
        />
        {emailStatus === 'checking' && <span className="checking-text">Verificando correo...</span>}
        {emailStatus === 'available' && <span className="success-text">✓ Correo disponible</span>}
        {emailStatus === 'taken' && <span className="error-text">✗ Este correo ya está registrado</span>}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Estado actual:</h3>
        <p><strong>Email:</strong> {email || 'Ninguno'}</p>
        <p><strong>Estado:</strong> {
          emailStatus === 'idle' ? 'Sin verificar' :
          emailStatus === 'checking' ? 'Verificando...' :
          emailStatus === 'available' ? 'Disponible ✓' :
          'Ya registrado ✗'
        }</p>
      </div>
    </div>
  );
}