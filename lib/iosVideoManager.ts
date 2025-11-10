class IOSVideoManager {
  private static instance: IOSVideoManager;
  private isIOS: boolean;
  private observer: MutationObserver | null = null;

  static getInstance(): IOSVideoManager {
    if (!IOSVideoManager.instance) {
      IOSVideoManager.instance = new IOSVideoManager();
    }
    return IOSVideoManager.instance;
  }

  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.init();
  }

  private init() {
    if (!this.isIOS) return;

    // Interceptar TODOS los videos inmediatamente
    this.processExistingVideos();
    this.watchForNewVideos();
    this.preventFullscreenGlobally();
  }

  private processExistingVideos() {
    document.querySelectorAll('video').forEach(video => {
      this.configureVideo(video);
    });
  }

  private configureVideo(video: HTMLVideoElement) {
    // Configuración crítica para iOS
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    
    // Remover controles que pueden activar pantalla completa
    video.removeAttribute('controls');
    
    // Prevenir eventos de pantalla completa
    this.addFullscreenPrevention(video);
    
    // Forzar reproducción inline
    video.style.setProperty('-webkit-playsinline', 'true', 'important');
    video.style.setProperty('object-fit', 'cover', 'important');
  }

  private addFullscreenPrevention(video: HTMLVideoElement) {
    const events = [
      'webkitbeginfullscreen',
      'webkitendfullscreen',
      'fullscreenchange',
      'webkitfullscreenchange'
    ];

    events.forEach(event => {
      video.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }, { capture: true, passive: false });
    });

    // Interceptar clicks que puedan activar pantalla completa
    video.addEventListener('click', (e) => {
      e.preventDefault();
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }, { capture: true });
  }

  private watchForNewVideos() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as Element;
            
            // Si es un video
            if (element.tagName === 'VIDEO') {
              this.configureVideo(element as HTMLVideoElement);
            }
            
            // Si contiene videos
            element.querySelectorAll?.('video').forEach(video => {
              this.configureVideo(video);
            });
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'controls']
    });
  }

  private preventFullscreenGlobally() {
    // Interceptar API de pantalla completa
    const doc = document as any;
    if (doc.requestFullscreen) {
      doc.requestFullscreen = function() {
        console.warn('Pantalla completa bloqueada en iOS');
        return Promise.reject('Fullscreen blocked');
      };
    }

    // Interceptar webkit fullscreen
    if (doc.webkitRequestFullscreen) {
      doc.webkitRequestFullscreen = function() {
        console.warn('Webkit pantalla completa bloqueada en iOS');
        return Promise.reject('Webkit fullscreen blocked');
      };
    }
  }

  public forceInlinePlayback() {
    document.querySelectorAll('video').forEach(video => {
      this.configureVideo(video);
    });
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export const iosVideoManager = IOSVideoManager.getInstance();