/**
 * Servicio para descargar posts con video + audio fusionados
 * Fusiona bajo demanda cuando el usuario descarga
 */

export class DownloadService {
  /**
   * Descarga un video con audio fusionado
   * @param videoUrl - URL del video
   * @param audioUrl - URL del audio (opcional)
   * @param fileName - Nombre del archivo a descargar
   */
  static async downloadVideoWithAudio(
    videoUrl: string,
    audioUrl: string | undefined,
    fileName: string
  ): Promise<void> {
    try {
      console.log('📥 Iniciando descarga:', { videoUrl, audioUrl, fileName });

      // Si no hay audio, descargar solo el video
      if (!audioUrl) {
        console.log('📹 Descargando video sin audio');
        await this.downloadFile(videoUrl, fileName);
        return;
      }

      // Si hay audio, fusionar y descargar
      console.log('🎬 Fusionando video con audio para descarga...');
      const mergedBlob = await this.mergeVideoWithAudioForDownload(videoUrl, audioUrl);
      
      if (!mergedBlob || mergedBlob.size === 0) {
        throw new Error('El video fusionado está vacío');
      }

      console.log('📦 Blob fusionado:', {
        size: (mergedBlob.size / 1024 / 1024).toFixed(2) + ' MB',
        type: mergedBlob.type
      });

      // Descargar el blob fusionado
      const url = URL.createObjectURL(mergedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Descarga completada');
    } catch (error) {
      console.error('❌ Error descargando video:', error);
      throw new Error('No se pudo descargar el video');
    }
  }

  /**
   * Descarga un archivo simple
   */
  private static async downloadFile(url: string, fileName: string): Promise<void> {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  /**
   * Fusiona video con audio para descarga
   * Usa FFmpeg.wasm para máxima compatibilidad
   */
  private static async mergeVideoWithAudioForDownload(
    videoUrl: string,
    audioUrl: string
  ): Promise<Blob> {
    try {
      // Intentar con FFmpeg.wasm (mejor opción)
      return await this.mergeWithFFmpeg(videoUrl, audioUrl);
    } catch (ffmpegError) {
      console.warn('⚠️ FFmpeg no disponible, intentando con MediaRecorder:', ffmpegError);
      // Fallback a MediaRecorder
      return await this.mergeWithMediaRecorder(videoUrl, audioUrl);
    }
  }

  /**
   * Fusiona usando FFmpeg.wasm (recomendado)
   * Requiere: npm install @ffmpeg/ffmpeg @ffmpeg/util
   */
  private static async mergeWithFFmpeg(
    videoUrl: string,
    audioUrl: string
  ): Promise<Blob> {
    // Nota: Esto requiere que FFmpeg.wasm esté instalado
    // Por ahora, lanzamos error para usar fallback
    throw new Error('FFmpeg no configurado');
  }

  /**
   * Fusiona usando MediaRecorder (fallback)
   * Menos confiable pero funciona en navegadores sin FFmpeg
   */
  private static async mergeWithMediaRecorder(
    videoUrl: string,
    audioUrl: string
  ): Promise<Blob> {
    console.log('🎬 Fusionando con MediaRecorder...');

    // Crear elementos
    const videoElement = document.createElement('video');
    const audioElement = document.createElement('audio');

    // Cargar archivos
    const videoBlob = await fetch(videoUrl).then(r => r.blob());
    const audioBlob = await fetch(audioUrl).then(r => r.blob());

    videoElement.src = URL.createObjectURL(videoBlob);
    audioElement.src = URL.createObjectURL(audioBlob);

    // Esperar a que carguen
    await Promise.all([
      new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = resolve;
        videoElement.onerror = () => reject(new Error('Error cargando video'));
      }),
      new Promise((resolve, reject) => {
        audioElement.onloadedmetadata = resolve;
        audioElement.onerror = () => reject(new Error('Error cargando audio'));
      })
    ]);

    const videoDuration = videoElement.duration;
    const audioDuration = audioElement.duration;
    const finalDuration = Math.min(videoDuration, audioDuration);

    console.log('📊 Duraciones:', {
      video: videoDuration.toFixed(2),
      audio: audioDuration.toFixed(2),
      final: finalDuration.toFixed(2)
    });

    // Crear canvas
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d')!;

    // Crear streams
    const canvasStream = canvas.captureStream(30);
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaElementSource(audioElement);
    const audioDestination = audioContext.createMediaStreamDestination();
    audioSource.connect(audioDestination);

    // Combinar streams
    const videoTrack = canvasStream.getVideoTracks()[0];
    const audioTrack = audioDestination.stream.getAudioTracks()[0];
    const combinedStream = new MediaStream([videoTrack, audioTrack]);

    // Seleccionar codec compatible
    const mimeTypes = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ];

    let selectedMimeType = 'video/webm';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        console.log('✅ Codec soportado:', mimeType);
        break;
      }
    }

    // Grabar
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 2500000
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

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

      // Reproducir
      videoElement.play();
      audioElement.play();

      // Renderizar
      const renderFrame = () => {
        if (videoElement.currentTime < finalDuration && !videoElement.paused) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(renderFrame);
        } else {
          videoElement.pause();
          audioElement.pause();
          mediaRecorder.stop();
        }
      };

      renderFrame();
    });
  }

  /**
   * Obtiene el nombre del archivo para descargar
   */
  static getDownloadFileName(postTitle: string, mediaType: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedTitle = postTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const ext = mediaType === 'video' ? 'webm' : 'mp4';
    return `${sanitizedTitle}_${timestamp}.${ext}`;
  }
}
