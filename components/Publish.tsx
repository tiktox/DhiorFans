import { useState, useRef, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, saveUserData } from '../lib/userService';
import { createPost } from '../lib/postService';
import { uploadFile } from '../lib/uploadService';
import ContentTypeSelector from './ContentTypeSelector';
import CountdownSelector from './CountdownSelector';

interface PublishProps {
  onNavigateHome: () => void;
  onPublish?: () => void;
  onNavigateToCreatePost?: () => void;
  onNavigateToCreateDynamic?: () => void;
  onNavigateToEditor?: (mediaFile: MediaFile) => void;
}

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
}

export default function Publish({ onNavigateHome, onPublish, onNavigateToCreatePost, onNavigateToCreateDynamic, onNavigateToEditor }: PublishProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraInterface, setShowCameraInterface] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<'denied' | 'granted' | 'prompt'>('prompt');

  // Verificar permisos al cargar
  useEffect(() => {
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    try {
      const userData = await getUserData();
      if (userData.cameraPermission) {
        setCameraPermission(userData.cameraPermission);
      }
    } catch (error) {
      console.error('Error verificando permisos:', error);
    }
  };
  const [mediaFilter, setMediaFilter] = useState<'todo' | 'imagenes' | 'videos'>('todo');
  const contentTypes = [
    { id: 'dinamica', label: 'Crear Dinámica' },
    { id: 'publicacion', label: 'Publicación' },
    { id: 'escribir', label: 'Escribe Algo!!' },
    { id: 'live', label: 'Live' }
  ];
  const [activeIndex, setActiveIndex] = useState(1);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const mediaFile = {
        url: URL.createObjectURL(file),
        file,
        type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
      };
      // Detener cámara si está activa
      stopCamera();
      // Enviar archivo directamente al editor
      onNavigateToEditor?.(mediaFile);
    }
    // Limpiar input para permitir seleccionar el mismo archivo
    event.target.value = '';
  };

  const handlePublish = async () => {
    if (selectedFile && title.trim() && auth.currentUser && !isUploading) {
      setIsUploading(true);
      try {
        const userData = await getUserData();
        if (!userData) {
          throw new Error('No se pudo obtener los datos del usuario');
        }
        const mediaUrl = await uploadFile(selectedFile, auth.currentUser.uid);
        const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';

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

  const handleCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraPermission('granted');
      await saveUserData({ 
        cameraPermission: 'granted',
        microphonePermission: 'granted'
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setCameraPermission('denied');
      await saveUserData({ 
        cameraPermission: 'denied',
        microphonePermission: 'denied'
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleContentTypeChange = (index: number) => {
    setActiveIndex(index);
    
    const selectedType = contentTypes[index];
    
    // Para tipos con countdown, mostrar cuenta regresiva
    if (['dinamica', 'escribir', 'live'].includes(selectedType.id)) {
      setPendingSelection(selectedType.id);
      setShowCountdown(true);
      return;
    }
    
    // Solo para "Publicación" activar cámara inmediatamente
    if (selectedType.id === 'publicacion') {
      if (cameraPermission === 'granted') {
        handleCameraPermission();
      } else if (cameraPermission === 'prompt') {
        handleCameraPermission();
      }
    } else {
      stopCamera();
    }
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    
    if (pendingSelection === 'dinamica') {
      onNavigateToCreateDynamic?.();
    } else if (pendingSelection === 'escribir') {
      onNavigateToCreatePost?.();
    } else if (pendingSelection === 'live') {
      console.log('Navegando a Live');
    }
    
    setPendingSelection(null);
  };

  const handleCountdownCancel = () => {
    setShowCountdown(false);
    setPendingSelection(null);
    // Volver a publicación por defecto
    setActiveIndex(1);
  };



  const capturePhoto = () => {
    if (videoRef.current && cameraStream) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = new Date().getTime();
            const file = new File([blob], `photo_${timestamp}.jpg`, { type: 'image/jpeg' });
            const mediaFile = {
              url: URL.createObjectURL(file),
              file,
              type: 'image' as const
            };
            // Detener cámara antes de navegar
            stopCamera();
            // Enviar foto directamente al editor
            onNavigateToEditor?.(mediaFile);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (contentTypes[activeIndex].id === 'publicacion' && cameraPermission === 'granted') {
      handleCameraPermission();
    }
    return () => {
      stopCamera();
    };
  }, [activeIndex, cameraPermission]);

  // Limpiar cámara al desmontar componente
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const openSettings = () => {
    // En un entorno real, esto abriría la configuración del navegador
    alert('Por favor, permite el acceso a la cámara y micrófono en la configuración de tu navegador');
  };

  // Eliminar editor viejo - solo mostrar interfaz de cámara
  if (showCameraInterface) {
    return (
      <div className="camera-interface">
        <button className="camera-close-btn" onClick={() => { stopCamera(); onNavigateHome(); }}>
          ×
        </button>
        
        {cameraPermission === 'prompt' && (
          <div className="camera-permissions">
            <div className="permissions-message">
              Dhiorfans necesita acceder a la cámara y el micrófono
            </div>
            <button className="permissions-config-btn" onClick={handleCameraPermission}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
              </svg>
              Ir a configuración
            </button>
          </div>
        )}
        
        {cameraPermission === 'granted' && contentTypes[activeIndex].id === 'publicacion' && (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="camera-preview"
          />
        )}

        <div className="camera-bottom-bar">
          <ContentTypeSelector
            contentTypes={contentTypes}
            activeIndex={activeIndex}
            onSelectionChange={handleContentTypeChange}
          />
          

          
          <div className="capture-section">
            <div className="user-gallery">
              <button className="gallery-item" onClick={openGallery}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
              </button>
            </div>
            
            <div className="capture-button">
              {contentTypes[activeIndex].id === 'publicacion' && cameraPermission === 'granted' ? (
                <button className="capture-btn" onClick={capturePhoto}>
                  <div className="capture-inner"></div>
                </button>
              ) : (
                <div className="capture-btn disabled">
                  <div className="capture-inner"></div>
                </div>
              )}
            </div>
            
            <div className="capture-right-space"></div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          accept="image/*,video/*"
          onChange={handleFileSelect}
        />
        
        <CountdownSelector
          isActive={showCountdown}
          contentType={pendingSelection || ''}
          onCountdownComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
        />
      </div>
    );
  }

  // Editor viejo eliminado - ahora solo redirige al nuevo editor
  return null;
}