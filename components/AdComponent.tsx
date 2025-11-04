import { useEffect, useRef } from 'react';
import '../styles/ad.css';

interface AdComponentProps {
  adId: string;
}

export default function AdComponent({ adId }: AdComponentProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = adContainerRef.current;
    if (!container) return;

    // Para evitar duplicar el script si el componente se vuelve a renderizar
    if (container.querySelector('script')) {
      return;
    }
 
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//pl27776605.revenuecpmgate.com/46/51/b5/4651b52f04f98ac4a95e848e440e9025.js';
    
    container.appendChild(script);

  }, [adId]);

  return (
    <div className="ad-container" ref={adContainerRef}>
      <div className="ad-label">Publicidad</div>
      {/* El script de Adsterra llenará este contenedor */}
    </div>
  );
}