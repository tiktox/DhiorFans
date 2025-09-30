import { useState, useEffect } from 'react';
import { UserData, saveUserData, validateUsername } from '../lib/userService';
import { uploadProfilePicture } from '../lib/uploadService';
import { auth } from '../lib/firebase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  onSave: (updatedData: UserData) => void;
}

export default function EditProfileModal({ isOpen, onClose, userData, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
    link: '',
    gender: '' as 'Hombre' | 'Mujer' | '',
    profilePicture: ''
  });
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    if (isOpen && userData) {
      setFormData({
        fullName: userData.fullName || '',
        username: userData.username || '',
        bio: userData.bio || '',
        link: userData.link || '',
        gender: userData.gender || '',
        profilePicture: userData.profilePicture || ''
      });
    }
  }, [isOpen, userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username
    const usernameValidation = validateUsername(
      formData.username,
      userData.username,
      userData.lastUsernameChange
    );
    
    if (!usernameValidation.valid) {
      setUsernameError(usernameValidation.error || '');
      return;
    }
    
    const updatedData: UserData = {
      ...userData,
      fullName: formData.fullName,
      username: formData.username,
      bio: formData.bio,
      link: formData.link,
      gender: formData.gender || undefined,
      profilePicture: formData.profilePicture
    };

    await saveUserData(updatedData);
    onSave(updatedData);
    onClose();
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
        const downloadURL = await uploadProfilePicture(file, auth.currentUser.uid);
        setFormData({ ...formData, profilePicture: downloadURL });
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert(error instanceof Error ? error.message : 'Error al subir la imagen');
      }
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, username: value });
    setUsernameError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar perfil</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group">
            <label>Foto de perfil</label>
            <div className="profile-picture-upload">
              <div className="current-picture">
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
            />
            <small className="username-help">Los espacios se reemplazarán por guiones bajos (_)</small>
            {usernameError && <div className="error-message">{usernameError}</div>}
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

          <div className="form-group">
            <label>Sexo</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Hombre' | 'Mujer' | '' })}
            >
              <option value="">Seleccionar</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="save-btn">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}