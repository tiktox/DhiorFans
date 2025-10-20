import { useState, useRef, useEffect } from 'react';
import { AudioService } from '../lib/audioService';
import { auth } from '../lib/firebase';
import styles from './AudioEditor.module.css';

const PlayPauseIcon = ({ isPlaying }: { isPlaying: boolean }) => {
  return isPlaying ? (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
      <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
    </svg>
  ) : (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M6 3V21L18 12L6 3Z" fill="currentColor"/>
    </svg>
  );
};

interface AudioEditorProps {
  audioFile: File;
  onNavigateBack: () => void;
  onUseAudio: (audioBlob: Blob, name: string, audioUrl?: string) => void;
  onPublishAudio: (audioBlob: Blob, name: string) => void;
  userId?: string;
}

export default function AudioEditor({ audioFile, onNavigateBack, onUseAudio, onPublishAudio, userId }: AudioEditorProps) {
  const [audioName, setAudioName] = useState('');
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(60);
  const [maxSelectionDuration] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(60);
  const [isSelecting, setIsSelecting] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadAudio = async () => {
      try {
        const validation = AudioService.validateAudioFile(audioFile);
        if (!validation.isValid) {
          alert(validation.error);
          onNavigateBack();
          return;
        }

        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
        
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = await context.decodeAudioData(arrayBuffer);
        setAudioBuffer(buffer);
        
        const audioDuration = buffer.duration;
        setDuration(audioDuration);
        setEndTime(Math.min(audioDuration, maxSelectionDuration));
        setSelectionEnd(Math.min(audioDuration, maxSelectionDuration));
        
        const url = URL.createObjectURL(audioFile);
        setAudioUrl(url);
        
        drawWaveform(buffer);
      } catch (error) {
        console.error('Error loading audio:', error);
        alert('Error al cargar el audio');
      }
    };

    loadAudio();
    
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioFile]);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        const audioDuration = audio.duration;
        setDuration(audioDuration);
        setEndTime(Math.min(audioDuration, maxSelectionDuration));
        setSelectionEnd(Math.min(audioDuration, maxSelectionDuration));
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => setIsPlaying(false);
      const handlePause = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('play', handlePlay);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('play', handlePlay);
      };
    }
  }, [audioUrl]);

  const drawWaveform = (buffer?: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (buffer) {
      const data = buffer.getChannelData(0);
      const barWidth = 4;
      const barSpacing = 2;
      const numBars = Math.floor(canvas.width / (barWidth + barSpacing));
      const samplesPerBar = Math.floor(data.length / numBars);
      
      for (let i = 0; i < numBars; i++) {
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) {
          sum += Math.abs(data[i * samplesPerBar + j] || 0);
        }
        const average = sum / samplesPerBar;
        const height = Math.max(average * canvas.height * 0.9, 4);
        const x = i * (barWidth + barSpacing);
        const y = (canvas.height - height) / 2;
        
        const timePosition = (i / numBars) * duration;
        if (timePosition >= selectionStart && timePosition <= selectionEnd) {
          ctx.fillStyle = '#00BFFF'; // Azul chicle
        } else {
          ctx.fillStyle = '#666';
        }
        
        ctx.fillRect(x, y, barWidth, height);
      }
      
      // Indicador de posición actual
      if (isPlaying) {
        const playPosition = (currentTime / duration) * canvas.width;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playPosition, 0);
        ctx.lineTo(playPosition, canvas.height);
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    if (audioBuffer) {
      drawWaveform(audioBuffer);
    }
  }, [selectionStart, selectionEnd, duration, audioBuffer, currentTime, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectionChange = (newStart: number, newEnd: number) => {
    // Asegurar que la selección no exceda 1 minuto
    if (newEnd - newStart > maxSelectionDuration) {
      newEnd = newStart + maxSelectionDuration;
    }
    
    // Mantener dentro de los límites del audio
    newStart = Math.max(0, Math.min(newStart, duration - 1));
    newEnd = Math.max(newStart + 1, Math.min(newEnd, duration));
    
    setSelectionStart(newStart);
    setSelectionEnd(newEnd);
    setStartTime(newStart);
    setEndTime(newEnd);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;
    
    setIsSelecting(true);
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / canvas.width) * duration;
    
    // Centrar selección de 1 minuto en el punto clickeado
    const halfSelection = maxSelectionDuration / 2;
    let newStart = Math.max(0, clickTime - halfSelection);
    let newEnd = Math.min(duration, clickTime + halfSelection);
    
    // Ajustar si se sale de los límites
    if (newEnd - newStart < maxSelectionDuration && newEnd < duration) {
      newEnd = Math.min(duration, newStart + maxSelectionDuration);
    }
    if (newEnd - newStart < maxSelectionDuration && newStart > 0) {
      newStart = Math.max(0, newEnd - maxSelectionDuration);
    }
    
    handleSelectionChange(newStart, newEnd);
    
    // Quitar el estado de selección después de un momento
    setTimeout(() => setIsSelecting(false), 1000);
  };

  const createTrimmedAudio = async (): Promise<Blob> => {
    if (!audioBuffer || !audioContext) {
      throw new Error('Audio no cargado');
    }

    const startSample = Math.floor(selectionStart * audioBuffer.sampleRate);
    const endSample = Math.floor(selectionEnd * audioBuffer.sampleRate);
    const trimmedLength = endSample - startSample;
    
    const trimmedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      trimmedLength,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      
      for (let i = 0; i < trimmedLength; i++) {
        trimmedData[i] = originalData[startSample + i] || 0;
      }
    }
    
    return new Promise((resolve) => {
      const offlineContext = new OfflineAudioContext(
        trimmedBuffer.numberOfChannels,
        trimmedBuffer.length,
        trimmedBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = trimmedBuffer;
      source.connect(offlineContext.destination);
      source.start();
      
      offlineContext.startRendering().then((renderedBuffer) => {
        const wav = audioBufferToWav(renderedBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        resolve(blob);
      });
    });
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, buffer.length * buffer.numberOfChannels * 2, true);
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };

  const handleUse = async () => {
    if (!audioName.trim()) {
      alert('Por favor, nombra tu audio');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const trimmedAudio = await createTrimmedAudio();
      const audioUrl = URL.createObjectURL(trimmedAudio);
      onUseAudio(trimmedAudio, audioName, audioUrl);
    } catch (error) {
      console.error('Error al procesar audio:', error);
      alert('Error al procesar el audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        if (audioContext && audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        audio.currentTime = selectionStart;
        await audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    if (currentTime >= selectionEnd) {
      audio.pause();
      setIsPlaying(false);
      audio.currentTime = selectionStart;
    }
  }, [currentTime, selectionEnd, selectionStart, isPlaying]);

  return (
    <div className={styles.modernAudioEditor}>
      <div className={styles.editorHeader}>
        <button className={styles.backButton} onClick={onNavigateBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1>Editor de Audio</h1>
        <div className={styles.durationBadge}>MAX 01:00</div>
      </div>

      <div className={styles.editorContent}>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        <div className={styles.nameInputSection}>
          <input
            type="text"
            placeholder="Nombra tu audio..."
            value={audioName}
            onChange={(e) => setAudioName(e.target.value)}
            className={styles.audioNameField}
            maxLength={50}
          />
        </div>

        <div className={styles.waveformContainer}>
          <div className={styles.waveformWrapper}>
            <canvas
              ref={canvasRef}
              width={400}
              height={100}
              className={styles.waveform}
              onClick={handleWaveformClick}
            />
            <div className={styles.playButtonOverlay}>
              <button 
                className={styles.playControl} 
                onClick={togglePlayback}
                data-tooltip={isPlaying ? 'Pausar' : 'Reproducir selección'}
              >
                <PlayPauseIcon isPlaying={isPlaying} />
              </button>
            </div>
          </div>
          
          <div className={styles.timeDisplay}>
            <span>{formatTime(selectionStart)}</span>
            <span className={styles.separator}>—</span>
            <span>{formatTime(selectionEnd)}</span>
            <span className={styles.duration}>({formatTime(selectionEnd - selectionStart)})</span>
          </div>
          
          <div className={styles.totalDuration}>
            Duración total: {formatTime(duration)}
          </div>

          <div className={styles.selectionControls}>
            <div className={styles.sliderGroup}>
              <label>Inicio</label>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={selectionStart}
                onChange={(e) => handleSelectionChange(parseFloat(e.target.value), selectionEnd)}
                className={styles.rangeSlider}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label>Final</label>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={selectionEnd}
                onChange={(e) => handleSelectionChange(selectionStart, parseFloat(e.target.value))}
                className={styles.rangeSlider}
              />
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button 
            className={`${styles.useButton} ${isProcessing ? styles.processing : ''}`} 
            onClick={handleUse} 
            disabled={isProcessing || !audioName.trim()}
          >
            {isProcessing ? 'Procesando...' : `Usar Audio (${formatTime(selectionEnd - selectionStart)})`}
          </button>
          <button 
            className={`${styles.publishButton} ${isProcessing ? styles.processing : ''}`} 
            onClick={async () => {
              if (!audioName.trim()) {
                alert('Por favor, nombra tu audio');
                return;
              }
              if (!auth.currentUser) {
                alert('Debes iniciar sesión para publicar');
                return;
              }
              setIsProcessing(true);
              try {
                const trimmedAudio = await createTrimmedAudio();
                await AudioService.processAndUploadAudio(
                  trimmedAudio,
                  audioName,
                  auth.currentUser.uid,
                  duration,
                  selectionStart,
                  selectionEnd,
                  true
                );
                alert('Audio publicado exitosamente');
                onPublishAudio(trimmedAudio, audioName);
              } catch (error) {
                console.error('Error al procesar audio:', error);
                alert('Error al procesar el audio');
              } finally {
                setIsProcessing(false);
              }
            }} 
            disabled={isProcessing || !audioName.trim()}
          >
            {isProcessing ? 'Publicando...' : 'Publicar Audio'}
          </button>
        </div>

        <div className={styles.helpText}>
          <p>💡 Haz clic en la forma de onda para centrar la selección • Usa los controles para ajustar con precisión</p>
        </div>
      </div>
    </div>
  );
}