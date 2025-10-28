import { useState, useRef, useCallback, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, saveUserData } from '../lib/userService';
import { createPost } from '../lib/postService';
import { uploadFile } from '../lib/uploadService';
import { AudioService } from '../lib/audioService';
import { VideoAudioMerger } from '../lib/videoAudioMerger';
import AudioGallery from './AudioGallery';
import FullscreenButton from './FullscreenButton';
import AudioWaveSelector from './AudioWaveSelector';

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
  audioFile?: File;
  audioUrl?: string;
}

interface BasicEditorProps {
  mediaFile: MediaFile;
  multipleImages?: MediaFile[];
  onNavigateBack: () => void;
  onPublish: () => void;
  onOpenAudioEditor?: (audioFile: File) => void;
  onOpenAudioGallery?: () => void;
  isTextMode?: boolean;
}

export default function BasicEditor({ mediaFile, multipleImages, onNavigateBack, onPublish, onOpenAudioEditor, onOpenAudioGallery, isTextMode }: BasicEditorProps) {
  const [images, setImages] = useState<MediaFile[]>(multipleImages || [mediaFile]);
  const isMultiImage = images.length > 1;
  const [currentImageIndex, setCurrentImageIndex] = useState(images.length - 1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number>(0);
  const isDraggingImage = useRef<boolean>(false);
  const startOffset = useRef<number>(0);
  const isTextModeActive = isTextMode || mediaFile.file.name === 'text_background.jpg';
  const [title, setTitle] = useState('');
  const [overlayText, setOverlayText] = useState('');
  const [imageTexts, setImageTexts] = useState<string[]>(multipleImages ? multipleImages.map(() => '') : ['']);
  const [imageTextStyles, setImageTextStyles] = useState<any[]>(multipleImages ? multipleImages.map(() => ({
    position: { x: 50, y: 50 },
    size: 16,
    color: '#ffffff',
    fontFamily: 'Arial',
    style: 'normal',
    rotation: 0
  })) : []);
  const [audioFile, setAudioFile] = useState<File | null>(mediaFile.audioFile || null);
  const [selectedAudioUrl, setSelectedAudioUrl] = useState<string>(mediaFile.audioUrl || '');
  const [selectedAudioName, setSelectedAudioName] = useState<string>(mediaFile.audioFile?.name || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAudioGallery, setShowAudioGallery] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [textSize, setTextSize] = useState(16);
  const [textStyle, setTextStyle] = useState('normal');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [colorIndex, setColorIndex] = useState(0);
  const [fontIndex, setFontIndex] = useState(0);
  const [showTextControls, setShowTextControls] = useState(false);
  const [textRotation, setTextRotation] = useState(0);
  const [showWaveSelector, setShowWaveSelector] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState({ start: 0, end: 60 });
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isMergingVideo, setIsMergingVideo] = useState(false);
  
  const colors = ['#ffffff', '#0066ff', '#000000', '#ff0000', '#ffff00', '#00ff00', '#ff00ff', '#00ffff'];
  const fonts = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Comic Sans MS', 'Impact', 'Trebuchet MS'];
  const audioInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const handleImageTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    touchStartX.current = e.touches[0].clientX;
    isDraggingImage.current = true;
    if (wrapperRef.current) {
      wrapperRef.current.style.transition = 'none';
    }
  };

  const handleImageTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingImage.current || !wrapperRef.current || !scrollRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    const containerWidth = scrollRef.current.offsetWidth;
    const offset = -currentImageIndex * 100 + (diff / containerWidth) * 100;
    wrapperRef.current.style.transform = `translateX(${offset}%)`;
  };

  const handleImageTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingImage.current || !wrapperRef.current || !scrollRef.current) return;
    isDraggingImage.current = false;
    
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX.current;
    const containerWidth = scrollRef.current.offsetWidth;
    const threshold = containerWidth * 0.2;
    
    wrapperRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    let newIndex = currentImageIndex;
    
    if (diff < -threshold && currentImageIndex < images.length - 1) {
      newIndex = currentImageIndex + 1;
    } else if (diff > threshold && currentImageIndex > 0) {
      newIndex = currentImageIndex - 1;
    }
    
    setCurrentImageIndex(newIndex);
    wrapperRef.current.style.transform = `translateX(-${newIndex * 100}%)`;
  };

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      wrapperRef.current.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    }
  }, [currentImageIndex]);

  const handleAddMoreImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || images.length >= 7) return;
    
    const newImages: MediaFile[] = [];
    const remainingSlots = 7 - images.length;
    
    Array.from(files).slice(0, remainingSlots).forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newImages.push({ url, file, type: 'image' });
      }
    });
    
    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      setImageTexts(prev => [...prev, ...newImages.map(() => '')]);
      setImageTextStyles(prev => [...prev, ...newImages.map(() => ({
        position: { x: 50, y: 50 },
        size: 16,
        color: '#ffffff',
        fontFamily: 'Arial',
        style: 'normal',
        rotation: 0
      }))]);
      const newIndex = updatedImages.length - 1;
      setCurrentImageIndex(newIndex);
      setTimeout(() => {
        if (wrapperRef.current) {
          wrapperRef.current.style.transform = `translateX(-${newIndex * 100}%)`;
        }
      }, 50);
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, type: 'mouse' | 'touch') => {
    if (showTextControls) return;
    
    setIsDragging(true);
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    const clientX = type === 'mouse' ? (e as React.MouseEvent).clientX : (e as React.TouchEvent).touches[0].clientX;
    const clientY = type === 'mouse' ? (e as React.MouseEvent).clientY : (e as React.TouchEvent).touches[0].clientY;
    
    const currentPos = isMultiImage ? imageTextStyles[currentImageIndex]?.position || { x: 50, y: 50 } : textPosition;
    const offsetX = clientX - rect.left - (currentPos.x * rect.width / 100);
    const offsetY = clientY - rect.top - (currentPos.y * rect.height / 100);
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const moveX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const moveY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
      
      const newX = ((moveX - rect.left - offsetX) / rect.width) * 100;
      const newY = ((moveY - rect.top - offsetY) / rect.height) * 100;
      const newPosition = { 
        x: Math.max(0, Math.min(90, newX)), 
        y: Math.max(5, Math.min(85, newY)) 
      };
      
      if (isMultiImage) {
        const newStyles = [...imageTextStyles];
        newStyles[currentImageIndex] = { ...newStyles[currentImageIndex], position: newPosition };
        setImageTextStyles(newStyles);
      } else {
        setTextPosition(newPosition);
      }
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

  const handleAudioSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea un archivo de audio por extensión si el tipo MIME no está disponible
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma', '.opus'];
      const isAudio = file.type.startsWith('audio/') || 
                     audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isAudio) {
        alert('Por favor selecciona un archivo de audio válido.');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('El audio es muy grande. Máximo 10MB.');
        return;
      }
      
      setAudioFile(file);
      setSelectedAudioName(file.name);
      setShowWaveSelector(true);
      setIsVideoMuted(true);
    }
  };

  const handleTimeSelect = (startTime: number, endTime: number) => {
    setSelectedTimeRange({ start: startTime, end: endTime });
  };

  const handleUseAudioSelection = (audioBlob: Blob, startTime: number, endTime: number) => {
    const processedAudioFile = new File([audioBlob], `selected_${selectedAudioName}`, { type: 'audio/wav' });
    setAudioFile(processedAudioFile);
    setSelectedTimeRange({ start: startTime, end: endTime });
    setShowWaveSelector(false);
    setIsVideoMuted(true);
    
    // Limpiar audio anterior
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  const handleUseGalleryAudio = (audioUrl: string, audioName: string, audioBlob?: Blob) => {
    setSelectedAudioUrl(audioUrl);
    setSelectedAudioName(audioName);
    if (audioBlob) {
      const audioFile = new File([audioBlob], audioName, { type: 'audio/wav' });
      setAudioFile(audioFile);
    } else {
      setAudioFile(null);
    }
    setIsVideoMuted(true);
    setShowAudioGallery(false);
  };

  const toggleAudioPreview = () => {
    const audioSource = audioFile ? URL.createObjectURL(audioFile) : selectedAudioUrl;
    if (!audioSource) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
      audioRef.current.src = audioSource;
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current && selectedTimeRange.end > 0) {
          if (audioRef.current.currentTime >= selectedTimeRange.end) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        }
      });
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = selectedTimeRange.start;
      audioRef.current.play().catch(() => {
        alert('Error al reproducir audio');
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleColorChange = () => {
    const nextIndex = (colorIndex + 1) % colors.length;
    setColorIndex(nextIndex);
    setTextColor(colors[nextIndex]);
    if (isMultiImage) {
      const newStyles = [...imageTextStyles];
      newStyles[currentImageIndex] = { ...newStyles[currentImageIndex], color: colors[nextIndex] };
      setImageTextStyles(newStyles);
    }
  };

  const handleFontChange = () => {
    const nextIndex = (fontIndex + 1) % fonts.length;
    setFontIndex(nextIndex);
    setFontFamily(fonts[nextIndex]);
    if (isMultiImage) {
      const newStyles = [...imageTextStyles];
      newStyles[currentImageIndex] = { ...newStyles[currentImageIndex], fontFamily: fonts[nextIndex] };
      setImageTextStyles(newStyles);
    }
  };

  const handleTextWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -2 : 2;
    if (isMultiImage) {
      const newStyles = [...imageTextStyles];
      const currentSize = newStyles[currentImageIndex]?.size || 16;
      newStyles[currentImageIndex] = { ...newStyles[currentImageIndex], size: Math.max(12, Math.min(48, currentSize + delta)) };
      setImageTextStyles(newStyles);
    } else {
      setTextSize(prev => Math.max(12, Math.min(48, prev + delta)));
    }
  };

  const handleTextPinch = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (!textRef.current?.dataset.lastDistance) {
        textRef.current!.dataset.lastDistance = distance.toString();
        return;
      }
      
      const lastDistance = parseFloat(textRef.current.dataset.lastDistance);
      const scale = distance / lastDistance;
      
      if (scale > 1.1) {
        setTextSize(prev => Math.min(48, prev + 2));
        textRef.current!.dataset.lastDistance = distance.toString();
      } else if (scale < 0.9) {
        setTextSize(prev => Math.max(12, prev - 2));
        textRef.current!.dataset.lastDistance = distance.toString();
      }
    }
  };

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const handlePublish = useCallback(async () => {
    if (!title.trim() || !auth.currentUser || isUploading) return;

    cleanupAudio();
    setIsUploading(true);
    
    try {
      const userData = await getUserData();
      if (!userData) throw new Error('No se pudo obtener los datos del usuario');

      // Si es multi-imagen
      if (images.length > 1) {
        const uploadPromises = images.map(img => uploadFile(img.file, auth.currentUser!.uid));
        const mediaUrls = await Promise.all(uploadPromises);

        const postData: any = {
          userId: auth.currentUser.uid,
          title: title.trim(),
          mediaType: 'multi-image',
          mediaUrl: mediaUrls[0],
          mediaUrls,
          imagesData: images.map((img, i) => ({
            url: mediaUrls[i],
            overlayText: imageTexts[i]?.trim() || '',
            textStyles: imageTextStyles[i]
          }))
        };

        await Promise.all([
          createPost(postData),
          saveUserData({ posts: userData.posts + 1 })
        ]);

        onPublish();
        return;
      }

      // Publicación normal
      const postData: any = {
        userId: auth.currentUser.uid,
        title: title.trim(),
        mediaType: images[0].type
      };
      
      if (overlayText.trim()) {
        postData.description = overlayText.trim();
        postData.overlayText = overlayText.trim();
        postData.textStyles = {
          position: textPosition,
          size: textSize,
          color: textColor,
          fontFamily: fontFamily,
          style: textStyle,
          rotation: textRotation
        };
      }
      
      let finalMediaFile = images[0].file;
      
      // Si es video con audio, fusionarlos
      if (images[0].type === 'video' && audioFile) {
        setIsMergingVideo(true);
        try {
          const mergedVideoBlob = await VideoAudioMerger.mergeVideoWithAudio(
            images[0].file,
            audioFile,
            selectedTimeRange.start,
            selectedTimeRange.end
          );
          finalMediaFile = new File([mergedVideoBlob], `video_${Date.now()}.webm`, { type: 'video/webm' });
          console.log('✅ Video fusionado con audio exitosamente');
        } catch (mergeError) {
          console.error('Error fusionando video:', mergeError);
          alert('Error al fusionar video con audio. Se publicará sin audio.');
        } finally {
          setIsMergingVideo(false);
        }
      }
      
      // Subir archivo final
      const mediaUrl = await uploadFile(finalMediaFile, auth.currentUser.uid);
      postData.mediaUrl = mediaUrl;

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
      setIsMergingVideo(false);
    }
  }, [title, auth.currentUser, isUploading, audioFile, selectedTimeRange, textPosition, textSize, textColor, fontFamily, textStyle, textRotation, overlayText, onPublish, cleanupAudio, images, imageTexts, imageTextStyles]);

  // Actualizar audio cuando cambie mediaFile
  useEffect(() => {
    if (mediaFile.audioFile && mediaFile.audioUrl) {
      setAudioFile(mediaFile.audioFile);
      setSelectedAudioUrl(mediaFile.audioUrl);
      setSelectedAudioName(mediaFile.audioFile.name);
    }
  }, [mediaFile]);

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // Actualizar reproductor cuando cambie el rango de tiempo
  useEffect(() => {
    if (audioRef.current && selectedTimeRange.start !== 0) {
      audioRef.current.currentTime = selectedTimeRange.start;
    }
  }, [selectedTimeRange]);

  const canPublish = title.trim() && !isUploading && auth.currentUser;

  return (
    <div className={`basic-editor ${isTextModeActive ? 'text-mode' : ''}`}>
      <FullscreenButton />
      
      <div className="basic-editor-header">
        <div className="header-content">
        <button className="back-btn" onClick={() => { cleanupAudio(); onNavigateBack(); }}>
          ←
        </button>
        <div className="audio-section">
          <button 
            className="audio-btn"
            onClick={() => audioInputRef.current?.click()}
          >
            <svg className="music-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <span className="scrolling-text">
              Asegurate de leer nuestra condicciones d...
            </span>
          </button>
          <button 
            className="color-circle-btn"
            onClick={handleColorChange}
            title="Colores de para la descripción"
          />
          <button 
            className="font-btn"
            onClick={handleFontChange}
            title="tipos de fuentes"
          >
            A
          </button>
          <button 
            className="music-btn"
            onClick={() => onOpenAudioGallery ? onOpenAudioGallery() : setShowAudioGallery(true)}
            title="Galería de audio"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </button>
        </div>
        </div>
        

      </div>

      <div className="basic-editor-content">
        {isMultiImage && images.length > 1 && (
          <>
            <div 
              className="multi-image-scroll" 
              ref={scrollRef}
              onTouchStart={handleImageTouchStart}
              onTouchMove={handleImageTouchMove}
              onTouchEnd={handleImageTouchEnd}
            >
              <div className="multi-image-wrapper" ref={wrapperRef}>
              {images.map((img, index) => (
                <div key={index} className={`image-slide ${index === currentImageIndex ? 'active' : ''}`}>
                  <img src={img.url} alt={`Image ${index + 1}`} className="editor-media" />
                  
                  {index === currentImageIndex && (
                    <div 
                      ref={textRef}
                      className={`draggable-text ${showTextControls ? 'editing' : ''}`}
                      style={{
                        left: `${imageTextStyles[index]?.position.x || 50}%`,
                        top: `${imageTextStyles[index]?.position.y || 50}%`,
                        fontSize: `${imageTextStyles[index]?.size || 16}px`,
                        color: imageTextStyles[index]?.color || '#ffffff',
                        fontFamily: imageTextStyles[index]?.fontFamily || 'Arial',
                        transform: `translate(-50%, -50%) rotate(${imageTextStyles[index]?.rotation || 0}deg)`
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
                          value={imageTexts[index] || ''}
                          onChange={(e) => {
                            const newTexts = [...imageTexts];
                            newTexts[index] = e.target.value;
                            setImageTexts(newTexts);
                          }}
                          className="text-input-field"
                          style={{ fontFamily: imageTextStyles[index]?.fontFamily || 'Arial' }}
                          maxLength={200}
                          autoFocus
                          onBlur={() => setShowTextControls(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setShowTextControls(false)}
                        />
                      ) : (
                        <span className="text-display" style={{ fontFamily: imageTextStyles[index]?.fontFamily || 'Arial' }}>
                          {imageTexts[index] || 'Escribe algo.....'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>

            {images.length < 7 && mediaFile.type === 'image' && (
              <button className="add-gallery-btn" onClick={() => galleryInputRef.current?.click()} title="Agregar más imágenes">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
                <span className="plus-icon">+</span>
              </button>
            )}

            <div className="image-indicators">
              {images.map((_, i) => (
                <div key={i} className={`indicator ${i === currentImageIndex ? 'active' : ''}`} />
              ))}
            </div>
          </>
        )}

        {images.length < 7 && mediaFile.type === 'image' && !isMultiImage && (
          <button className="add-gallery-btn" onClick={() => galleryInputRef.current?.click()} title="Agregar más imágenes">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <span className="plus-icon">+</span>
          </button>
        )}
        
        {!isMultiImage && (
        <div className="media-container">
          {mediaFile.type === 'video' ? (
            <>
              <video ref={videoRef} src={mediaFile.url} className="editor-media" autoPlay loop muted={isVideoMuted} />
              {(audioFile || selectedAudioUrl) && (
                <button 
                  className="video-mute-toggle"
                  onClick={() => setIsVideoMuted(!isVideoMuted)}
                  title={isVideoMuted ? "Activar audio del video" : "Silenciar video"}
                >
                  {isVideoMuted ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 5 6 9H2v6h4l5 4V5ZM22 9l-6 6M16 9l6 6"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 5 6 9H2v6h4l5 4V5ZM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  )}
                </button>
              )}
            </>
          ) : (
            <img src={mediaFile.url} alt="Media" className="editor-media" />
          )}
          
          <div 
            ref={textRef}
            className={`draggable-text ${showTextControls ? 'editing' : ''}`}
            style={{
              left: `${textPosition.x}%`,
              top: `${textPosition.y}%`,
              fontSize: `${textSize}px`,
              fontWeight: textStyle === 'bold' ? 'bold' : 'normal',
              fontStyle: textStyle === 'italic' ? 'italic' : 'normal',
              textDecoration: textStyle === 'underline' ? 'underline' : 'none',
              color: textColor,
              fontFamily: fontFamily,
              textShadow: textStyle === 'shadow' ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
              transform: `translate(-50%, -50%) rotate(${textRotation}deg)`
            }}
            onWheel={handleTextWheel}
            onTouchMove={handleTextPinch}
            onMouseDown={(e) => handleDragStart(e, 'mouse')}
            onTouchStart={(e) => handleDragStart(e, 'touch')}
            onClick={() => setShowTextControls(true)}
          >
            {showTextControls ? (
              <input
                type="text"
                placeholder={isTextModeActive ? "Escribe tu frase..." : "Escribe algo....."}
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                className="text-input-field"
                style={{ fontFamily: fontFamily }}
                maxLength={200}
                autoFocus
                onBlur={() => setShowTextControls(false)}
                onKeyDown={(e) => e.key === 'Enter' && setShowTextControls(false)}
              />
            ) : (
              <span className="text-display" style={{ fontFamily: fontFamily }}>
                {overlayText || (isTextModeActive ? 'Toca para escribir...' : 'Escribe algo.....')}
              </span>
            )}
          </div>
          
          <div className="text-controls">
          </div>
        </div>
        )}

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
              {isMergingVideo ? 'Fusionando...' : isUploading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.wma,.opus"
        onChange={handleAudioSelect}
        style={{ display: 'none' }}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddMoreImages}
        style={{ display: 'none' }}
      />

      {(audioFile || selectedAudioUrl) && (
        <div className="audio-preview">
          <span>🎵 {audioFile ? audioFile.name : selectedAudioName}</span>
          <button onClick={toggleAudioPreview} title={isPlaying ? "Pausar" : "Reproducir (máx. 1 min)"}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
            setAudioFile(null);
            setSelectedAudioUrl('');
            setSelectedAudioName('');
            setIsVideoMuted(false);
          }}>×</button>
        </div>
      )}

      {showAudioGallery && (
        <AudioGallery
          onNavigateBack={() => setShowAudioGallery(false)}
          onUseAudio={handleUseGalleryAudio}
        />
      )}

      {!isMultiImage && showWaveSelector && audioFile && (
        <AudioWaveSelector
          audioFile={audioFile}
          onTimeSelect={handleTimeSelect}
          onClose={() => {
            setShowWaveSelector(false);
            // Mantener el audio original si el usuario cancela
            if (!selectedAudioUrl) {
              setAudioFile(null);
              setSelectedAudioName('');
              setIsVideoMuted(false);
            }
          }}
          onUseSelection={handleUseAudioSelection}
        />
      )}
    </div>
  );
}