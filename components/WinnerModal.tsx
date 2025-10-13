interface WinnerModalProps {
  isOpen: boolean;
  tokensWon: number;
  keyword: string;
  onClose: () => void;
}

export default function WinnerModal({ isOpen, tokensWon, keyword, onClose }: WinnerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="winner-modal-overlay" onClick={onClose}>
      <div className="winner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="winner-content">
          <div className="winner-emoji">🎉</div>
          <h2 className="winner-title">¡Felicitaciones!</h2>
          <p className="winner-message">
            ¡Adivinaste la palabra clave y ganaste tokens!
          </p>
          
          <div className="winner-tokens">
            <div className="winner-tokens-amount">+{tokensWon} 🪙</div>
          </div>
          
          <div className="winner-keyword">
            Palabra: "{keyword}"
          </div>
          
          <button className="winner-close-btn" onClick={onClose}>
            ¡Genial!
          </button>
        </div>
      </div>
    </div>
  );
}