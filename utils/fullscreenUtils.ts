export interface FullscreenError {
  type: 'NOT_SUPPORTED' | 'NOT_ALLOWED' | 'SECURITY_ERROR' | 'UNKNOWN';
  message: string;
  originalError?: Error;
}

export const getFullscreenError = (error: any): FullscreenError => {
  if (error.name === 'NotAllowedError') {
    return {
      type: 'NOT_ALLOWED',
      message: 'El navegador bloquea la pantalla completa',
      originalError: error
    };
  }
  
  if (error.name === 'NotSupportedError' || error.name === 'TypeError') {
    return {
      type: 'NOT_SUPPORTED',
      message: 'Tu navegador no soporta pantalla completa',
      originalError: error
    };
  }
  
  if (error.name === 'SecurityError') {
    return {
      type: 'SECURITY_ERROR',
      message: 'Error de seguridad al activar pantalla completa',
      originalError: error
    };
  }
  
  return {
    type: 'UNKNOWN',
    message: 'Error desconocido',
    originalError: error
  };
};

export const isFullscreenSupported = (): boolean => {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );
};

export const getCurrentFullscreenElement = (): Element | null => {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  );
};

export const isCurrentlyFullscreen = (): boolean => {
  return getCurrentFullscreenElement() !== null;
};