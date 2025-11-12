import { useState, useEffect } from 'react';
import { addTokens } from '../lib/tokenService';

interface AdminTokenButtonProps {
  userId: string;
  onTokensAdded?: (newTotal: number) => void;
}

export default function AdminTokenButton({ userId, onTokensAdded }: AdminTokenButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUsed, setIsUsed] = useState(false);

  useEffect(() => {
    const used = localStorage.getItem(`admin-tokens-${userId}`);
    setIsUsed(used === 'true');
  }, [userId]);

  const handleAddTokens = async () => {
    if (isUsed || isLoading) return;
    
    setIsLoading(true);
    console.log('🚀 Iniciando autodonación de 2.1M tokens...');
    
    try {
      const result = await addTokens(userId, 2100000);
      if (result.success) {
        setIsUsed(true);
        localStorage.setItem(`admin-tokens-${userId}`, 'true');
        onTokensAdded?.(result.totalTokens);
        console.log('✅ Autodonación completada exitosamente!');
        alert(`¡Éxito! Se agregaron 2.1M tokens. Total: ${result.totalTokens.toLocaleString()}`);
      } else {
        console.error('❌ Error en la autodonación');
        alert('Error al agregar tokens. Revisa la consola.');
      }
    } catch (error) {
      console.error('❌ Error crítico en autodonación:', error);
      alert('Error crítico. Revisa la consola.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isUsed) {
    return (
      <div className="admin-token-btn used">
        ✅ Tokens ya otorgados
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <button 
        onClick={handleAddTokens}
        disabled={isLoading}
        className="admin-token-btn"
      >
        {isLoading ? '⏳ Procesando...' : '🪙 Obtener 2.1M Tokens'}
      </button>
    </div>
  );
}