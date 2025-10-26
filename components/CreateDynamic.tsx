import { useState, useEffect } from 'react';

interface CreateDynamicProps {
  onNavigateBack: () => void;
  onNavigateToEditor?: (file: MediaFile) => void;
  onSwitchToPost?: () => void;
}

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
}

export default function CreateDynamic({ onNavigateBack, onNavigateToEditor, onSwitchToPost }: CreateDynamicProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);

  useEffect(() => {
    loadDeviceMedia();
  }, []);

  const loadDeviceMedia = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const mediaArray: MediaFile[] = [];
        Array.from(files).forEach(file => {
          const url = URL.createObjectURL(file);
          const type = file.type.startsWith('video/') ? 'video' : 'image';
          mediaArray.push({ url, file, type });
        });
        setMediaFiles(mediaArray);
      }
    };
  };

  const triggerFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newMedia: MediaFile[] = [];
        Array.from(files).forEach(file => {
          const url = URL.createObjectURL(file);
          const type = file.type.startsWith('video/') ? 'video' : 'image';
          newMedia.push({ url, file, type });
        });
        setMediaFiles(prev => [...prev, ...newMedia]);
      }
    };
    input.click();
  };

  const selectMedia = (media: MediaFile) => {
    setSelectedFiles(prev => {
      const isSelected = prev.find(f => f.url === media.url);
      if (isSelected) {
        return prev.filter(f => f.url !== media.url);
      } else {
        // Solo permitir selección múltiple de imágenes (máximo 7)
        if (media.type === 'image') {
          const currentImages = prev.filter(f => f.type === 'image');
          if (currentImages.length < 7) {
            return [...prev.filter(f => f.type === 'video'), media];
          }
          return prev;
        } else {
          // Si es video, solo permitir uno
          return [media];
        }
      }
    });
  };

  const handleContinue = () => {
    if (selectedFiles.length === 0) return;
    
    const images = selectedFiles.filter(f => f.type === 'image');
    
    // Si hay múltiples imágenes (2-7), enviar al MultiImageEditor
    if (images.length >= 2 && images.length <= 7) {
      if (onNavigateToEditor) {
        (onNavigateToEditor as any)(images);
      }
    } else {
      // Si es una sola imagen o un video, enviar al BasicEditor
      if (onNavigateToEditor) {
        onNavigateToEditor(selectedFiles[0]);
      }
    }
  };

  return (
    <div className="create-dynamic-container">
      <div className="create-dynamic-header">
        <button className="back-btn" onClick={onNavigateBack}>
          ←
        </button>
        <h2>Crear dinámica</h2>
        <button className="switch-mode-btn" onClick={onSwitchToPost}>
          Post
        </button>
      </div>

      <div className="create-dynamic-content">
        <div className="recientes-section">
          <div className="recientes-header">
            <span>Crear Dinámica</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          <div className="gallery-grid">
            {mediaFiles.length === 0 ? (
              <div className="no-media" onClick={triggerFileSelect}>
              </div>
            ) : (
              mediaFiles.map((media, index) => (
                <div 
                  key={index} 
                  className={`dynamic-gallery-item ${selectedFiles.find(f => f.url === media.url) ? 'selected' : ''}`}
                  onClick={() => selectMedia(media)}
                >
                  {media.type === 'video' ? (
                    <video src={media.url} />
                  ) : (
                    <img src={media.url} alt={`Media ${index + 1}`} />
                  )}
                  {media.type === 'video' && <div className="video-indicator">▶</div>}
                </div>
              ))
            )}
            <div className="add-more-btn" onClick={triggerFileSelect}>
              <span>+</span>
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <>
            <div className="selection-counter">
              {selectedFiles.length > 1 ? `${selectedFiles.length} imágenes seleccionadas` : '1 archivo seleccionado'}
            </div>
            <button className="select-media-btn" onClick={handleContinue}>
              Continuar
            </button>
          </>
        )}
      </div>
    </div>
  );
}