import { useState, useRef, useCallback, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, saveUserData } from '../lib/userService';
import { createPost } from '../lib/postService';
import { uploadFile } from '../lib/uploadService';
import FullscreenButton from './FullscreenButton';

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
}

interface ImageData extends MediaFile {
  overlayText: string;
  textStyles: {
    position: { x: number; y: number };
    size: number;
    color: string;
    fontFamily: string;
    style: string;
    rotation: number;
  };
}

interface MultiImageEditorProps {
  mediaFiles: MediaFile[];
  onNavigateBack: () => void;
  onPublish: () => void;
}

export default function MultiImageEditor({ mediaFiles, onNavigateBack, onPublish }: MultiImageEditorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [images, setImages] = useState<ImageData[]>(
    mediaFiles.map(file => ({
      ...file,
      overlayText: '',
      textStyles: {
        position: { x: 50, y: 50 },
        size: 16,
        color: '#ffffff',
        fontFamily: 'Arial',
        style: 'normal',
        rotation: 0
      }
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showTextControls, setShowTextControls] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const [fontIndex, setFontIndex] = useState(0);
  
  const colors = ['#ffffff', '#0066ff', '#000000', '#ff0000', '#ffff00', '#00ff00', '#ff00ff', '#00ffff'];
  const fonts = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Comic Sans MS', 'Impact', 'Trebuchet MS'];
  const scrollRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];

  const updateCurrentImage = (updates: Partial<ImageData>) => {
    setImages(prev => prev.map((img, i) => i === currentIndex ? { ...img, ...updates } : img));
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'right' && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, type: 'mouse' | 'touch') => {
    if (showTextControls) return;
    setIsDragging(true);
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    const clientX = type === 'mouse' ? (e as React.MouseEvent).clientX : (e as React.TouchEvent).touches[0].clientX;
    const clientY = type === 'mouse' ? (e as React.MouseEvent).clientY : (e as React.TouchEvent).touches[0].clientY;
    
    const offsetX = clientX - rect.left - (currentImage.textStyles.position.x * rect.width / 100);
    const offsetY = clientY - rect.top - (currentImage.textStyles.position.y * rect.height / 100);
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const moveX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const moveY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
      
      const newX = ((moveX - rect.left - offsetX) / rect.width) * 100;
      const newY = ((moveY - rect.top - offsetY) / rect.height) * 100;
      updateCurrentImage({
        textStyles: {
          ...currentImage.textStyles,
          position: { 
            x: Math.max(0, Math.min(90, newX)), 
            y: Math.max(5, Math.min(85, newY)) 
          }
        }
      });
    };
    
    const handleEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  const handleColorChange = () => {
    const nextIndex = (colorIndex + 1) % colors.length;
    setColorIndex(nextIndex);
    updateCurrentImage({
      textStyles: { ...currentImage.textStyles, color: colors[nextIndex] }
    });
  };

  const handleFontChange = () => {
    const nextIndex = (fontIndex + 1) % fonts.length;
    setFontIndex(nextIndex);
    updateCurrentImage({
      textStyles: { ...currentImage.textStyles, fontFamily: fonts[nextIndex] }
    });
  };

  const handleTextWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -2 : 2;
    updateCurrentImage({
      textStyles: {
        ...currentImage.textStyles,
        size: Math.max(12, Math.min(48, currentImage.textStyles.size + delta))
      }
    });
  };

  const handlePublish = useCallback(async () => {
    if (!title.trim() || !auth.currentUser || isUploading) return;

    setIsUploading(true);
    
    try {
      const userData = await getUserData();
      if (!userData) throw new Error('No se pudo obtener los datos del usuario');

      // Subir todas las imágenes
      const uploadPromises = images.map(img => uploadFile(img.file, auth.currentUser!.uid));
      const mediaUrls = await Promise.all(uploadPromises);

      const postData = {
        userId: auth.currentUser.uid,
        title: title.trim(),
        description: '',
        mediaUrl: mediaUrls[0],
        mediaType: 'multi-image' as any,
        mediaUrls,
        imagesData: images.map((img, i) => ({
          url: mediaUrls[i],
          overlayText: img.overlayText.trim(),
          textStyles: img.textStyles
        }))
      };

      await Promise.all([
        createPost(postData),
        saveUserData({ posts: userData.posts + 1 })
      ]);

      onPublish();
    } catch (error) {
      console.error('Error al publicar:', error);
      alert(error instanceof Error ? error.message : 'Error del cliente. Verifica tu conexión.');
    } finally {
      setIsUploading(false);
    }
  }, [title, auth.currentUser, isUploading, images, onPublish]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: currentIndex * scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const canPublish = title.trim() && !isUploading && auth.currentUser;

  return (
    <div className="multi-image-editor">
      <FullscreenButton />
      
      <div className="basic-editor-header">
        <div className="header-content">
          <button className="back-btn" onClick={onNavigateBack}>←</button>
          <div className="audio-section">
            <button className="color-circle-btn" onClick={handleColorChange} title="Colores de para la descripción" />
            <button className="font-btn" onClick={handleFontChange} title="tipos de fuentes">A</button>
          </div>
        </div>
      </div>

      <div className="multi-image-content">
        <div className="images-scroll-container" ref={scrollRef}>
          {images.map((image, index) => (
            <div key={index} className={`image-slide ${index === currentIndex ? 'active' : ''}`}>
              <img src={image.url} alt={`Image ${index + 1}`} className="editor-media" />
              
              {index === currentIndex && (
                <div 
                  ref={textRef}
                  className={`draggable-text ${showTextControls ? 'editing' : ''}`}
                  style={{
                    left: `${image.textStyles.position.x}%`,
                    top: `${image.textStyles.position.y}%`,
                    fontSize: `${image.textStyles.size}px`,
                    color: image.textStyles.color,
                    fontFamily: image.textStyles.fontFamily,
                    transform: `translate(-50%, -50%) rotate(${image.textStyles.rotation}deg)`
                  }}
                  onWheel={handleTextWheel}
                  onMouseDown={(e) => handleDragStart(e, 'mouse')}
                  onTouchStart={(e) => handleDragStart(e, 'touch')}
                  onClick={() => setShowTextControls(true)}
                >
                  {showTextControls ? (
                    <input
                      type="text"
                      placeholder="Escribe algo....."
                      value={image.overlayText}
                      onChange={(e) => updateCurrentImage({ overlayText: e.target.value })}
                      className="text-input-field"
                      style={{ fontFamily: image.textStyles.fontFamily }}
                      maxLength={200}
                      autoFocus
                      onBlur={() => setShowTextControls(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setShowTextControls(false)}
                    />
                  ) : (
                    <span className="text-display" style={{ fontFamily: image.textStyles.fontFamily }}>
                      {image.overlayText || 'Escribe algo.....'}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {currentIndex > 0 && (
          <button className="nav-btn nav-left" onClick={() => handleScroll('left')}>‹</button>
        )}
        {currentIndex < images.length - 1 && (
          <button className="nav-btn nav-right" onClick={() => handleScroll('right')}>›</button>
        )}

        <div className="image-indicators">
          {images.map((_, i) => (
            <div key={i} className={`indicator ${i === currentIndex ? 'active' : ''}`} onClick={() => setCurrentIndex(i)} />
          ))}
        </div>
      </div>

      <div className="bottom-section">
        <div className="input-row">
          <input
            type="text"
            placeholder="Agregar un título..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            maxLength={100}
          />
          
          <button 
            className={`publish-btn ${canPublish ? 'active' : ''}`}
            onClick={handlePublish}
            disabled={!canPublish}
          >
            {isUploading ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
