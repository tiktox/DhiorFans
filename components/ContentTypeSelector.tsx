import { useRef, useEffect } from 'react';

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

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const activeButton = container.children[activeIndex] as HTMLElement;
      
      if (activeButton) {
        // Scroll suave hacia el elemento activo
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeIndex]);

  return (
    <div className="content-types" ref={containerRef}>
      {contentTypes.map((type, index) => (
        <button 
          key={type.id}
          className={`content-type-btn ${activeIndex === index ? 'active' : ''}`}
          onClick={() => onSelectionChange(index)}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}