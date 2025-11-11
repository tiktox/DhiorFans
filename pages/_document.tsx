import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        
        {/* CRÍTICO: Prevenir fullscreen en iOS */}
        <meta name="apple-touch-fullscreen" content="no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-title" content="Dhirofans" />
        
        {/* Configuración específica para videos inline */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; media-src 'self' data: blob: https:;" />
        
        {/* Script crítico para interceptar fullscreen ANTES de React */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                // Bloquear fullscreen APIs inmediatamente
                const block = () => Promise.reject('iOS blocked');
                
                // Interceptar antes de que se cargue cualquier cosa
                Object.defineProperty(document.documentElement, 'requestFullscreen', {
                  value: block,
                  writable: false
                });
                
                Object.defineProperty(document.documentElement, 'webkitRequestFullscreen', {
                  value: block,
                  writable: false
                });
                
                // Interceptar eventos globalmente
                document.addEventListener('webkitbeginfullscreen', function(e) {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                  return false;
                }, { capture: true, passive: false });
                
                // Configurar videos inmediatamente
                const configVideos = () => {
                  document.querySelectorAll('video').forEach(v => {
                    v.setAttribute('playsinline', '');
                    v.setAttribute('webkit-playsinline', '');
                    v.playsInline = true;
                    v.removeAttribute('controls');
                  });
                };
                
                // Ejecutar continuamente
                setInterval(configVideos, 50);
                
                // Observer para nuevos videos
                new MutationObserver(configVideos).observe(document.body, {
                  childList: true,
                  subtree: true
                });
              }
            })();
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
        
        {/* Script adicional para casos extremos */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Interceptar después de que todo se carga
            window.addEventListener('load', function() {
              if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                // Forzar configuración final
                document.querySelectorAll('video').forEach(function(video) {
                  video.setAttribute('playsinline', '');
                  video.setAttribute('webkit-playsinline', '');
                  video.playsInline = true;
                  video.removeAttribute('controls');
                  
                  // Interceptar clicks que puedan activar fullscreen
                  video.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (video.paused) {
                      video.play();
                    } else {
                      video.pause();
                    }
                  }, { capture: true });
                });
              }
            });
          `
        }} />
      </body>
    </Html>
  );
}