import { useRef, useEffect, useState } from 'react';

interface ContentType {
  id: string;
  label: string;
}

interface ContentTypeSelectorProps {
  contentTypes: ContentType[];
  activeIndex: number;
  onSelectionChange: (index: number) => void;
}

export default function ContentTypeSelector({ 
  contentTypes, 
  activeIndex, 
  onSelectionChange 
}: ContentTypeSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const centerSelectedItem = (index: number) => {
    if (containerRef.current) {
      const container = containerRef.current;
      const buttons = container.querySelectorAll('.content-type-btn');
      const button = buttons[index] as HTMLElement;
      if (button) {
        const containerWidth = container.offsetWidth;
        const buttonLeft = button.offsetLeft;
        const buttonWidth = button.offsetWidth;
        const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        container.scrollTo({ 
          left: scrollPosition, 
          behavior: 'smooth' 
        });
      }
    }
  };

  const updateButtonColors = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const buttons = container.querySelectorAll('.content-type-btn');
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    
    buttons.forEach((button, index) => {
      const btn = button as HTMLElement;
      const buttonCenter = btn.offsetLeft + btn.offsetWidth / 2;
      const distance = Math.abs(containerCenter - buttonCenter);
      
      if (distance < 60) {
        btn.classList.add('centered');
      } else {
        btn.classList.remove('centered');
      }
    });
  };

  const snapToCenter = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const buttons = container.querySelectorAll('.content-type-btn');
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    buttons.forEach((button, index) => {
      const btn = button as HTMLElement;
      const buttonCenter = btn.offsetLeft + btn.offsetWidth / 2;
      const distance = Math.abs(containerCenter - buttonCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    if (closestIndex !== activeIndex) {
      onSelectionChange(closestIndex);
    } else {
      centerSelectedItem(activeIndex);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (containerRef.current?.offsetLeft || 0);
    scrollLeft.current = containerRef.current?.scrollLeft || 0;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.2; // Reducir sensibilidad de 2 a 1.2
    containerRef.current.scrollLeft = scrollLeft.current - walk;
    updateButtonColors();
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
    setTimeout(snapToCenter, 50);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    scrollLeft.current = containerRef.current?.scrollLeft || 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const touchX = e.touches[0].clientX;
    const walk = (startX.current - touchX) * 0.8; // Reducir sensibilidad para touch
    containerRef.current.scrollLeft = scrollLeft.current + walk;
    updateButtonColors();
  };

  const handleTouchEnd = () => {
    setTimeout(snapToCenter, 50);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    
    const scrollAmount = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(contentTypes.length - 1, activeIndex + scrollAmount));
    
    if (newIndex !== activeIndex) {
      onSelectionChange(newIndex);
    }
  };

  useEffect(() => {
    centerSelectedItem(activeIndex);
    setTimeout(updateButtonColors, 100);
  }, [activeIndex]);

  useEffect(() => {
    setTimeout(() => {
      centerSelectedItem(activeIndex);
      updateButtonColors();
    }, 100);
    
    const container = containerRef.current;
    if (container) {
      const handleScroll = () => updateButtonColors();
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div 
      className="content-types"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {contentTypes.map((type, index) => (
        <button 
          key={type.id}
          className="content-type-btn"
          onClick={() => onSelectionChange(index)}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}