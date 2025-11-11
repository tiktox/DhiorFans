import { useEffect } from 'react';
import { IOSFullscreenBlocker } from '../lib/iosEmergencyBlocker';

export const useIOSVideoFix = () => {
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Activar sistema de emergencia
      IOSFullscreenBlocker.getInstance();
      // Aplicar configuraciones globales para iOS
      const videos = document.querySelectorAll('video');
      
      videos.forEach(video => {
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        
        // Prevenir eventos de pantalla completa
        const preventFullscreen = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        };
        
        video.addEventListener('webkitbeginfullscreen', preventFullscreen);
        video.addEventListener('webkitendfullscreen', preventFullscreen);
      });
      
      // Observer para videos que se agreguen dinámicamente
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const element = node as Element;
              const newVideos = element.querySelectorAll('video');
              
              newVideos.forEach(video => {
                video.setAttribute('playsinline', 'true');
                video.setAttribute('webkit-playsinline', 'true');
              });
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      return () => {
        observer.disconnect();
      };
    }
  }, []);
  
  return {
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent)
  };
};