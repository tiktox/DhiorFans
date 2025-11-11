import { useEffect } from 'react';

export const useIOSVideoFix = () => {
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Configuración básica para videos existentes
      const configureVideos = () => {
        document.querySelectorAll('video').forEach(video => {
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          video.playsInline = true;
          video.removeAttribute('controls');
        });
      };
      
      configureVideos();
      
      // Observer simple para nuevos videos
      const observer = new MutationObserver(() => {
        configureVideos();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      return () => observer.disconnect();
    }
  }, []);
  
  return {
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent)
  };
};