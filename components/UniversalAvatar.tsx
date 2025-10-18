import React from 'react';

interface UniversalAvatarProps {
  src?: string;
  alt?: string;
  isAvatar?: boolean;
  size?: 'small' | 'medium' | 'large' | 'profile' | 'nav' | 'comment' | 'chat' | 'conversation';
  onClick?: () => void;
  className?: string;
  defaultContent?: React.ReactNode;
}

/**
 * Componente universal para mostrar avatares con formato automático
 * - Fotos normales: formato circular con borde blanco
 * - Avatares: formato rectangular con borde azul
 */
export default function UniversalAvatar({ 
  src, 
  alt = "Avatar", 
  isAvatar = false, 
  size = 'medium',
  onClick,
  className = '',
  defaultContent = "👤"
}: UniversalAvatarProps) {
  
  // Determinar clases CSS basadas en el tamaño y tipo
  const getSizeClasses = () => {
    const baseClass = className || 'universal-avatar';
    
    switch (size) {
      case 'nav':
        return isAvatar 
          ? `${baseClass} nav-avatar-format` 
          : `${baseClass} nav-photo-format`;
      case 'small':
        return isAvatar 
          ? `${baseClass} small-avatar-format` 
          : `${baseClass} small-photo-format`;
      case 'comment':
        return isAvatar 
          ? `${baseClass} comment-avatar-format` 
          : `${baseClass} comment-photo-format`;
      case 'chat':
        return isAvatar 
          ? `${baseClass} chat-avatar-format` 
          : `${baseClass} chat-photo-format`;
      case 'conversation':
        return isAvatar 
          ? `${baseClass} conversation-avatar-format` 
          : `${baseClass} conversation-photo-format`;
      case 'profile':
        return isAvatar 
          ? `${baseClass} profile-avatar-format` 
          : `${baseClass} profile-photo-format`;
      case 'large':
        return isAvatar 
          ? `${baseClass} large-avatar-format` 
          : `${baseClass} large-photo-format`;
      default:
        return isAvatar 
          ? `${baseClass} avatar-format` 
          : `${baseClass} photo-format`;
    }
  };

  return (
    <div 
      className={getSizeClasses()}
      data-is-avatar={isAvatar ? 'true' : 'false'}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="default-avatar">
          {defaultContent}
        </div>
      )}
    </div>
  );
}

// Estilos CSS específicos para el componente universal
export const UniversalAvatarStyles = `
/* Estilos base para avatar universal */
.universal-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s ease;
}

.universal-avatar img {
  width: 100%;
  height: 100%;
}

/* Navegación */
.nav-avatar-format {
  width: 20px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid #2196f3;
  background: transparent;
}

.nav-avatar-format img {
  object-fit: contain;
}

.nav-photo-format {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid white;
  background: #333;
}

.nav-photo-format img {
  object-fit: cover;
}

/* Pequeño */
.small-avatar-format {
  width: 28px;
  height: 50px;
  border-radius: 6px;
  border: 1px solid #2196f3;
  background: transparent;
}

.small-avatar-format img {
  object-fit: contain;
}

.small-photo-format {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
  background: #333;
}

.small-photo-format img {
  object-fit: cover;
}

/* Comentarios */
.comment-avatar-format {
  width: 28px;
  height: 50px;
  border-radius: 6px;
  border: 2px solid #2196f3;
  background: transparent;
}

.comment-avatar-format img {
  object-fit: contain;
}

.comment-photo-format {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
  background: #333;
}

.comment-photo-format img {
  object-fit: cover;
}

/* Chat */
.chat-avatar-format {
  width: 24px;
  height: 42px;
  border-radius: 6px;
  border: 1px solid rgba(33, 149, 243, 0.6);
  background: transparent;
}

.chat-avatar-format img {
  object-fit: contain;
}

.chat-photo-format {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid white;
  background: #333;
}

.chat-photo-format img {
  object-fit: cover;
}

/* Conversaciones */
.conversation-avatar-format {
  width: 35px;
  height: 62px;
  border-radius: 6px;
  border: 2px solid #2196f3;
  background: transparent;
}

.conversation-avatar-format img {
  object-fit: contain;
}

.conversation-photo-format {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid white;
  background: #333;
}

.conversation-photo-format img {
  object-fit: cover;
}

/* Perfil */
.profile-avatar-format {
  width: 84px;
  height: 150px;
  border-radius: 8px;
  border: none;
  background: transparent;
}

.profile-avatar-format img {
  object-fit: contain;
}

.profile-photo-format {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid white;
  background: #333;
}

.profile-photo-format img {
  object-fit: cover;
}

/* Grande */
.large-avatar-format {
  width: 140px;
  height: 250px;
  border-radius: 12px;
  border: none;
  background: transparent;
}

.large-avatar-format img {
  object-fit: contain;
}

.large-photo-format {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid white;
  background: #333;
}

.large-photo-format img {
  object-fit: cover;
}

/* Default avatar */
.universal-avatar .default-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #666;
  width: 100%;
  height: 100%;
}

/* Hover effects */
.universal-avatar:hover {
  transform: translateY(-1px);
}

.nav-avatar-format:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.nav-photo-format:hover {
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
}
`;