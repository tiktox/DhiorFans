import { useState, useEffect } from 'react';
import { User, sendEmailVerification } from 'firebase/auth';

interface VerificationBannerProps {
  user: User;
}

export default function VerificationBanner({ user }: VerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        setDismissed(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setSending(true);
    
    let success = false;
    for (let i = 0; i < 3 && !success; i++) {
      try {
        await sendEmailVerification(user, {
          url: window.location.origin,
          handleCodeInApp: false
        });
        success = true;
        setCooldown(60);
        alert('✅ Email enviado exitosamente Puede tardar 1-2 minutos');
      } catch (error: any) {
        if (i === 2) {
          const msg = error.code === 'auth/too-many-requests' 
            ? 'Demasiados intentos. Espera 15 minutos.'
            : 'Error al enviar. Verifica tu conexión.';
          alert('⚠️ ' + msg);
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    setSending(false);
  };

  if (user.emailVerified || dismissed) return null;

  return (
    <div className="verification-banner">
      <span>⚠️ Verifica tu email: {user.email}</span>
      <div className="banner-actions">
        <button onClick={handleResend} disabled={sending || cooldown > 0}>
          {sending ? 'Enviando...' : cooldown > 0 ? `${cooldown}s` : 'Reenviar'}
        </button>
        <button onClick={() => setDismissed(true)}>✕</button>
      </div>
    </div>
  );
}
