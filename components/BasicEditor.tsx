import { useState, useRef, useCallback } from 'react';
import { auth } from '../lib/firebase';
import { getUserData, saveUserData } from '../lib/userService';
import { createPost } from '../lib/postService';
import { uploadFile } from '../lib/uploadService';

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
}

interface BasicEditorProps {
  mediaFile: MediaFile;
  onNavigateBack: () => void;
  onPublish: () => void;
}

export default function BasicEditor({ mediaFile, onNavigateBack, onPublish }: BasicEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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
      setAudioFile(file);
    }
  };

  const toggleAudioPreview = () => {
    if (!audioFile) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(URL.createObjectURL(audioFile));
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

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !description.trim() || !auth.currentUser || isUploading) return;

    cleanupAudio();
    setIsUploading(true);
    try {
      const userData = await getUserData();
      if (!userData) {
        throw new Error('No se pudo obtener los datos del usuario');
      }

      const mediaUrl = await uploadFile(mediaFile.file, auth.currentUser.uid);
      let audioUrl = '';
      
      if (audioFile) {
        audioUrl = await uploadFile(audioFile, auth.currentUser.uid);
      }

      // Crear objeto con estilos del texto
      const textStyles = {
        position: textPosition,
        size: textSize,
        color: textColor,
        fontFamily: fontFamily,
        style: textStyle
      };

      await createPost({
        userId: auth.currentUser.uid,
        title: title.trim(),
        description: description.trim(),
        mediaUrl,
        mediaType: mediaFile.type,
        audioUrl: audioUrl || undefined,
        textStyles: textStyles
      });

      await saveUserData({ posts: userData.posts + 1 });
      onPublish();
    } catch (error) {
      console.error('Error al publicar:', error);
      alert(error instanceof Error ? error.message : 'Error al publicar. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const canPublish = title.trim() && description.trim();

  return (
    <div className="basic-editor">
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
              textShadow: textStyle === 'shadow' ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-input-field"
                style={{ fontFamily: fontFamily }}
                maxLength={200}
                autoFocus
                onBlur={() => setShowTextControls(false)}
                onKeyDown={(e) => e.key === 'Enter' && setShowTextControls(false)}
              />
            ) : (
              <span className="text-display" style={{ fontFamily: fontFamily }}>
                {description || 'Escribe algo.....'}
              </span>
            )}
          </div>
          
          {description && (
            <div className="">
              <div className="size-controls">
                <button onClick={() => setTextSize(Math.max(12, textSize - 2))}>A-</button>
                <button onClick={() => setTextSize(Math.min(24, textSize + 2))}>A+</button>
              </div>
              
              <div className="style-controls">
                <button 
                  className={textStyle === 'normal' ? 'active' : ''}
                  onClick={() => setTextStyle('normal')}
                >Aa</button>
                <button 
                  className={textStyle === 'bold' ? 'active' : ''}
                  onClick={() => setTextStyle('bold')}
                ><b>B</b></button>
                <button 
                  className={textStyle === 'italic' ? 'active' : ''}
                  onClick={() => setTextStyle('italic')}
                ><i>I</i></button>
                <button 
                  className={textStyle === 'shadow' ? 'active' : ''}
                  onClick={() => setTextStyle('shadow')}
                >S</button>
              </div>
              
              <div className="color-controls">
                <button 
                  className="color-btn"
                  style={{ background: '#ffffff' }}
                  onClick={() => setTextColor('#ffffff')}
                />
                <button 
                  className="color-btn"
                  style={{ background: '#000000' }}
                  onClick={() => setTextColor('#000000')}
                />
                <button 
                  className="color-btn"
                  style={{ background: '#ff4444' }}
                  onClick={() => setTextColor('#ff4444')}
                />
                <button 
                  className="color-btn"
                  style={{ background: '#44ff44' }}
                  onClick={() => setTextColor('#44ff44')}
                />
                <button 
                  className="color-btn"
                  style={{ background: '#4444ff' }}
                  onClick={() => setTextColor('#4444ff')}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bottom-section">
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
            disabled={!canPublish || isUploading}
          >
            {isUploading ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioSelect}
        style={{ display: 'none' }}
      />

      {audioFile && (
        <div className="audio-preview">
          <span>🎵 {audioFile.name}</span>
          <button onClick={toggleAudioPreview} title={isPlaying ? "Pausar" : "Reproducir (máx. 1 min)"}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
            setAudioFile(null);
          }}>×</button>
        </div>
      )}
    </div>
  );
}