import { useState, useEffect } from 'react';

interface CreateDynamicProps {
  onNavigateBack: () => void;
  onNavigateToEditor?: (file: MediaFile) => void;
}

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
}

export default function CreateDynamic({ onNavigateBack, onNavigateToEditor }: CreateDynamicProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

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
    setSelectedFile(media);
    console.log('Archivo seleccionado:', media.file.name);
  };

  return (
    <div className="create-dynamic-container">
      <div className="create-dynamic-header">
        <button className="back-btn" onClick={onNavigateBack}>
          ←
        </button>
        <h2>Crear dinámica</h2>
      </div>

      <div className="create-dynamic-content">
        <div className="recientes-section">
          <div className="recientes-header">
            <span>Recientes</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          <div className="gallery-grid">
            {mediaFiles.length === 0 ? (
              <div className="no-media" onClick={triggerFileSelect}>
                <div className="add-media-btn">
                  <span>+</span>
                  <p>Agregar archivos</p>
                </div>
              </div>
            ) : (
              mediaFiles.map((media, index) => (
                <div 
                  key={index} 
                  className={`gallery-item ${selectedFile?.url === media.url ? 'selected' : ''}`}
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

        {selectedFile && (
          <button className="select-media-btn" onClick={() => onNavigateToEditor?.(selectedFile)}>
            Seleccionar
          </button>
        )}
      </div>
    </div>
  );
}