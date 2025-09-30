import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveUserData, getUserData } from '../lib/userService';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // Ensure user data exists for existing users
        const currentData = getUserData();
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
        await createUserWithEmailAndPassword(auth, email, password);
        const formattedUsername = (username || email.split('@')[0]).replace(/\s+/g, '_');
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
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
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
