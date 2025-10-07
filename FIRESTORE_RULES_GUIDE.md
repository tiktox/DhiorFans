# 🔒 Guía de Reglas de Firestore - DhiorFans

## 📋 Resumen de Cambios

Las nuevas reglas de Firestore han sido diseñadas para:
- ✅ **Seguridad mejorada** - Validación estricta de datos
- ✅ **Prevención de spam** - Límites en tamaños de contenido
- ✅ **Integridad de datos** - Validación de tipos y rangos
- ✅ **Permisos granulares** - Control preciso de acceso
- ✅ **Optimización** - Índices mejorados para consultas

## 🗂️ Estructura de Colecciones

### 👥 **users** - Perfiles de Usuario
```javascript
{
  fullName: string (1-100 chars),
  username: string (3-30 chars),
  email: string (5-100 chars),
  bio?: string (0-500 chars),
  link?: string,
  gender?: 'Hombre' | 'Mujer',
  profilePicture?: string,
  lastUsernameChange?: number,
  followers: number (≥0),
  following: number (≥0),
  posts: number (≥0)
}
```

**Permisos:**
- 📖 **Lectura**: Pública (perfiles visibles para todos)
- ✏️ **Escritura**: Solo el propietario
- 🔄 **Actualización**: Solo campos de perfil o contadores

### 📸 **posts** - Publicaciones
```javascript
{
  userId: string,
  title: string (1-200 chars),
  description?: string (0-2000 chars),
  mediaUrl: string (10-500 chars),
  mediaType: 'image' | 'video',
  timestamp: timestamp,
  likes: number (≥0),
  comments: number (≥0)
}
```

**Permisos:**
- 📖 **Lectura**: Pública
- ✏️ **Creación**: Solo usuarios autenticados (propios posts)
- 🔄 **Actualización**: Solo contadores de likes/comentarios
- 🗑️ **Eliminación**: Solo el propietario

### 🎬 **reels** - Videos Cortos
```javascript
{
  userId: string,
  title: string (1-200 chars),
  description?: string (0-2000 chars),
  videoUrl: string (10-500 chars),
  timestamp: timestamp,
  likes: number (≥0),
  comments: number (≥0)
}
```

**Permisos:** Similares a posts

### 💬 **comments** - Comentarios
```javascript
{
  postId: string,
  userId: string,
  username: string (3-30 chars),
  profilePicture: string,
  text: string (1-500 chars),
  timestamp: timestamp,
  parentId?: string // Para respuestas
}
```

**Permisos:**
- 📖 **Lectura**: Pública
- ✏️ **Creación**: Solo usuarios autenticados
- 🔄 **Actualización**: Solo el texto (editar comentario)
- 🗑️ **Eliminación**: Solo el propietario

### ❤️ **likes** - Sistema de Likes
```javascript
{
  postId: string,
  userId: string,
  timestamp: timestamp
}
```

**Permisos:**
- 📖 **Lectura**: Pública (para contadores)
- ✏️ **Creación**: Solo usuarios autenticados
- 🗑️ **Eliminación**: Solo el propietario
- ❌ **Actualización**: No permitida

### 👥 **follows** - Sistema de Seguimiento
```javascript
{
  followerId: string,
  followingId: string,
  timestamp: number
}
```

**Validaciones:**
- No puedes seguirte a ti mismo
- Solo el seguidor puede crear/eliminar la relación

### 🪙 **tokens** - Sistema de Tokens
```javascript
{
  balance: number (≥0),
  totalEarned: number (≥0),
  followersCount: number (≥0)
}
```

**Validaciones:**
- Solo incrementos en totalEarned
- Valores no negativos
- Solo el propietario puede modificar

### 📊 **tokenTransactions** - Transacciones
```javascript
{
  userId: string,
  amount: number (>0),
  type: string (3-50 chars),
  timestamp: timestamp,
  recipientId?: string
}
```

