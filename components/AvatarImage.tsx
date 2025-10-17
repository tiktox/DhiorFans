import React from 'react';

interface AvatarImageProps {
  src?: string;
  alt?: string;
  isAvatar?: boolean;
  className?: string;
  onClick?: () => void;
  defaultContent?: React.ReactNode;
}

export default function AvatarImage({ 
  src, 
  alt = "Avatar", 
  isAvatar = false, 
  className = "", 
  onClick,
  defaultContent = "👤"
}: AvatarImageProps) {
  const baseClass = className || "user-avatar";
  const avatarClass = isAvatar ? `${baseClass} avatar-format` : baseClass;

  return (
    <div 
      className={avatarClass}
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