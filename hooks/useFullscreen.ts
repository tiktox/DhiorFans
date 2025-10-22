import { useState, useEffect, useCallback } from 'react';

interface FullscreenCapabilities {
  canFullscreen: boolean;
  isPWA: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shouldMaintainFullscreen, setShouldMaintainFullscreen] = useState(false);
  const [capabilities, setCapabilities] = useState<FullscreenCapabilities>({
    canFullscreen: false,
    isPWA: false,
    isIOS: false,
    isAndroid: false
  });

  useEffect(() => {
    const detectCapabilities = () => {
      // Detectar soporte fullscreen
      const canFullscreen = !!(
        document.fullscreenEnabled || 
        (document as any).webkitFullscreenEnabled || 
        (document as any).mozFullScreenEnabled || 
        (document as any).msFullscreenEnabled
      );
      
      // Detectar PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true;
      
      // Detectar plataformas con mayor precisión
      const isIOS = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      
      setCapabilities({
        canFullscreen,
        isPWA,
        isIOS,
        isAndroid
      });
    };

    detectCapabilities();

    // Escuchar cambios de fullscreen
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
    };

    // Agregar listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement;
      
      // Verificar si ya está en fullscreen
      if (document.fullscreenElement) {
        setShouldMaintainFullscreen(true);
        return true;
      }
      
      // Intentar diferentes métodos de fullscreen
      if (element.requestFullscreen) {
        await element.requestFullscreen({ navigationUI: 'hide' });
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      } else {
        throw new Error('Fullscreen API not supported');
      }
      
      setShouldMaintainFullscreen(true);
      return true;
    } catch (error: any) {
      console.error('Error entering fullscreen:', error);
      
      // Manejar errores específicos
      if (error.name === 'NotAllowedError') {
        console.warn('Fullscreen blocked by user or policy');
      } else if (error.name === 'TypeError') {
        console.warn('Fullscreen API not available');
      }
      
      return false;
    }
  }, []);

  // Efecto separado para manejar la reactivación automática
  useEffect(() => {
    if (!isFullscreen && shouldMaintainFullscreen && capabilities.canFullscreen) {
      const timer = setTimeout(() => {
        enterFullscreen();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, shouldMaintainFullscreen, capabilities.canFullscreen, enterFullscreen]);

  const exitFullscreen = useCallback(async () => {
    try {
      setShouldMaintainFullscreen(false);
      
      // Verificar si no está en fullscreen
      if (!document.fullscreenElement && 
          !(document as any).webkitFullscreenElement && 
          !(document as any).mozFullScreenElement && 
          !(document as any).msFullscreenElement) {
        return true;
      }
      
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      } else {
        throw new Error('Exit fullscreen API not supported');
      }
      
      return true;
    } catch (error: any) {
      console.error('Error exiting fullscreen:', error);
      return false;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      return await exitFullscreen();
    } else {
      return await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Función para mantener fullscreen activo
  const maintainFullscreen = useCallback(() => {
    setShouldMaintainFullscreen(true);
  }, []);

  // Función para permitir salir de fullscreen
  const allowExitFullscreen = useCallback(() => {
    setShouldMaintainFullscreen(false);
  }, []);

  return {
    isFullscreen,
    capabilities,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    shouldMaintainFullscreen,
    maintainFullscreen,
    allowExitFullscreen
  };
};