**Permisos:**
- 📖 **Lectura**: Solo participantes de la transacción
- ✏️ **Creación**: Solo usuarios autenticados
- ❌ **Modificación**: No permitida (inmutables)

### 🚨 **reports** - Sistema de Reportes
```javascript
{
  reporterId: string,
  contentId: string,
  contentType: string (3-20 chars),
  reason: string (5-500 chars),
  timestamp: timestamp
}
```

**Permisos:**
- 📖 **Lectura**: Solo administradores
- ✏️ **Creación**: Usuarios autenticados
- ❌ **Modificación**: Solo administradores

### 🔔 **notifications** - Notificaciones
```javascript
{
  userId: string,
  type: string (3-50 chars),
  message: string (1-200 chars),
  read: boolean,
  timestamp: timestamp
}
```

**Permisos:**
- 📖 **Lectura**: Solo el propietario
- 🔄 **Actualización**: Solo marcar como leída

## 🔧 Funciones de Validación

### `isAuthenticated()`
Verifica que el usuario esté autenticado.

### `isOwner(userId)`
Verifica que el usuario autenticado sea el propietario del recurso.

### `isValidString(field, minLength, maxLength)`
Valida que un campo sea string y tenga la longitud correcta.

### `isValidTimestamp()`
Valida que el timestamp sea del tipo correcto.

## 📈 Índices Optimizados

### Comentarios
- `postId + timestamp` (orden cronológico)
- `postId + parentId + timestamp` (respuestas anidadas)

### Posts y Reels
- `userId + timestamp` (posts por usuario)

### Likes
- `postId + userId` (verificar likes únicos)

### Seguimientos
- `followerId + timestamp` (seguidos por usuario)
- `followingId + timestamp` (seguidores de usuario)

### Notificaciones
- `userId + read + timestamp` (notificaciones no leídas)

### Transacciones
- `userId + timestamp` (historial de tokens)

## 🚀 Despliegue

### Opción 1: Script Automático
```bash
./deploy-firestore-rules.bat
```

### Opción 2: Manual
```bash
# Desplegar reglas
firebase deploy --only firestore:rules

# Desplegar índices
firebase deploy --only firestore:indexes
```

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ Validación estricta de tipos de datos
- ✅ Límites de tamaño para prevenir spam
- ✅ Verificación de propiedad en operaciones sensibles
- ✅ Prevención de auto-seguimiento

### Performance
- ✅ Índices optimizados para consultas frecuentes
- ✅ Paginación soportada en comentarios
- ✅ Consultas eficientes para feeds

### Escalabilidad
- ✅ Estructura preparada para crecimiento
- ✅ Separación clara de responsabilidades
- ✅ Soporte para funciones de moderación

## 🔄 Migración desde Reglas Anteriores

Las nuevas reglas son **más restrictivas** que las anteriores. Asegúrate de:

1. **Validar datos existentes** - Algunos documentos pueden no cumplir las nuevas validaciones
2. **Actualizar código cliente** - Verificar que todas las operaciones cumplan las nuevas reglas
3. **Probar en desarrollo** - Usar emulador de Firestore para pruebas
4. **Despliegue gradual** - Considerar despliegue en etapas

## 🛠️ Troubleshooting

### Error: "Missing or insufficient permissions"
- Verificar que el usuario esté autenticado
- Confirmar que es el propietario del recurso
- Revisar validaciones de datos

### Error: "Invalid data"
- Verificar tipos de datos (string, number, timestamp)
- Confirmar longitudes de strings
- Validar que los números no sean negativos

### Error: "Index not found"
- Desplegar índices con `firebase deploy --only firestore:indexes`
- Esperar a que los índices se construyan (puede tomar tiempo)

## 📞 Soporte

Para problemas específicos:
1. Revisar logs de Firebase Console
2. Usar emulador para debugging local
3. Verificar reglas en Firebase Console > Firestore > Rules