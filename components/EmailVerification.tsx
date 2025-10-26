import { useState, useEffect } from 'react';
import { User, sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface EmailVerificationProps {
  user: User;
  onVerified: () => void;
}

export default function EmailVerification({ user, onVerified }: EmailVerificationProps) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        onVerified();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, onVerified]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setResending(true);
    try {
      await sendEmailVerification(user, {
        url: window.location.origin,
        handleCodeInApp: false
      });
      setResendCooldown(60);
      alert('✅ Email de verificación enviado exitosamente.\n\nRevisa:\n• Bandeja de entrada\n• Carpeta de spam\n• Puede tardar 1-2 minutos');
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      const errorMsg = error.code === 'auth/too-many-requests' 
        ? 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
        : 'Error al enviar el email. Verifica tu conexión e intenta de nuevo.';
      alert('⚠️ ' + errorMsg);
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    await user.reload();
    if (user.emailVerified) {
      onVerified();
    } else {
      alert('Email aún no verificado. Por favor revisa tu correo.');
    }
    setChecking(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  return (
    <div className="email-verification-container">
      <video className="background-video" autoPlay loop muted>
        <source src="https://ik.imagekit.io/lics6cm47/11039880-hd_1920_1080_24fps.mp4?updatedAt=1758496774361" type="video/mp4" />
      </video>

      <div className="verification-content">
        <div className="verification-icon">📧</div>
        
        <h1>Verifica tu email</h1>
        
        <p className="verification-message">
          Hemos enviado un email de verificación a:
        </p>
        
        <p className="user-email">{user.email}</p>
        
        <p className="verification-instructions">
          Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación.
        </p>

        <div className="verification-actions">
          <button 
            className="check-btn" 
            onClick={handleCheckVerification}
            disabled={checking}
          >
            {checking ? 'Verificando...' : 'Ya verifiqué mi email'}
          </button>

          <button 
            className="resend-btn" 
            onClick={handleResendEmail}
            disabled={resending || resendCooldown > 0}
          >
            {resending ? 'Enviando...' : resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar email'}
          </button>

          <button className="logout-btn-verify" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        <div className="verification-tips">
          <p className="tip-title">💡 Consejos:</p>
          <ul>
            <li>Revisa tu carpeta de spam</li>
            <li>El email puede tardar unos minutos</li>
            <li>Asegúrate de que el email sea correcto</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
