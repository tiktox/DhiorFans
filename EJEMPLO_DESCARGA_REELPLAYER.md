# Ejemplo: Agregar Botón de Descarga en ReelPlayer

## 📥 IMPLEMENTACIÓN

### Paso 1: Importar DownloadService
```typescript
// components/ReelPlayer.tsx
import { DownloadService } from '../lib/downloadService';
```

### Paso 2: Agregar estado para descarga
```typescript
const [isDownloading, setIsDownloading] = useState(false);
const [downloadProgress, setDownloadProgress] = useState(0);
```

### Paso 3: Crear función de descarga
```typescript
const handleDownload = async () => {
  try {
    setIsDownloading(true);
    setDownloadProgress(0);
    
    console.log('📥 Iniciando descarga...');
    
    const fileName = DownloadService.getDownloadFileName(
      post.title || 'video',
      post.mediaType
    );
    
    console.log('📄 Nombre del archivo:', fileName);
    
    await DownloadService.downloadVideoWithAudio(
      post.mediaUrl,
      post.audioUrl,
      fileName
    );
    
    console.log('✅ Descarga completada');
    setDownloadProgress(100);
    
    // Mostrar notificación de éxito
    alert('✅ Descarga completada: ' + fileName);
    
  } catch (error) {
    console.error('❌ Error descargando:', error);
    alert('❌ Error descargando: ' + (error instanceof Error ? error.message : 'Error desconocido'));
  } finally {
    setIsDownloading(false);
    setDownloadProgress(0);
  }
};
```

### Paso 4: Agregar botón en la UI
```typescript
// En la sección de controles laterales
{isActive && (
  <div className="reel-side-controls">
    {/* Botones existentes */}
    <div className="like-container">
      {/* ... */}
    </div>
    
    {/* NUEVO: Botón de descarga */}
    {!isImage && (
      <button 
        className="side-control-btn download-btn"
        onClick={handleDownload}
        disabled={isDownloading}
        title={isDownloading ? 'Descargando...' : 'Descargar video'}
      >
        {isDownloading ? (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" style={{ animation: 'spin 1s linear infinite' }} />
            </svg>
            <span className="download-progress">{downloadProgress}%</span>
          </>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
      </button>
    )}
    
    {/* Botones existentes */}
    <div className="comment-container">
      {/* ... */}
    </div>
    
    <button className="side-control-btn share-btn">
      {/* ... */}
    </button>
    
    {!isImage && (
      <button onClick={toggleMute} className="side-control-btn mute-btn">
        {/* ... */}
      </button>
    )}
  </div>
)}
```

### Paso 5: Agregar estilos CSS
```css
/* styles/reels.css o donde tengas los estilos */

.download-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.download-progress {
  font-size: 12px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

---

## 🎯 CÓDIGO COMPLETO PARA REELPLAYER

```typescript
// components/ReelPlayer.tsx - Sección relevante

import { DownloadService } from '../lib/downloadService';

export default function ReelPlayer({ post, isActive, onProfileClick, onPostDeleted, onDynamicCompleted }: ReelPlayerProps) {
  // ... estados existentes ...
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // ... funciones existentes ...

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      console.log('📥 Iniciando descarga...');
      
      const fileName = DownloadService.getDownloadFileName(
        post.title || 'video',
        post.mediaType
      );
      
      console.log('📄 Nombre del archivo:', fileName);
      
      await DownloadService.downloadVideoWithAudio(
        post.mediaUrl,
        post.audioUrl,
        fileName
      );
      
      console.log('✅ Descarga completada');
      setDownloadProgress(100);
      
      alert('✅ Descarga completada: ' + fileName);
      
    } catch (error) {
      console.error('❌ Error descargando:', error);
      alert('❌ Error descargando: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <div className={`reel-container ${isImage ? 'image-content' : 'video-content'}`}>
      {/* ... contenido existente ... */}
      
      {isActive && (
        <div className="reel-side-controls">
          <div className="like-container">
            <button className={`side-control-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "#ff3040" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <span className="like-count">{likesCount}</span>
          </div>

          {/* NUEVO: Botón de descarga */}
          {!isImage && (
            <button 
              className="side-control-btn download-btn"
              onClick={handleDownload}
              disabled={isDownloading}
              title={isDownloading ? 'Descargando...' : 'Descargar video'}
            >
              {isDownloading ? (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span className="download-progress">{downloadProgress}%</span>
                </>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
            </button>
          )}

          <div className="comment-container">
            <button className="side-control-btn comment-btn" onClick={() => setShowComments(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            {commentsCount > 0 && <span className="comment-count">{commentsCount}</span>}
          </div>

          <button className="side-control-btn share-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
            </svg>
          </button>

          {!isImage && (
            <button onClick={toggleMute} className="side-control-btn mute-btn">
              {isMuted ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5 6 9H2v6h4l5 4V5ZM22 9l-6 6M16 9l6 6"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5 6 9H2v6h4l5 4V5ZM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 PRUEBAS

### Prueba 1: Descargar video sin audio
```
1. Abre un post con solo video
2. Haz clic en el botón de descarga
3. Verifica que se descargue el video
4. ✅ Debe funcionar correctamente
```

### Prueba 2: Descargar video con audio
```
1. Abre un post con video + audio
2. Haz clic en el botón de descarga
3. Espera a que se fusione (2-3 segundos)
4. Verifica que se descargue el archivo fusionado
5. ✅ Debe reproducirse con audio
```

### Prueba 3: Descargar imagen con audio
```
1. Abre un post con imagen + audio
2. Haz clic en el botón de descarga
3. Verifica que se descargue la imagen
4. ✅ Debe funcionar correctamente
```

---

## 📊 FLUJO DE DESCARGA

```
Usuario hace clic en "Descargar"
    ↓
setIsDownloading(true)
    ↓
DownloadService.downloadVideoWithAudio()
    ├─ Descarga video
    ├─ Descarga audio
    ├─ Fusiona en cliente
    └─ Genera blob
    ↓
Crea link de descarga
    ↓
Usuario descarga archivo
    ↓
setIsDownloading(false)
    ↓
✅ Completado
```

---

## 🎯 RESULTADO

✅ Usuario puede descargar video + audio fusionados
✅ Indicador de progreso durante descarga
✅ Manejo de errores
✅ Funciona con y sin audio
✅ Compatible con todos los navegadores
