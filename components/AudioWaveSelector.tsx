import { useState, useRef, useEffect } from 'react';

interface AudioWaveSelectorProps {
  audioFile: File;
  onTimeSelect: (startTime: number, endTime: number) => void;
  onClose: () => void;
  onUseSelection: (audioBlob: Blob, startTime: number, endTime: number) => void;
}

export default function AudioWaveSelector({ audioFile, onTimeSelect, onClose, onUseSelection }: AudioWaveSelectorProps) {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [selectorPosition, setSelectorPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [hasValidSelection, setHasValidSelection] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateWaveform();
  }, [audioFile]);

  const generateWaveform = async () => {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    
    setAudioBuffer(buffer);
    setAudioDuration(buffer.duration);
    
    const channelData = buffer.getChannelData(0);
    const samples = 150;
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j] || 0);
      }
      waveform.push(sum / blockSize);
    }
    
    setWaveformData(waveform);
    drawWaveform(waveform, 0);
  };

  const drawWaveform = (data: number[], position: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d')!;
    const width = 150;
    const height = 35;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    ctx.fillStyle = '#666';
    data.forEach((amplitude, i) => {
      const barHeight = amplitude * height * 0.8;
      const x = i;
      const y = (height - barHeight) / 2;
      ctx.fillRect(x, y, 1, barHeight);
    });
    
    // Draw selector (60 seconds worth)
    const selectorWidth = Math.min(60, audioDuration) / audioDuration * width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(position, 0, selectorWidth, height);
    
    // Draw selector borders
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(position, 0, selectorWidth, height);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updatePosition(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updatePosition = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const maxPosition = 150 - (Math.min(60, audioDuration) / audioDuration * 150);
    const newPosition = Math.max(0, Math.min(maxPosition, x));
    
    setSelectorPosition(newPosition);
    drawWaveform(waveformData, newPosition);
    setHasValidSelection(true);
    
    const startTime = (newPosition / 150) * audioDuration;
    const endTime = Math.min(startTime + 60, audioDuration);
    onTimeSelect(startTime, endTime);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (waveformData.length > 0) {
      drawWaveform(waveformData, selectorPosition);
    }
  }, [waveformData, selectorPosition]);

  const handleConfirm = async () => {
    if (!audioBuffer || !hasValidSelection || isProcessing) return;
    
    setIsProcessing(true);
    const startTime = (selectorPosition / 150) * audioDuration;
    const endTime = Math.min(startTime + 60, audioDuration);
    
    const audioContext = new AudioContext();
    const segmentLength = Math.floor((endTime - startTime) * audioBuffer.sampleRate);
    const startSample = Math.floor(startTime * audioBuffer.sampleRate);
    
    const segmentBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const segmentData = segmentBuffer.getChannelData(channel);
      
      for (let i = 0; i < segmentLength; i++) {
        segmentData[i] = channelData[startSample + i] || 0;
      }
    }
    
    // Convert to WAV blob
    const length = segmentBuffer.length * segmentBuffer.numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, segmentBuffer.numberOfChannels, true);
    view.setUint32(24, segmentBuffer.sampleRate, true);
    view.setUint32(28, segmentBuffer.sampleRate * segmentBuffer.numberOfChannels * 2, true);
    view.setUint16(32, segmentBuffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < segmentBuffer.length; i++) {
      for (let channel = 0; channel < segmentBuffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, segmentBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    onUseSelection(blob, startTime, endTime);
    setIsProcessing(false);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="audio-wave-selector" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={150}
        height={35}
        onMouseDown={handleMouseDown}
      />
      <div className="selector-actions">
        <button 
          className="confirm-btn" 
          onClick={handleConfirm}
          disabled={!hasValidSelection || isProcessing}
          title="Aplicar selección"
        >
          {isProcessing ? '...' : '✓'}
        </button>
        <button 
          className="cancel-btn" 
          onClick={handleCancel}
          disabled={isProcessing}
          title="Cancelar"
        >
          ×
        </button>
      </div>
    </div>
  );
}