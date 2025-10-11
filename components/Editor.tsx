import { useState } from 'react';
import { createDynamic } from '../lib/dynamicService';

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
}

interface EditorProps {
  mediaFile: MediaFile;
  onNavigateBack: () => void;
  userTokens?: number;
}

export default function Editor({ mediaFile, onNavigateBack, userTokens = 90 }: EditorProps) {
  const [caption, setCaption] = useState('');
  const [showKeywords, setShowKeywords] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState(userTokens);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Actualizar tokens seleccionados cuando cambien los tokens del usuario
  useState(() => {
    setSelectedTokens(userTokens);
  }, [userTokens]);

  return (
    <div className="editor-container">
      <div className="editor-header">
        <button className="back-btn-editor" onClick={onNavigateBack}>
          ←
        </button>
      </div>

      <div className="editor-content">
        <div className="media-display">
          {mediaFile.type === 'video' ? (
            <video src={mediaFile.url} controls className="editor-media" />
          ) : (
            <img src={mediaFile.url} alt="Selected media" className="editor-media" />
          )}
          
          <div className="caption-overlay">
            <input
              type="text"
              placeholder="Crea un título o una descripción..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="caption-input"
            />
          </div>
        </div>

        <div className="editor-footer">
          {!showKeywords ? (
            <button className="keywords-btn" onClick={() => setShowKeywords(true)}>
              <span>Palabras claves</span>
              <span className="arrow-right">→</span>
            </button>
          ) : (
            <div className="keywords-section">
              <div className="keywords-display">
                {keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword}
                  </span>
                ))}
              </div>
              
              {keywords.length < 3 && (
                <div className="keyword-input-section">
                  <input
                    type="text"
                    placeholder={`Palabra ${keywords.length + 1}`}
                    value={currentKeyword}
                    onChange={(e) => setCurrentKeyword(e.target.value)}
                    className="keyword-input"
                  />
                  {currentKeyword.trim() && (
                    <button 
                      className="select-keyword-btn"
                      onClick={() => {
                        if (currentKeyword.trim() && keywords.length < 3) {
                          setKeywords([...keywords, currentKeyword.trim()]);
                          setCurrentKeyword('');
                        }
                      }}
                    >
                      Seleccionar palabra
                    </button>
                  )}
                </div>
              )}
              
              {keywords.length === 3 ? (
                <div className="token-selector">
                  <div className="token-header">
                    <span className="token-icon">🪙</span>
                    <span>Tokens a donar</span>
                  </div>
                  
                  <div className="token-controls">
                    <button 
                      className="token-btn minus"
                      onClick={() => setSelectedTokens(Math.max(1, selectedTokens - 1))}
                      disabled={selectedTokens <= 1}
                    >
                      -
                    </button>
                    
                    <div className="token-display">
                      <span className="token-amount">{selectedTokens}</span>
                      <span className="token-max">/ {userTokens}</span>
                    </div>
                    
                    <button 
                      className="token-btn plus"
                      onClick={() => setSelectedTokens(Math.min(userTokens, selectedTokens + 1))}
                      disabled={selectedTokens >= userTokens}
                    >
                      +
                    </button>
                  </div>
                  
                  <input
                    type="range"
                    min="1"
                    max={userTokens}
                    value={selectedTokens}
                    onChange={(e) => setSelectedTokens(parseInt(e.target.value))}
                    className="token-slider"
                  />
                  
                  <button 
                    className="publish-btn" 
                    onClick={async () => {
                      if (isPublishing) return;
                      
                      setIsPublishing(true);
                      try {
                        await createDynamic(
                          caption || 'Adivina las palabras', 
                          caption || 'Comenta para ganar tokens', 
                          keywords, 
                          selectedTokens, 
                          mediaFile.file
                        );
                        alert('Dinámica publicada exitosamente');
                        onNavigateBack();
                      } catch (error: any) {
                        console.error('Error al publicar dinámica:', error);
                        alert(error.message || 'Error al publicar la dinámica');
                      } finally {
                        setIsPublishing(false);
                      }
                    }}
                    disabled={isPublishing}
                  >
                    {isPublishing ? 'Publicando...' : 'Publicar dinámica'}
                  </button>
                </div>
              ) : (
                <button className="back-to-editor" onClick={() => setShowKeywords(false)}>
                  Volver
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}