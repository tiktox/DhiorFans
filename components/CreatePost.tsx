import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData } from '../lib/userService';
import { createPost } from '../lib/postService';
import { uploadFile } from '../lib/uploadService';

interface CreatePostProps {
  onNavigateBack: () => void;
  onPublish?: () => void;
}

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
}

export default function CreatePost({ onNavigateBack, onPublish }: CreatePostProps) {
  const [currentStep, setCurrentStep] = useState<'selector' | 'editor'>('selector');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

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
  };

  const handlePublish = async () => {
    if (!selectedFile || !title.trim() || !auth.currentUser || isPublishing) return;
    
    setIsPublishing(true);
    try {
      const userData = await getUserData();
      if (!userData) {
        throw new Error('No se pudo obtener los datos del usuario');
      }
      
      const mediaUrl = await uploadFile(selectedFile.file, auth.currentUser.uid);
      const mediaType = selectedFile.type;

      await createPost({
        userId: auth.currentUser.uid,
        title: title.trim(),
        description: description.trim(),
        mediaUrl,
        mediaType
      });

      // Actualizar contador de posts del usuario
      const { saveUserData } = await import('../lib/userService');
      await saveUserData({ posts: userData.posts + 1 });

      onPublish?.();
      onNavigateBack();
    } catch (error) {
      console.error('Error al publicar:', error);
      alert(error instanceof Error ? error.message : 'Error al publicar. Inténtalo de nuevo.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (currentStep === 'selector') {
    return (
      <div className="create-dynamic-container">
        <div className="create-dynamic-header">
          <button className="back-btn" onClick={onNavigateBack}>
            ←
          </button>
          <h2>Crear publicación</h2>
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
            <button className="select-media-btn" onClick={() => setCurrentStep('editor')}>
              Continuar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <button className="back-btn-editor" onClick={() => setCurrentStep('selector')}>
          ←
        </button>
      </div>

      <div className="editor-content">
        <div className="media-display">
          {selectedFile?.type === 'video' ? (
            <video src={selectedFile.url} controls className="editor-media" />
          ) : (
            <img src={selectedFile?.url} alt="Selected media" className="editor-media" />
          )}
          
          <div className="caption-overlay">
            <input
              type="text"
              placeholder="Escribe un título llamativo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="caption-input"
              maxLength={100}
            />
          </div>
        </div>

        <div className="editor-footer">
          <div className="keywords-section">
            <div className="keyword-input-section">
              <textarea
                placeholder="Describe tu contenido..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="keyword-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                maxLength={500}
              />
            </div>
            
            <button 
              className="publish-btn" 
              onClick={handlePublish}
              disabled={!title.trim() || isPublishing}
            >
              {isPublishing ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}