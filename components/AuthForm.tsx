import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { saveUserData, getUserData, checkUsernameAvailability } from '../lib/userService';
import { checkEmailAvailability } from '../lib/emailVerificationService';
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
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Sincronizar usuario automáticamente cuando se autentica
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);
          
          if (!docSnap.exists()) {
            console.log('🔄 Sincronizando usuario automáticamente...');
            const userData = {
              fullName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
              username: (currentUser.email?.split('@')[0] || 'usuario').replace(/\s+/g, '_').toLowerCase(),
              email: currentUser.email?.toLowerCase() || '',
              bio: '',
              link: '',
              profilePicture: currentUser.photoURL || '',
              followers: 0,
              following: 0,
              posts: 0
            };
            
            await setDoc(userRef, userData);
            console.log('✅ Usuario sincronizado automáticamente');
          }
        } catch (error) {
          console.error('Error sincronizando usuario:', error);
        }
      }
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

  const checkEmail = async (value: string) => {
    if (!value.trim() || isLogin) {
      setEmailStatus('idle');
      return;
    }
    
    setEmailStatus('checking');
    
    const available = await checkEmailAvailability(value);
    
    setEmailStatus(available ? 'available' : 'taken');
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError('');
    
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }
    
    if (!value.trim() || isLogin) {
      setEmailStatus('idle');
      return;
    }
    
    const timeout = setTimeout(() => {
      checkEmail(value);
    }, 500);
    
    setEmailCheckTimeout(timeout);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmailStatus('idle');
    setUsernameStatus('idle');
    setError('');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Siempre sincronizar usuario de Google
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        const formattedUsername = (user.displayName || user.email?.split('@')[0] || 'user').replace(/\s+/g, '_').toLowerCase();
        const userData = {
          fullName: user.displayName || user.email?.split('@')[0] || 'Usuario',
          username: formattedUsername,
          email: user.email?.toLowerCase() || '',
          bio: '',
          link: '',
          profilePicture: user.photoURL || '',
          followers: 0,
          following: 0,
          posts: 0
        };
        
        await setDoc(userRef, userData);
        console.log('✅ Usuario de Google sincronizado');
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
        
        if (emailStatus === 'taken') {
          setError('Este correo electrónico ya está registrado');
          setLoading(false);
          return;
        }
        
        if (emailStatus !== 'available') {
          setError('Por favor espera a que se valide el correo electrónico');
          setLoading(false);
          return;
        }
        
        const formattedUsername = (username || email.split('@')[0]).replace(/\s+/g, '_').toLowerCase();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Guardar datos del usuario directamente en Firestore
        const userData = {
          fullName: fullName || email.split('@')[0],
          username: formattedUsername,
          email: email.toLowerCase(),
          bio: '',
          link: '',
          profilePicture: '',
          followers: 0,
          following: 0,
          posts: 0
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        console.log('✅ Usuario registrado y guardado en Firestore');
        
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
          
          <div className="email-input-wrapper">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              className={!isLogin && emailStatus === 'taken' ? 'input-error' : !isLogin && emailStatus === 'available' ? 'input-success' : ''}
            />
            {!isLogin && emailStatus === 'checking' && <span className="checking-text">Verificando correo...</span>}
            {!isLogin && emailStatus === 'available' && <span className="success-text">✓ Correo disponible</span>}
            {!isLogin && emailStatus === 'taken' && <span className="error-text">✗ Este correo ya está registrado</span>}
          </div>
          
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
          {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
          <button 
            type="button" 
            onClick={toggleMode}
            className="switch-btn"
          >
            {isLogin ? 'Registrarme' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
