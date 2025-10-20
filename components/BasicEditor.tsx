import { useState, useRef, useCallback, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, saveUserData } from '../lib/userService';
import { createPost } from '../lib/postService';
import { uploadFile } from '../lib/uploadService';
import AudioGallery from './AudioGallery';
import FullscreenButton from './FullscreenButton';

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
  audioFile?: File;
  audioUrl?: string;
}

interface BasicEditorProps {
  mediaFile: MediaFile;
  onNavigateBack: () => void;
  onPublish: () => void;
  onOpenAudioEditor?: (audioFile: File) => void;
  onOpenAudioGallery?: () => void;
}

export default function BasicEditor({ mediaFile, onNavigateBack, onPublish, onOpenAudioEditor, onOpenAudioGallery }: BasicEditorProps) {
  const [title, setTitle] = useState('');
  const [overlayText, setOverlayText] = useState('');
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
  
  const colors = ['#ffffff', '#0066ff', '#000000', '#ff0000', '#ffff00', '#00ff00', '#ff00ff', '#00ffff'];
  const fonts = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Comic Sans MS', 'Impact', 'Trebuchet MS'];
  const audioInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, type: 'mouse' | 'touch') => {
    if (showTextControls) return;
    
    setIsDragging(true);
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    const clientX = type === 'mouse' ? (e as React.MouseEvent).clientX : (e as React.TouchEvent).touches[0].clientX;
    const clientY = type === 'mouse' ? (e as React.MouseEvent).clientY : (e as React.TouchEvent).touches[0].clientY;
    
    const offsetX = clientX - rect.left - (textPosition.x * rect.width / 100);
    const offsetY = clientY - rect.top - (textPosition.y * rect.height / 100);
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const moveX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const moveY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
      
      const newX = ((moveX - rect.left - offsetX) / rect.width) * 100;
      const newY = ((moveY - rect.top - offsetY) / rect.height) * 100;
      setTextPosition({ 
        x: Math.max(0, Math.min(90, newX)), 
        y: Math.max(5, Math.min(85, newY)) 
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

  const handleAudioSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      if (onOpenAudioEditor) {
        onOpenAudioEditor(file);
      } else {
        setAudioFile(file);
      }
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
    setShowAudioGallery(false);
  };

  const toggleAudioPreview = () => {
    const audioSource = audioFile ? URL.createObjectURL(audioFile) : selectedAudioUrl;
    if (!audioSource) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSource);
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      
      // Limitar a 1 minuto
      setTimeout(() => {
        if (audioRef.current && isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }, 60000);
    }
  };

  const handleColorChange = () => {
    const nextIndex = (colorIndex + 1) % colors.length;
    setColorIndex(nextIndex);
    setTextColor(colors[nextIndex]);
  };

  const handleFontChange = () => {
    const nextIndex = (fontIndex + 1) % fonts.length;
    setFontIndex(nextIndex);
    setFontFamily(fonts[nextIndex]);
  };

  const handleTextWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -2 : 2;
    setTextSize(prev => Math.max(12, Math.min(48, prev + delta)));
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
      const [userData, mediaUrl, audioUrl] = await Promise.all([
        getUserData(),
        uploadFile(mediaFile.file, auth.currentUser.uid),
        audioFile ? uploadFile(audioFile, auth.currentUser.uid) : Promise.resolve(selectedAudioUrl)
      ]);
      
      if (!userData) {
        throw new Error('No se pudo obtener los datos del usuario');
      }

      const textStyles = {
        position: textPosition,
        size: textSize,
        color: textColor,
        fontFamily: fontFamily,
        style: textStyle,
        rotation: textRotation
      };

      const postData: any = {
        userId: auth.currentUser.uid,
        title: title.trim(),
        description: overlayText.trim(),
        overlayText: overlayText.trim(),
        mediaUrl,
        mediaType: mediaFile.type,
        textStyles
      };
      
      if (audioUrl) {
        postData.audioUrl = audioUrl;
      }

      await Promise.all([
        createPost(postData),
        saveUserData({ posts: userData.posts + 1 })
      ]);

      onPublish();
    } catch (error) {
      console.error('Error al publicar:', error);
      alert(error instanceof Error ? error.message : 'Error al publicar. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  }, [title, auth.currentUser, isUploading, mediaFile.file, audioFile, textPosition, textSize, textColor, fontFamily, textStyle, textRotation, overlayText, mediaFile.type, onPublish]);

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

  const canPublish = title.trim() && !isUploading && auth.currentUser;

  return (
    <div className="basic-editor">
      <FullscreenButton />
      <div className="basic-editor-header">
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
              Agrega tu música o sonido (solo si es tuyo o tienes permiso para usarlo).
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

      <div className="basic-editor-content">
        <div className="media-container">
          {mediaFile.type === 'video' ? (
            <video src={mediaFile.url} className="editor-media" autoPlay loop controls />
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
                placeholder="Escribe algo....."
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
                {overlayText || 'Escribe algo.....'}
              </span>
            )}
          </div>
          
          <div className="text-controls">
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

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioSelect}
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
          }}>×</button>
        </div>
      )}

      {showAudioGallery && (
        <AudioGallery
          onNavigateBack={() => setShowAudioGallery(false)}
          onUseAudio={handleUseGalleryAudio}
        />
      )}
    </div>
  );
}