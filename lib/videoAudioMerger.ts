// Servicio para fusionar video con audio
export class VideoAudioMerger {
  
  /**
   * Fusiona un video con un audio recortado
   * @param videoFile - Archivo de video original
   * @param audioFile - Archivo de audio a fusionar
   * @param startTime - Tiempo de inicio del audio en segundos
   * @param endTime - Tiempo de fin del audio en segundos
   * @returns Promise con el nuevo archivo de video con audio fusionado
   */
  static async mergeVideoWithAudio(
    videoFile: File,
    audioFile: File,
    startTime: number,
    endTime: number
  ): Promise<Blob> {
    try {
      // Crear elementos de video y audio
      const videoElement = document.createElement('video');
      const audioElement = document.createElement('audio');
      
      // Cargar archivos
      videoElement.src = URL.createObjectURL(videoFile);
      audioElement.src = URL.createObjectURL(audioFile);
      
      // Esperar a que se carguen los metadatos
      await Promise.all([
        new Promise(resolve => videoElement.onloadedmetadata = resolve),
        new Promise(resolve => audioElement.onloadedmetadata = resolve)
      ]);
      
      // Configurar audio para iniciar en el tiempo seleccionado
      audioElement.currentTime = startTime;
      const audioDuration = endTime - startTime;
      const videoDuration = videoElement.duration;
      const finalDuration = Math.min(videoDuration, audioDuration);
      
      // Crear canvas para capturar frames del video
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d')!;
      
      // Crear MediaStream del canvas
      const canvasStream = canvas.captureStream(30); // 30 FPS
      
      // Crear AudioContext para procesar el audio
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaElementSource(audioElement);
      const audioDestination = audioContext.createMediaStreamDestination();
      audioSource.connect(audioDestination);
      
      // Combinar video y audio streams
      const videoTrack = canvasStream.getVideoTracks()[0];
      const audioTrack = audioDestination.stream.getAudioTracks()[0];
      const combinedStream = new MediaStream([videoTrack, audioTrack]);
      
      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000
      });
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      // Iniciar grabación
      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          URL.revokeObjectURL(videoElement.src);
          URL.revokeObjectURL(audioElement.src);
          audioContext.close();
          resolve(blob);
        };
        
        mediaRecorder.onerror = (error) => {
          reject(error);
        };
        
        mediaRecorder.start();
        
        // Reproducir video y audio sincronizados
        videoElement.play();
        audioElement.play();
        
        // Renderizar frames del video en el canvas
        const renderFrame = () => {
          if (videoElement.currentTime < finalDuration && !videoElement.paused) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(renderFrame);
          } else {
            // Detener grabación cuando termine
            videoElement.pause();
            audioElement.pause();
            mediaRecorder.stop();
          }
        };
        
        renderFrame();
      });
      
    } catch (error) {
      console.error('Error fusionando video con audio:', error);
      throw new Error('No se pudo fusionar el video con el audio');
    }
  }
  
  /**
   * Recorta un archivo de audio
   * @param audioFile - Archivo de audio original
   * @param startTime - Tiempo de inicio en segundos
   * @param endTime - Tiempo de fin en segundos
   * @returns Promise con el audio recortado
   */
  static async trimAudio(
    audioFile: File,
    startTime: number,
    endTime: number
  ): Promise<Blob> {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const duration = endSample - startSample;
    
    // Crear nuevo buffer con la porción seleccionada
    const trimmedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      duration,
      sampleRate
    );
    
    // Copiar datos del audio original al nuevo buffer
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      
      for (let i = 0; i < duration; i++) {
        trimmedData[i] = originalData[startSample + i];
      }
    }
    
    // Convertir buffer a WAV
    const wavBlob = await this.audioBufferToWav(trimmedBuffer);
    await audioContext.close();
    
    return wavBlob;
  }
  
  /**
   * Convierte AudioBuffer a formato WAV
   */
  private static async audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const data = new Float32Array(buffer.length * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
        data[i * numberOfChannels + channel] = channelData[i];
      }
    }
    
    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
  
  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
