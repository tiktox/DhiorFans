import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const currentData = await getUserData();
      if (!currentData.fullName) {
        const formattedUsername = (user.displayName || user.email?.split('@')[0] || 'user').replace(/\s+/g, '_').toLowerCase();
        await saveUserData({
          fullName: user.displayName || user.email?.split('@')[0] || 'Usuario',
          username: formattedUsername,
          email: user.email || '',
          profilePicture: user.photoURL || '',
          followers: 0,
          following: 0,
          posts: 0
        });
      }
      console.log('✅ Login con Google exitoso');
    } catch (error: any) {
      console.error('Error con Google:', error);
      setError('Error al iniciar sesión con Google');
    }
    setLoading(false);
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Guardar datos del usuario primero
        await saveUserData({
          fullName: fullName || email.split('@')[0],
          username: formattedUsername,
          email,
          followers: 0,
          following: 0,
          posts: 0
        });
        
        // Email verification desactivado - Firebase tiene problemas de entrega
        console.log('✅ Registro exitoso para:', email);
        
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        webkit-playsinline="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: '100%',
          minHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
          zIndex: 0
        }}
      >
        <source src="https://ik.imagekit.io/lics6cm47/11039880-hd_1920_1080_24fps.mp4?updatedAt=1758496774361" type="video/mp4" />
      </video>
      
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '20px',
        width: '400px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
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
        </form>
        
        <div className="divider">
          <span>o</span>
        </div>
        
        <button className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continuar con Google
        </button>
        
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
