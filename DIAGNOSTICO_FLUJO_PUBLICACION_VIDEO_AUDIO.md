# Diagnóstico - Flujo de Publicación Video + Audio

## 🔍 ANÁLISIS DEL FLUJO ACTUAL

### 1. **Problema: VideoAudioMerger puede fallar silenciosamente**

**Ubicación:** `BasicEditor.tsx` líneas 410-420

```typescript
if (images[0].type === 'video' && audioFile) {
  console.log('🎬 Fusionando video con audio...');
  try {
    const mergedVideoBlob = await VideoAudioMerger.mergeVideoWithAudio(...);
    fileToUpload = new File([mergedVideoBlob], `merged_${images[0].file.name}`, { type: 'video/webm' });
    console.log('✅ Video fusionado con audio');
  } catch (mergeError) {
    console.error('❌ Error fusionando video:', mergeError);
    console.log('⚠️ Continuando con video original');  // ← PROBLEMA: Continúa sin audio
  }
}
```

**Problema:** Si la fusión falla, continúa con el video original SIN audio, sin notificar al usuario.

---

### 2. **Problema: VideoAudioMerger usa MediaRecorder que puede no ser soportado**

**Ubicación:** `VideoAudioMerger.ts` líneas 60-70

```typescript
const mediaRecorder = new MediaRecorder(combinedStream, {
  mimeType: 'video/webm;codecs=vp9,opus',
  videoBitsPerSecond: 2500000
});
```

**Problemas:**
- `video/webm;codecs=vp9,opus` puede no ser soportado en todos los navegadores
- No hay fallback si el codec no es soportado
- `MediaRecorder` puede no estar disponible en algunos navegadores

---

### 3. **Problema: AudioContext puede cerrarse prematuramente**

**Ubicación:** `VideoAudioMerger.ts` línea 95

```typescript
mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  URL.revokeObjectURL(videoElement.src);
  URL.revokeObjectURL(audioElement.src);
  audioContext.close();  // ← Cierra el contexto
  resolve(blob);
};
```

**Problema:** Si hay un error antes de `onstop`, el `audioContext` nunca se cierra, causando memory leaks.

---

### 4. **Problema: No hay validación de duración de video**

**Ubicación:** `BasicEditor.tsx` línea 410

```typescript
if (images[0].type === 'video' && audioFile) {
  // No valida que el video sea lo suficientemente largo
  const mergedVideoBlob = await VideoAudioMerger.mergeVideoWithAudio(...);
}
```

**Problema:** Si el video dura 5 segundos y el audio 60 segundos, la fusión puede fallar o crear un video incompleto.

---

### 5. **Problema: Blob de video fusionado puede ser muy grande**

**Ubicación:** `VideoAudioMerger.ts` línea 60

```typescript
const mediaRecorder = new MediaRecorder(combinedStream, {
  mimeType: 'video/webm;codecs=vp9,opus',
  videoBitsPerSecond: 2500000  // 2.5 Mbps = ~18.75 MB por minuto
});
```

**Problema:** 
- Un video de 1 minuto = ~18.75 MB
- Límite de Firebase Storage = 100 MB
- Si el video es muy largo, puede exceder el límite

---

### 6. **Problema: No hay manejo de errores de Firebase Storage**

**Ubicación:** `BasicEditor.tsx` línea 430

```typescript
const mediaUrl = await uploadFile(fileToUpload, auth.currentUser.uid);
if (!mediaUrl) throw new Error('Error al subir media');
```

**Problema:** 
- `uploadFile` puede fallar por timeout
- No hay reintentos
- No hay feedback de progreso

---

### 7. **Problema: Flujo de audio para imágenes no está optimizado**

**Ubicación:** `BasicEditor.tsx` líneas 440-450

```typescript
if (audioFile && images[0].type !== 'video') {
  const audioUrl = await uploadFile(audioFile, auth.currentUser.uid);
  if (audioUrl) {
    postData.audioUrl = audioUrl;
    postData.audioTimeRange = selectedTimeRange;
  }
}
```

**Problema:**
- El audio completo se sube sin recortar
- Se confía en que el cliente respete `audioTimeRange`
- Desperdicia almacenamiento

---

## 📋 CHECKLIST DE PROBLEMAS

- [ ] VideoAudioMerger falla silenciosamente
- [ ] Codec no soportado en algunos navegadores
- [ ] AudioContext no se limpia en caso de error
- [ ] No valida duración de video
- [ ] Blob de video puede ser muy grande
- [ ] Sin manejo de errores de Firebase
- [ ] Audio para imágenes no se recorta

---

## ✅ SOLUCIONES A IMPLEMENTAR

1. **Mejorar manejo de errores en VideoAudioMerger**
   - Agregar fallback de codec
   - Limpiar recursos en caso de error
   - Validar duración de video

2. **Optimizar tamaño de video**
   - Reducir bitrate si es necesario
   - Comprimir video antes de subir

3. **Mejorar manejo de Firebase**
   - Agregar reintentos
   - Mejor feedback de errores
   - Validar tamaño antes de subir

4. **Recortar audio antes de subir**
   - Para imágenes, recortar audio a `audioTimeRange`
   - Reducir tamaño de almacenamiento

5. **Agregar validaciones**
   - Validar duración de video
   - Validar tamaño de archivo
   - Validar que el audio sea válido
