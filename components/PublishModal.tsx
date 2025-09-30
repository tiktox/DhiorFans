import { useState, useRef } from 'react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
}

export default function PublishModal({ isOpen, onClose, onPublish }: PublishModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'todo' | 'imagenes' | 'videos'>('todo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePublish = () => {
    if (selectedFile && title.trim()) {
      // Aquí iría la lógica para subir el archivo
      console.log('Publicando:', { file: selectedFile, title, description });
      onPublish();
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setMediaFilter('todo');
    onClose();
  };

  const isVideo = selectedFile?.type.startsWith('video/');
  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className="publish-modal-overlay">
      <div className="publish-modal">
        <div className="publish-header">
          <h2>Publicar</h2>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="publish-content">
          {!selectedFile ? (
            <>
              <div className="file-selector">
                <div className="media-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                </div>
                <p>Selecciona una imagen o video</p>
                
                <div className="media-filters">
                  <button 
                    className={`filter-btn ${mediaFilter === 'todo' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('todo')}
                  >
                    Todo
                  </button>
                  <button 
                    className={`filter-btn ${mediaFilter === 'imagenes' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('imagenes')}
                  >
                    Imágenes
                  </button>
                  <button 
                    className={`filter-btn ${mediaFilter === 'videos' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('videos')}
                  >
                    Videos
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="file-input"
                  accept={
                    mediaFilter === 'imagenes' ? 'image/*' :
                    mediaFilter === 'videos' ? 'video/*' :
                    'image/*,video/*'
                  }
                  onChange={handleFileSelect}
                />
                <button 
                  className="select-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar archivo
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="media-preview">
                {isVideo ? (
                  <video controls>
                    <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                  </video>
                ) : isImage ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Preview" />
                ) : null}
              </div>

              <div className="form-fields">
                <input
                  type="text"
                  className="title-input"
                  placeholder="Escribe un título llamativo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <textarea
                  className="description-input"
                  placeholder="Describe tu contenido..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="publish-actions">
                <button className="cancel-btn" onClick={handleClose}>
                  Cancelar
                </button>
                <button 
                  className="publish-btn"
                  onClick={handlePublish}
                  disabled={!title.trim()}
                >
                  Publicar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}