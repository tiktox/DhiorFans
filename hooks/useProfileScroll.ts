import { useEffect, useCallback } from 'react';

interface UseProfileScrollOptions {
  resetOnMount?: boolean;
  smoothScroll?: boolean;
  preventHorizontalScroll?: boolean;
}

export const useProfileScroll = (options: UseProfileScrollOptions = {}) => {
  const {
    resetOnMount = true,
    smoothScroll = true,
    preventHorizontalScroll = true
  } = options;

  // Función para resetear scroll
  const resetScroll = useCallback(() => {
    const container = document.querySelector('.profile-container');
    if (container) {
      if (smoothScroll) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        container.scrollTop = 0;
      }
    }
  }, [smoothScroll]);

  // Función para optimizar el contenedor
  const optimizeContainer = useCallback(() => {
    const container = document.querySelector('.profile-container');
    if (container) {
      // Optimizaciones para dispositivos táctiles
      (container as HTMLElement).style.touchAction = 'pan-y';
      (container as HTMLElement).style.setProperty('-webkit-overflow-scrolling', 'touch');
      (container as HTMLElement).style.scrollBehavior = smoothScroll ? 'smooth' : 'auto';
      
      // Mejorar rendimiento
      (container as HTMLElement).style.willChange = 'scroll-position';
      (container as HTMLElement).style.contain = 'layout style paint';
    }
  }, [smoothScroll]);

  // Efecto principal
  useEffect(() => {
    // Optimizar contenedor
    optimizeContainer();
    
    // Resetear scroll si está habilitado
    if (resetOnMount) {
      resetScroll();
    }
    
    // Prevenir scroll horizontal si está habilitado
    if (preventHorizontalScroll) {
      document.body.style.overflowX = 'hidden';
    }
    
    // Cleanup
    return () => {
      if (preventHorizontalScroll) {
        document.body.style.overflowX = '';
      }
    };
  }, [resetOnMount, optimizeContainer, resetScroll, preventHorizontalScroll]);

  // Función para scroll suave a un elemento
  const scrollToElement = useCallback((selector: string, offset: number = 0) => {
    const element = document.querySelector(selector);
    const container = document.querySelector('.profile-container');
    
    if (element && container) {
      const elementTop = (element as HTMLElement).offsetTop - offset;
      container.scrollTo({
        top: elementTop,
        behavior: 'smooth'
      });
    }
  }, []);

  // Función para detectar si está en el fondo
  const isAtBottom = useCallback(() => {
    const container = document.querySelector('.profile-container');
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      return scrollTop + clientHeight >= scrollHeight - 10; // 10px de margen
    }
    return false;
  }, []);

  return {
    resetScroll,
    scrollToElement,
    isAtBottom,
    optimizeContainer
  };
};