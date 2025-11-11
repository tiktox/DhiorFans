import type { AppProps } from 'next/app';
import '../styles/variables.css';
import '../styles/globals.css';
import '../styles/ios-video-fix.css';
import '../styles/ios-video-force.css';
import '../styles/reels.css';
import '../styles/publish.css';
import '../styles/camera-interface.css';
import '../styles/countdown-selector.css';
import '../styles/create-dynamic.css';
import '../styles/publish-professional.css';
import '../styles/basic-editor.css';
import '../styles/comments.css';
import '../styles/chat.css';
import '../styles/chat-conversation.css';
import '../styles/chat-responsive.css';
import '../styles/z-index-hierarchy.css';
import { CommentsProvider } from '../contexts/CommentsContext';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // INTERCEPTACIÓN GLOBAL CRÍTICA para iOS
    if (typeof window !== 'undefined') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // Bloquear APIs de fullscreen INMEDIATAMENTE
        const blockFullscreen = () => Promise.reject('iOS fullscreen blocked');
        
        // Interceptar TODAS las APIs de fullscreen
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen = blockFullscreen;
        }
        if ((document.documentElement as any).webkitRequestFullscreen) {
          (document.documentElement as any).webkitRequestFullscreen = blockFullscreen;
        }
        if ((document.documentElement as any).mozRequestFullScreen) {
          (document.documentElement as any).mozRequestFullScreen = blockFullscreen;
        }
        
        // Interceptar eventos globales de fullscreen
        const preventFullscreenGlobal = (e: Event) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        };
        
        document.addEventListener('webkitfullscreenchange', preventFullscreenGlobal, { capture: true, passive: false });
        document.addEventListener('fullscreenchange', preventFullscreenGlobal, { capture: true, passive: false });
        
        // Configurar TODOS los videos existentes y futuros
        const configureAllVideos = () => {
          document.querySelectorAll('video').forEach(video => {
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.playsInline = true;
            video.removeAttribute('controls');
            
            // Interceptar eventos específicos del video
            ['webkitbeginfullscreen', 'webkitendfullscreen'].forEach(event => {
              video.addEventListener(event, preventFullscreenGlobal, { capture: true, passive: false });
            });
          });
        };
        
        // Ejecutar inmediatamente y observar cambios
        configureAllVideos();
        
        const observer = new MutationObserver(() => configureAllVideos());
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Configurar cada 100ms para casos extremos
        const forceInterval = setInterval(configureAllVideos, 100);
        
        // Cleanup
        return () => {
          observer.disconnect();
          clearInterval(forceInterval);
        };
      }
    }
  }, []);
  
  return (
    <CommentsProvider>
      <Component {...pageProps} />
    </CommentsProvider>
  );
}