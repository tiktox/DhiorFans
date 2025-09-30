import { useState, useRef } from 'react';
import { auth } from '../lib/firebase';
import { getUserData } from '../lib/userService';
import { createPost } from '../lib/postService';
import { uploadFile } from '../lib/uploadService';

interface PublishProps {
  onNavigateHome: () => void;
  onPublish?: () => void;
}

export default function Publish({ onNavigateHome, onPublish }: PublishProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'todo' | 'imagenes' | 'videos'>('todo');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePublish = async () => {
    if (selectedFile && title.trim() && auth.currentUser && !isUploading) {
      setIsUploading(true);
      try {
        const userData = getUserData();
        if (!userData) {
          throw new Error('No se pudo obtener los datos del usuario');
        }
        const mediaUrl = await uploadFile(selectedFile, auth.currentUser.uid);
        const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
        
        const newPost = createPost({
          userId: auth.currentUser.uid,
          username: userData?.username || 'Usuario',
          profilePicture: userData?.profilePicture,
          title: title.trim(),
          description: description.trim(),
          mediaUrl,
          mediaType
        });
        
        // Limpiar formulario
        setSelectedFile(null);
        setTitle('');
        setDescription('');
        
        onPublish?.();
        onNavigateHome();
      } catch (error) {
        console.error('Error al publicar:', error);
        alert(error instanceof Error ? error.message : 'Error al publicar. Inténtalo de nuevo.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const isVideo = selectedFile?.type.startsWith('video/');
  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className="publish-container">
      <div className="publish-header">
        <button className="back-btn" onClick={onNavigateHome}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h2>Publicar</h2>
        <div></div>
      </div>

      <div className="publish-content">
        {!selectedFile ? (
          <div className="file-selector">
            <div className="media-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
            <h3>Selecciona tu contenido</h3>
            <p>Elige una imagen o video para compartir</p>
            
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
              className="select-media-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Seleccionar archivo
            </button>
          </div>
        ) : (
          <div className="publish-form">
            <div className="media-preview">
              {isVideo ? (
                <video controls>
                  <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                </video>
              ) : isImage ? (
                <img src={URL.createObjectURL(selectedFile)} alt="Preview" />
              ) : null}
            </div>

            <div className="form-section">
              <div className="input-group">
                <label>Título</label>
                <input
                  type="text"
                  className="title-input"
                  placeholder="Escribe un título llamativo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="input-group">
                <label>Descripción</label>
                <textarea
                  className="description-input"
                  placeholder="Describe tu contenido..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="publish-actions">
          <button className="cancel-btn" onClick={() => setSelectedFile(null)}>
            Cancelar
          </button>
          <button 
            className="publish-btn"
            onClick={handlePublish}
            disabled={!title.trim() || isUploading}
          >
            {isUploading ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      )}
    </div>
  );
}