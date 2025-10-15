import { useState } from 'react';

interface StoreProps {
  onNavigateBack: () => void;
  userTokens: number;
}

export default function Store({ onNavigateBack, userTokens }: StoreProps) {
  const [activeTab, setActiveTab] = useState('avatares');

  return (
    <div className="store-container">
      {/* Header */}
      <div className="store-header">
        <button className="back-btn" onClick={onNavigateBack}>
          ←
        </button>
        <h2>Tienda</h2>
        <div className="user-tokens">
          💎 {userTokens.toLocaleString()}
        </div>
      </div>

      {/* Tabs */}
      <div className="store-tabs">
        <button 
          className={`store-tab ${activeTab === 'avatares' ? 'active' : ''}`}
          onClick={() => setActiveTab('avatares')}
        >
          Avatares
        </button>
        <button 
          className={`store-tab ${activeTab === 'diamantes' ? 'active' : ''}`}
          onClick={() => setActiveTab('diamantes')}
        >
          Diamantes
        </button>
        <button 
          className={`store-tab ${activeTab === 'interfaces' ? 'active' : ''}`}
          onClick={() => setActiveTab('interfaces')}
        >
          Interfaces
        </button>
        <button 
          className={`store-tab ${activeTab === 'vip' ? 'active' : ''}`}
          onClick={() => setActiveTab('vip')}
        >
          VIP
        </button>
        <button 
          className={`store-tab ${activeTab === 'regalos' ? 'active' : ''}`}
          onClick={() => setActiveTab('regalos')}
        >
          Regalos
        </button>
      </div>

      {/* Content */}
      <div className="store-content">
        {activeTab === 'avatares' && (
          <div className="avatares-section">
            <div className="store-item">
              <div className="item-icon">
                ➕
              </div>
              <div className="item-info">
                <h3>Añadir un avatar</h3>
                <p>Personaliza tu perfil con un nuevo avatar</p>
              </div>
              <div className="item-price">
                <span className="price">💎 30,000</span>
                <button className="buy-btn">Comprar</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diamantes' && (
          <div className="diamantes-section">
            <p className="coming-soon">Próximamente...</p>
          </div>
        )}

        {activeTab === 'interfaces' && (
          <div className="interfaces-section">
            <p className="coming-soon">Próximamente...</p>
          </div>
        )}

        {activeTab === 'vip' && (
          <div className="vip-section">
            <p className="coming-soon">Próximamente...</p>
          </div>
        )}

        {activeTab === 'regalos' && (
          <div className="regalos-section">
            <p className="coming-soon">Próximamente...</p>
          </div>
        )}
      </div>
    </div>
  );
}