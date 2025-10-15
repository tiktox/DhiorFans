import { useState, useRef, useEffect } from 'react';

interface PublishModalProps {
  onClose: () => void;
  onNavigateToCreatePost?: () => void;
  onNavigateToCreateDynamic?: () => void;
  onNavigateToLive?: () => void;
}

export default function PublishModal({ 
  onClose, 
  onNavigateToCreatePost, 
  onNavigateToCreateDynamic,
  onNavigateToLive 
}: PublishModalProps) {
  const [selectedType, setSelectedType] = useState<string>('Publicación');
  const [hasPermissions, setHasPermissions] = useState(false);
  const [userMedia, setUserMedia] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contentTypes = [
    { id: 'dynamic', label: 'Crear Dinamica', action: onNavigateToCreateDynamic },
    { id: 'post', label: 'Publicación', action: onNavigateToCreatePost },
    { id: 'text', label: 'Escribe algo!!', action: () => {} },
    { id: 'live', label: 'Live', action: onNavigateToLive }
  ];

  useEffect(() => {
    // Simular galería del usuario
    setUserMedia([
      '/api/placeholder/60/60',
      '/api/placeholder/60/60',
      '/api/placeholder/60/60'
    ]);
  }, []);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setHasPermissions(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
    }
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleTypeSelect = (type: any) => {
    setSelectedType(type.label);
    if (type.action) {
      type.action();
    }
  };

  return (
    <div className="publish-modal-overlay">
      <div className="publish-modal">
        {/* Botón cerrar */}
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Selector de tipos de contenido */}
        <div className="content-types">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              className={`type-btn ${selectedType === type.label ? 'active' : ''}`}
              onClick={() => handleTypeSelect(type)}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Centro - Permisos de cámara y micrófono */}
        <div className="permissions-section">
          <div className="permissions-content">
            <h3>Dhiorfans necesita acceder a la cámara y el micrófono</h3>
            <button className="permissions-btn" onClick={requestPermissions}>
              ⚙️ Ir a configuración
            </button>
          </div>
        </div>

        {/* Galería del usuario */}
        <div className="user-gallery">
          {userMedia.map((media, index) => (
            <div key={index} className="gallery-item">
              <img src={media} alt={`Media ${index + 1}`} />
            </div>
          ))}
        </div>

        {/* Botón central de captura */}
        <div className="capture-button">
          <button className="capture-btn" onClick={handleTakePhoto}>
            <div className="capture-inner"></div>
          </button>
        </div>
      </div>
    </div>
  );
}