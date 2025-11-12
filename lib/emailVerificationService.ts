import { auth } from './firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  if (!email.trim()) return false;
  
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const tempPassword = Math.random().toString(36);
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, tempPassword);
    await deleteUser(userCredential.user);
    return true;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return false;
    }
    console.error('Error verificando email:', error);
    return false;
  }
};