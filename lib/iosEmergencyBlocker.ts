// Sistema de emergencia para prevenir fullscreen en iOS
class IOSFullscreenBlocker {
  private static instance: IOSFullscreenBlocker;
  private isIOS: boolean;
  private emergencyInterval: NodeJS.Timeout | null = null;

  static getInstance(): IOSFullscreenBlocker {
    if (!IOSFullscreenBlocker.instance) {
      IOSFullscreenBlocker.instance = new IOSFullscreenBlocker();
    }
    return IOSFullscreenBlocker.instance;
  }

  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (this.isIOS) {
      this.initEmergencyProtection();
    }
  }

  private initEmergencyProtection() {
    // Interceptar TODAS las APIs de fullscreen
    this.blockFullscreenAPIs();
    
    // Monitoreo continuo cada 25ms (muy agresivo)
    this.emergencyInterval = setInterval(() => {
      this.forceInlineConfiguration();
      this.detectAndExitFullscreen();
    }, 25);

    // Interceptar eventos críticos
    this.interceptCriticalEvents();
  }

  private blockFullscreenAPIs() {
    const blockFunction = () => {
      console.warn('🚫 iOS Fullscreen API bloqueada');
      return Promise.reject('iOS fullscreen blocked by emergency system');
    };

    // Bloquear en document
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen = blockFunction;
    }
    if ((document.documentElement as any).webkitRequestFullscreen) {
      (document.documentElement as any).webkitRequestFullscreen = blockFunction;
    }

    // Bloquear en todos los videos existentes y futuros
    const blockVideoFullscreen = (video: HTMLVideoElement) => {
      if ((video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen = blockFunction;
      }
      if (video.requestFullscreen) {
        video.requestFullscreen = blockFunction;
      }
    };

    // Aplicar a videos existentes
    document.querySelectorAll('video').forEach(blockVideoFullscreen);

    // Observer para nuevos videos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as Element;
            if (element.tagName === 'VIDEO') {
              blockVideoFullscreen(element as HTMLVideoElement);
            }
            element.querySelectorAll?.('video').forEach(blockVideoFullscreen);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private forceInlineConfiguration() {
    document.querySelectorAll('video').forEach((video: HTMLVideoElement) => {
      // Configuración crítica
      if (!video.hasAttribute('playsinline')) {
        video.setAttribute('playsinline', '');
      }
      if (!video.hasAttribute('webkit-playsinline')) {
        video.setAttribute('webkit-playsinline', '');
      }
      if (!video.playsInline) {
        video.playsInline = true;
      }
      
      // Remover controles si existen
      if (video.hasAttribute('controls')) {
        video.removeAttribute('controls');
      }

      // Verificar estilos críticos
      const computedStyle = window.getComputedStyle(video);
      if (computedStyle.getPropertyValue('-webkit-playsinline') !== 'true') {
        video.style.setProperty('-webkit-playsinline', 'true', 'important');
      }
    });
  }

  private detectAndExitFullscreen() {
    // Detectar si estamos en fullscreen
    const fullscreenElement = 
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement;

    if (fullscreenElement) {
      console.warn('🚨 Fullscreen detectado, forzando salida...');
      
      // Intentar salir de fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      }
      if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }

  private interceptCriticalEvents() {
    const criticalEvents = [
      'webkitbeginfullscreen',
      'webkitendfullscreen',
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'msfullscreenchange',
      'webkitpresentationmodechanged'
    ];

    const preventEvent = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      console.warn('🛡️ Evento fullscreen interceptado:', e.type);
      return false;
    };

    criticalEvents.forEach(eventType => {
      document.addEventListener(eventType, preventEvent, { 
        capture: true, 
        passive: false 
      });
      
      // También interceptar en window
      window.addEventListener(eventType, preventEvent, { 
        capture: true, 
        passive: false 
      });
    });
  }

  public destroy() {
    if (this.emergencyInterval) {
      clearInterval(this.emergencyInterval);
      this.emergencyInterval = null;
    }
  }
}

// Inicializar inmediatamente si estamos en iOS
if (typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
  const blocker = IOSFullscreenBlocker.getInstance();
  
  // Asegurar que se ejecute cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      IOSFullscreenBlocker.getInstance();
    });
  }
}

export { IOSFullscreenBlocker };