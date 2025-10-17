import { useState, useRef, useEffect } from 'react';
import { spendTokens } from '../lib/tokenService';
import { saveUserData, getUserData } from '../lib/userService';
import { uploadProfilePicture } from '../lib/uploadService';
import { auth } from '../lib/firebase';
import { formatLargeNumber } from '../lib/numberFormatter';

interface StoreProps {
  onNavigateBack: () => void;
  userTokens: number;
  onTokensUpdate: (newTokens: number) => void;
}

export default function Store({ onNavigateBack, userTokens, onTokensUpdate }: StoreProps) {
  const [activeTab, setActiveTab] = useState('avatares');
  const [isAnimating, setIsAnimating] = useState(false);
  const [purchasedAvatar, setPurchasedAvatar] = useState<string | null>(null);
  const [showAvatarActions, setShowAvatarActions] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [userAvatars, setUserAvatars] = useState<string[]>([]);
  const [purchasedAvatars, setPurchasedAvatars] = useState<string[]>([]);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string>('');
  const [originalProfilePicture, setOriginalProfilePicture] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    console.log('🔍 DEBUG - Estado inicial:');
    console.log('🔐 Usuario autenticado:', auth.currentUser?.uid);
    console.log('💰 Tokens del usuario:', userTokens);
    console.log('🖼️ Avatares actuales:', userAvatars);
    
    const loadUserAvatars = async () => {
      if (auth.currentUser) {
        try {
          console.log('📊 Cargando avatares del usuario...');
          const data = await getUserData();
          console.log('📊 Datos del usuario obtenidos:', data);
          setUserData(data);
          const avatars = data.avatars || [];
          const purchased = data.purchasedAvatars || [];
          console.log('📊 Avatares encontrados:', avatars);
          console.log('📊 Avatares comprados:', purchased);
          setUserAvatars(avatars);
          setPurchasedAvatars(purchased);
          setCurrentProfilePicture(data.profilePicture || '');
          
          // Migrar originalProfilePicture a lastRealProfilePicture si es necesario
          if (data.originalProfilePicture && !data.lastRealProfilePicture) {
            await saveUserData({ lastRealProfilePicture: data.originalProfilePicture });
          }
          
          setOriginalProfilePicture(data.lastRealProfilePicture || data.originalProfilePicture || '');
        } catch (error) {
          console.error('❌ Error cargando avatares:', error);
        }
      } else {
        console.error('❌ Usuario no autenticado al cargar avatares');
      }
    };
    loadUserAvatars();
  }, []);

  useEffect(() => {
    console.log('🔄 userAvatars actualizado:', userAvatars);
  }, [userAvatars]);

  const handleBuyAvatar = () => {
    if (!auth.currentUser || userTokens < 30000) return;
    setShowWarning(true);
  };

  const confirmPurchase = async () => {
    console.log('🛒 INICIO DE COMPRA');
    console.log('💰 Tokens antes:', userTokens);
    console.log('🔐 Usuario ID:', auth.currentUser?.uid);
    
    if (!auth.currentUser) {
      console.error('❌ Usuario no autenticado');
      return;
    }
    
    setShowWarning(false);
    setIsAnimating(true);
    
    try {
      console.log('💰 Llamando spendTokens...');
      const result = await spendTokens(auth.currentUser.uid, 30000);
      console.log('💰 Resultado spendTokens:', result);
      
      if (result.success) {
        onTokensUpdate(result.remainingTokens);
        console.log('✅ Tokens actualizados:', result.remainingTokens);
        
        setTimeout(() => {
          setIsAnimating(false);
          console.log('📁 Abriendo selector de archivos...');
          fileInputRef.current?.click();
        }, 2000);
      } else {
        console.error('❌ spendTokens falló:', result);
        setIsAnimating(false);
      }
    } catch (error) {
      console.error('❌ Error en confirmPurchase:', error);
      setIsAnimating(false);
    }
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Establecer las dimensiones del canvas
        canvas.width = 140;
        canvas.height = 250;
        
        // Dibujar la imagen redimensionada
        ctx?.drawImage(img, 0, 0, 140, 250);
        
        // Convertir a DataURL
        const resizedDataURL = canvas.toDataURL('image/png');
        resolve(resizedDataURL);
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 SELECCIÓN DE ARCHIVO');
    const file = event.target.files?.[0];
    console.log('📁 Archivo seleccionado:', file);
    
    if (file && file.type === 'image/png') {
      console.log('✅ Archivo PNG válido');
      
      try {
        console.log('🔄 Redimensionando imagen a 140x250...');
        const resizedDataURL = await resizeImage(file);
        console.log('✅ Imagen redimensionada exitosamente');
        console.log('📄 DataURL generado, longitud:', resizedDataURL.length);
        
        setPurchasedAvatar(resizedDataURL);
        setShowAvatarActions(true);
        console.log('✅ Modal de acciones mostrado');
        
      } catch (error) {
        console.error('❌ Error redimensionando imagen:', error);
        alert('Error al procesar la imagen');
      }
    } else {
      console.log('❌ Archivo no válido:', file?.type);
      alert('Solo se permiten archivos PNG');
    }
  };

  const handleAddAvatar = async () => {
    console.log('🖼️ INICIO GUARDADO AVATAR');
    
    if (!purchasedAvatar || !auth.currentUser) {
      console.error('❌ Datos faltantes');
      return;
    }
    
    try {
      // Convertir y subir avatar
      const response = await fetch(purchasedAvatar);
      const blob = await response.blob();
      const file = new File([blob], `avatar_${Date.now()}.png`, { type: 'image/png' });
      const avatarUrl = await uploadProfilePicture(file, auth.currentUser.uid);
      
      // Obtener datos actuales
      const userData = await getUserData();
      
      // CRUCIAL: Preservar foto actual como lastRealProfilePicture si no es avatar
      if (!userData.isAvatar && userData.profilePicture && !userData.lastRealProfilePicture) {
        console.log('💾 PRESERVANDO foto actual antes de avatar:', userData.profilePicture);
        await saveUserData({ lastRealProfilePicture: userData.profilePicture });
      }
      
      // Agregar a avatares comprados
      const currentPurchased = userData.purchasedAvatars || [];
      const updatedPurchased = [...currentPurchased, avatarUrl];
      await saveUserData({ purchasedAvatars: updatedPurchased });
      setPurchasedAvatars(updatedPurchased);
      
      // Establecer avatar como perfil usando el servicio
      const { setAvatarAsProfile } = await import('../lib/profilePictureService');
      await setAvatarAsProfile(avatarUrl);
      
      // Actualizar estado local
      const updatedUserData = await getUserData();
      setCurrentProfilePicture(updatedUserData.profilePicture || '');
      setUserData(updatedUserData);
      
      setShowAvatarActions(false);
      setPurchasedAvatar(null);
      
      console.log('🎉 AVATAR AÑADIDO EXITOSAMENTE');
      alert('¡Avatar añadido a tu perfil!');
      
    } catch (error) {
      console.error('❌ ERROR en handleAddAvatar:', error);
      alert('Error al guardar el avatar: ' + (error as Error).message);
    }
  };

  const addPurchasedAvatar = async (avatarUrl: string) => {
    if (!auth.currentUser) return;
    
    try {
      console.log('🔄 Añadiendo avatar comprado a colección activa...');
      const userData = await getUserData();
      const currentAvatars = userData.avatars || [];
      
      if (!currentAvatars.includes(avatarUrl)) {
        const updatedAvatars = [...currentAvatars, avatarUrl];
        await saveUserData({ avatars: updatedAvatars });
        setUserAvatars(updatedAvatars);
        console.log('✅ Avatar añadido a colección activa');
      }
    } catch (error) {
      console.error('❌ Error añadiendo avatar:', error);
    }
  };

  const useAvatarAsProfile = async (avatarUrl: string) => {
    if (!auth.currentUser) return;
    
    try {
      const { setAvatarAsProfile } = await import('../lib/profilePictureService');
      await setAvatarAsProfile(avatarUrl);
      
      // Recargar datos locales
      const userData = await getUserData();
      setCurrentProfilePicture(userData.profilePicture || '');
      setUserData(userData);
      
      console.log('✅ Avatar establecido como foto de perfil');
    } catch (error) {
      console.error('❌ Error estableciendo avatar como perfil:', error);
    }
  };

  const restoreOriginalProfile = async () => {
    if (!auth.currentUser) return;
    
    try {
      console.log('🔄 INICIANDO RESTAURACIÓN');
      const userData = await getUserData();
      console.log('📋 Datos actuales:', {
        isAvatar: userData.isAvatar,
        lastRealProfilePicture: userData.lastRealProfilePicture,
        originalProfilePicture: userData.originalProfilePicture
      });
      
      const { restoreRealProfilePicture, hasRealProfilePictureToRestore } = await import('../lib/profilePictureService');
      
      // Verificar si hay foto para restaurar
      const canRestore = await hasRealProfilePictureToRestore();
      if (!canRestore) {
        console.log('❌ No se puede restaurar');
        alert('No hay foto de perfil para restaurar');
        return;
      }
      
      await restoreRealProfilePicture();
      
      // Recargar datos locales
      const updatedUserData = await getUserData();
      setCurrentProfilePicture(updatedUserData.profilePicture || '');
      setUserData(updatedUserData);
      
      console.log('✅ Foto de perfil real restaurada exitosamente');
      alert('✅ Foto de perfil restaurada exitosamente');
      
    } catch (error) {
      console.error('❌ Error restaurando foto original:', error);
      alert('Error al restaurar la foto de perfil: ' + (error as Error).message);
    }
  };

  const handleSetAsProfile = async () => {
    if (!purchasedAvatar || !auth.currentUser) return;
    
    try {
      // Guardar la foto original si no existe
      const userData = await getUserData();
      if (!userData.originalProfilePicture && userData.profilePicture) {
        await saveUserData({ originalProfilePicture: userData.profilePicture });
        setOriginalProfilePicture(userData.profilePicture);
      }
      
      // Convertir data URL a File para subir a Firebase Storage
      const response = await fetch(purchasedAvatar);
      const blob = await response.blob();
      const file = new File([blob], 'avatar.png', { type: 'image/png' });
      
      const avatarUrl = await uploadProfilePicture(file, auth.currentUser.uid);
      await saveUserData({ 
        avatar: avatarUrl,
        profilePicture: avatarUrl,
        isAvatar: true
      });
      
      setCurrentProfilePicture(avatarUrl);
      setShowAvatarActions(false);
      setPurchasedAvatar(null);
      alert('¡Avatar establecido como foto de perfil!');
      
      // Recargar datos del perfil si la función está disponible
      if ((window as any).reloadProfileData) {
        (window as any).reloadProfileData();
      }
      if ((window as any).reloadUserData) {
        (window as any).reloadUserData();
      }
    } catch (error) {
      console.error('Error estableciendo como foto de perfil:', error);
      alert('Error al establecer como foto de perfil');
    }
  };

  return (
    <div className="store-container">
      {/* Warning Modal */}
      {showWarning && (
        <div className="warning-overlay">
          <div className="warning-modal">
            <h3>Advertencia</h3>
            <p>Asegúrate de que tu avatar esté en formato PNG y que se vea completo, si no estás seguro de tu elección presiona:</p>
            <div className="warning-buttons">
              <button className="cancel-btn" onClick={() => setShowWarning(false)}>
                Cancelar compra
              </button>
              <button className="confirm-btn" onClick={confirmPurchase}>
                Aceptar compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Animation Overlay */}
      {isAnimating && (
        <div className="token-animation-overlay">
          <div className="token-animation">
            <div className="token-icon">💎</div>
            <div className="token-text">-30,000</div>
          </div>
        </div>
      )}

      {/* Avatar Actions Modal */}
      {showAvatarActions && purchasedAvatar && (
        <div className="avatar-actions-modal">
          <div className="avatar-preview">
            <img src={purchasedAvatar} alt="Avatar" className="avatar-image" />
          </div>
          <div className="avatar-actions">
            <button className="avatar-action-btn add-btn" onClick={handleAddAvatar}>
              Añadir
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="store-header">
        <button className="back-btn" onClick={onNavigateBack}>
          ←
        </button>
        <h2>Tienda</h2>
        <div className="user-tokens">
          💎 {formatLargeNumber(userTokens)}
        </div>
      </div>

      {/* Tabs */}
      <div className="store-tabs">
        <button 
          className={`store-tab ${activeTab === 'avatares' ? 'active' : ''}`}
          onClick={() => setActiveTab('avatares')}
        >
          Avatares
        </button>
        <button 
          className={`store-tab ${activeTab === 'diamantes' ? 'active' : ''}`}
          onClick={() => setActiveTab('diamantes')}
        >
          Diamantes
        </button>
        <button 
          className={`store-tab ${activeTab === 'interfaces' ? 'active' : ''}`}
          onClick={() => setActiveTab('interfaces')}
        >
          Interfaces
        </button>
        <button 
          className={`store-tab ${activeTab === 'vip' ? 'active' : ''}`}
          onClick={() => setActiveTab('vip')}
        >
          VIP
        </button>
        <button 
          className={`store-tab ${activeTab === 'regalos' ? 'active' : ''}`}
          onClick={() => setActiveTab('regalos')}
        >
          Regalos
        </button>
      </div>

      {/* Content */}
      <div className="store-content">
        {activeTab === 'avatares' && (
          <div className="avatares-section">
            {/* Botón para volver a foto original */}
            {userData?.isAvatar && (userData?.lastRealProfilePicture || userData?.originalProfilePicture) && (
              <div className="store-item">
                <div className="item-icon">
                  🔄
                </div>
                <div className="item-info">
                  <h3>Volver a mi foto de perfil</h3>
                  <p>Restaurar tu foto de perfil original</p>
                </div>
                <div className="item-price">
                  <button 
                    className="restore-btn" 
                    onClick={restoreOriginalProfile}
                  >
                    Restaurar
                  </button>
                </div>
              </div>
            )}
            
            <div className="store-item">
              <div className="item-icon">
                ➕
              </div>
              <div className="item-info">
                <h3>{purchasedAvatars.length > 0 ? 'Comprar otro avatar' : 'Añadir un avatar'}</h3>
                <p>Sube cualquier imagen PNG (se redimensionará a 140x250)</p>
              </div>
              <div className="item-price">
                <span className="price">💎 30,000</span>
                <button 
                  className="buy-btn" 
                  onClick={handleBuyAvatar}
                  disabled={userTokens < 30000 || isAnimating}
                >
                  {isAnimating ? 'Comprando...' : (purchasedAvatars.length > 0 ? 'Comprar otro' : 'Comprar')}
                </button>
              </div>
            </div>
            
            {/* Avatares Comprados */}
            {purchasedAvatars.length > 0 && (
              <div className="purchased-avatars-section">
                <h4>Avatares Comprados</h4>
                <div className="avatars-grid">
                  {purchasedAvatars.map((avatarUrl, index) => {
                    const isInCollection = userAvatars.includes(avatarUrl);
                    const isCurrentProfile = currentProfilePicture === avatarUrl;
                    return (
                      <div key={index} className="avatar-item-store">
                        <img src={avatarUrl} alt={`Avatar ${index + 1}`} className="avatar-thumbnail" />
                        <div className="avatar-actions-store">
                          {isCurrentProfile ? (
                            <span className="in-use-text">En uso</span>
                          ) : isInCollection ? (
                            <button 
                              className="choose-avatar-btn"
                              onClick={() => useAvatarAsProfile(avatarUrl)}
                            >
                              Elegir
                            </button>
                          ) : (
                            <button 
                              className="add-avatar-btn"
                              onClick={() => addPurchasedAvatar(avatarUrl)}
                            >
                              Añadir
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            

            
            {userAvatars.length > 0 && (
              <div className="user-avatars-section">
                <h4>Tus Avatares Activos</h4>
                <div className="avatars-grid">
                  {userAvatars.map((avatarUrl, index) => (
                    <div key={index} className="avatar-item">
                      <img src={avatarUrl} alt={`Avatar ${index + 1}`} className="avatar-thumbnail" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diamantes' && (
          <div className="diamantes-section">
            <p className="coming-soon">Próximamente...</p>
          </div>
        )}

        {activeTab === 'interfaces' && (
          <div className="interfaces-section">
            <p className="coming-soon">Próximamente...</p>
          </div>
        )}

        {activeTab === 'vip' && (
          <div className="vip-section">
            <p className="coming-soon">Próximamente...</p>
          </div>
        )}

        {activeTab === 'regalos' && (
          <div className="regalos-section">
            <p className="coming-soon">Próximamente...</p>
          </div>
        )}
      </div>
    </div>
  );
}