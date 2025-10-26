import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { saveUserData, getUserData, checkUsernameAvailability } from '../lib/userService';
import Home from './Home';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const checkUsername = async (value: string) => {
    if (!value.trim() || isLogin) {
      setUsernameStatus('idle');
      return;
    }
    
    setUsernameStatus('checking');
    
    const formattedUsername = value.replace(/\s+/g, '_').toLowerCase();
    const available = await checkUsernameAvailability(formattedUsername);
    
    setUsernameStatus(available ? 'available' : 'taken');
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }
    
    if (!value.trim()) {
      setUsernameStatus('idle');
      return;
    }
    
    const timeout = setTimeout(() => {
      checkUsername(value);
    }, 500);
    
    setUsernameCheckTimeout(timeout);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // Ensure user data exists for existing users
        const currentData = await getUserData(); // This is already async, which is good
        if (!currentData.fullName || currentData.fullName === currentData.email) {
          const formattedUsername = email.split('@')[0].replace(/\s+/g, '_');
          await saveUserData({
            fullName: email.split('@')[0],
            username: formattedUsername,
            email,
            followers: 0,
            following: 0,
            posts: 0
          });
        }
        console.log('Login exitoso');
      } else {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        
        if (usernameStatus === 'taken') {
          setError('Este nombre de usuario ya está en uso');
          setLoading(false);
          return;
        }
        
        if (usernameStatus !== 'available') {
          setError('Por favor espera a que se valide el nombre de usuario');
          setLoading(false);
          return;
        }
        
        const formattedUsername = (username || email.split('@')[0]).replace(/\s+/g, '_').toLowerCase();
        await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData({
          fullName: fullName || email.split('@')[0],
          username: formattedUsername,
          email,
          followers: 0,
          following: 0,
          posts: 0
        });
        console.log('Registro exitoso');
      }
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      setError(error.message);
    }
    setLoading(false);
  };

  if (user) {
    return <Home />;
  }

  return (
    <div className="auth-container">
      <video className="background-video" autoPlay loop muted>
        <source src="https://ik.imagekit.io/lics6cm47/11039880-hd_1920_1080_24fps.mp4?updatedAt=1758496774361" type="video/mp4" />
      </video>
      
      <div className="auth-content">
        <h1 className="logo">Dhiorfans</h1>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <div className="username-input-wrapper">
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
                  className={usernameStatus === 'taken' ? 'input-error' : usernameStatus === 'available' ? 'input-success' : ''}
                />
                {usernameStatus === 'checking' && <span className="checking-text">Validando nombre de usuario...</span>}
                {usernameStatus === 'available' && <span className="success-text">✓ Nombre de usuario disponible</span>}
                {usernameStatus === 'taken' && <span className="error-text">✗ Este nombre de usuario ya está en uso</span>}
              </div>
            </>
          )}
          
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {!isLogin && (
            <input
              type="password"
              placeholder="Repetir contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
          
          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar sesión' : 'Registrarme')}
          </button>
          
          {isLogin && (
            <a href="#" className="forgot-password">Olvidé mi contraseña</a>
          )}
        </form>
        
        <p className="switch-mode">
          ¿No tienes una cuenta?{' '}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="switch-btn"
          >
            {isLogin ? 'Registrarme' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
