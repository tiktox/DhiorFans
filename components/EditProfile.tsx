import { useState, useEffect } from 'react';
import { UserData, saveUserData, validateUsername, checkUsernameAvailability } from '../lib/userService';
import { uploadProfilePicture } from '../lib/uploadService';
import { auth } from '../lib/firebase';

interface EditProfileProps {
  userData: UserData;
  onNavigateBack: () => void;
  onSave: (updatedData: UserData) => void;
}

export default function EditProfile({ userData, onNavigateBack, onSave }: EditProfileProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
    link: '',
    profilePicture: ''
  });
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || '',
        username: userData.username || '',
        bio: userData.bio || '',
        link: userData.link || '',
        profilePicture: userData.profilePicture || ''
      });
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameStatus === 'taken') {
      alert('Este nombre de usuario ya está en uso');
      return;
    }
    
    const usernameValidation = await validateUsername(
      formData.username,
      userData.username,
      userData.lastUsernameChange
    );
    
    if (!usernameValidation.valid) {
      alert(usernameValidation.error || 'Error al validar nombre de usuario');
      return;
    }
    
    try {
      const updatedData: Partial<UserData> = {
        fullName: formData.fullName,
        username: formData.username,
        bio: formData.bio,
        link: formData.link,
        lastUsernameChange: formData.username !== userData.username ? Date.now() : userData.lastUsernameChange
      };

      console.log('💾 Guardando perfil actualizado:', updatedData);
      await saveUserData(updatedData);
      
      // Crear objeto completo para onSave
      const completeData: UserData = {
        ...userData,
        ...updatedData
      };
      console.log('✅ Perfil actualizado exitosamente');
      onSave(completeData);
      onNavigateBack();
    } catch (error: any) {
      console.error('Error en handleSubmit:', error);
      alert(error.message || 'Error al guardar los cambios. Inténtalo de nuevo.');
    }
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 151) {
      setFormData({ ...formData, bio: value });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && auth.currentUser) {
      try {
        console.log('📷 Subiendo nueva foto de perfil desde EditProfile');
        const downloadURL = await uploadProfilePicture(file, auth.currentUser.uid);
        
        // CRUCIAL: Usar el servicio para cambios globales
        const { setProfilePicture } = await import('../lib/profilePictureService');
        await setProfilePicture(downloadURL);
        
        // Actualizar estado local
        setFormData({ ...formData, profilePicture: downloadURL });
        
        console.log('✅ Foto de perfil actualizada globalmente desde EditProfile');
        
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert(error instanceof Error ? error.message : 'Error al subir la imagen');
      }
    }
  };

  const checkUsername = async (value: string) => {
    const formattedUsername = value.replace(/\s+/g, '_').toLowerCase();
    const originalUsername = userData.username.toLowerCase();
    
    if (formattedUsername === originalUsername) {
      setUsernameStatus('idle');
      return;
    }
    
    if (!value.trim()) {
      setUsernameStatus('idle');
      return;
    }
    
    setUsernameStatus('checking');
    const available = await checkUsernameAvailability(formattedUsername);
    setUsernameStatus(available ? 'available' : 'taken');
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, username: value });
    
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }
    
    const timeout = setTimeout(() => {
      checkUsername(value);
    }, 500);
    
    setUsernameCheckTimeout(timeout);
  };

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <button className="back-btn" onClick={onNavigateBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h2>Editar perfil</h2>
        <div></div>
      </div>
      
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="form-group">
          <label>Foto de perfil</label>
          <div className="profile-picture-upload">
            <div className="current-picture profile-pic-edit">
              {formData.profilePicture ? (
                <img src={formData.profilePicture} alt="Perfil" />
              ) : (
                <div className="no-picture">Sin foto</div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
              id="profile-picture"
            />
            <label htmlFor="profile-picture" className="upload-btn">
              Cambiar foto
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Nombre de usuario</label>
          <input
            type="text"
            value={formData.username}
            onChange={handleUsernameChange}
            required
            className={usernameStatus === 'taken' ? 'input-error' : usernameStatus === 'available' ? 'input-success' : ''}
          />
          <small className="username-help">Los espacios se reemplazarán por guiones bajos (_)</small>
          {usernameStatus === 'checking' && <small className="checking-text">Validando nombre de usuario...</small>}
          {usernameStatus === 'available' && <small className="success-text">✓ Nombre de usuario disponible</small>}
          {usernameStatus === 'taken' && <div className="error-message">✗ Este nombre de usuario ya está en uso</div>}
        </div>

        <div className="form-group">
          <label>Presentación ({formData.bio.length}/151)</label>
          <textarea
            value={formData.bio}
            onChange={handleBioChange}
            placeholder="Cuéntanos sobre ti..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Enlace</label>
          <input
            type="url"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="https://..."
          />
        </div>



        <div className="edit-profile-actions">
          <button type="submit" className="save-btn">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}