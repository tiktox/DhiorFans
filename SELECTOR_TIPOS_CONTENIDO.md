# Selector de Tipos de Contenido

## Descripción
El selector de tipos de contenido es un componente horizontal ubicado arriba del botón de tomar foto que permite al usuario seleccionar entre diferentes tipos de contenido mediante deslizamiento táctil o rueda del mouse.

## Características

### Tipos de Contenido
- **Crear Dinámica** (izquierda)
- **Publicación** (centro - seleccionado por defecto)
- **Escribe Algo!!** (derecha)
- **Live** (extrema derecha)

### Funcionalidades de Navegación

#### 1. Deslizamiento Táctil (Touch)
- Deslizar de izquierda a derecha o viceversa
- El elemento se centra automáticamente al soltar
- Respuesta suave y fluida

#### 2. Rueda del Mouse (Wheel)
- Scroll hacia arriba: navega hacia la izquierda
- Scroll hacia abajo: navega hacia la derecha
- Centrado automático del elemento seleccionado

#### 3. Arrastrar con Mouse (Drag)
- Click y arrastrar para navegar
- Snap automático al elemento más cercano
- Cursor cambia a "grab/grabbing"

#### 4. Click Directo
- Click en cualquier elemento para seleccionarlo
- Animación suave hacia el centro

### Comportamiento Visual

#### Estado Inactivo
- Texto semi-transparente (60% opacidad)
- Sin fondo
- Efecto hover sutil

#### Estado Activo
- Texto completamente blanco
- Fondo con gradiente y blur
- Borde semi-transparente
- Escala aumentada (110%)
- Indicador puntual debajo del elemento
- Animación de pulso en el indicador

### Integración con Cámara
- Al seleccionar "Publicación": activa automáticamente la cámara
- Otros tipos: desactiva la cámara
- Manejo inteligente de permisos

## Implementación Técnica

### Componente Principal
`ContentTypeSelector.tsx` - Componente reutilizable y optimizado

### Características Técnicas
- **Snap to Center**: Centrado automático del elemento seleccionado
- **Smooth Scrolling**: Animaciones suaves entre transiciones
- **Touch Optimization**: Optimizado para dispositivos táctiles
- **Responsive**: Funciona en desktop y móvil
- **Performance**: Uso de refs para evitar re-renders innecesarios

### Estilos CSS
Ubicados en `camera-interface.css` con:
- Gradientes y efectos de blur
- Animaciones CSS optimizadas
- Soporte para diferentes dispositivos
- Efectos visuales modernos

## Uso

```tsx
<ContentTypeSelector
  contentTypes={contentTypes}
  activeIndex={activeIndex}
  onSelectionChange={handleContentTypeChange}
/>
```

### Props
- `contentTypes`: Array de objetos con id y label
- `activeIndex`: Índice del elemento actualmente seleccionado
- `onSelectionChange`: Callback cuando cambia la selección

## Experiencia de Usuario

1. **Inicio**: "Publicación" aparece centrado por defecto
2. **Navegación**: Usuario puede deslizar, usar rueda o hacer click
3. **Feedback Visual**: Elemento seleccionado se destaca claramente
4. **Centrado Automático**: Siempre mantiene el elemento seleccionado en el centro
5. **Respuesta Inmediata**: Cambios instantáneos en la interfaz según la selección