import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, orderBy, getDoc } from 'firebase/firestore';
import { getUserDataById } from './userService';

export interface AudioMetadata {
  id?: string;
  name: string;
  url: string;
  duration: number;
  originalDuration: number;
  startTime: number;
  endTime: number;
  userId: string;
  createdAt: string;
  isPublic: boolean;
}

export class AudioService {
  static async uploadAudio(audioBlob: Blob, fileName: string, userId: string): Promise<string> {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const audioRef = ref(storage, `audio/${userId}/${timestamp}_${sanitizedFileName}.wav`);
    
    const metadata = {
      contentType: 'audio/wav',
      cacheControl: 'public,max-age=31536000'
    };
    
    await uploadBytes(audioRef, audioBlob, metadata);
    return await getDownloadURL(audioRef);
  }

  static async saveAudioMetadata(metadata: Omit<AudioMetadata, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'audios'), metadata);
    return docRef.id;
  }

  static async getUserAudios(userId: string): Promise<AudioMetadata[]> {
    const q = query(
      collection(db, 'audios'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AudioMetadata));
  }

  static async deleteAudio(audioId: string, audioUrl: string): Promise<void> {
    // Eliminar archivo de Storage
    const audioRef = ref(storage, audioUrl);
    await deleteObject(audioRef);
    
    // Eliminar metadata de Firestore
    await deleteDoc(doc(db, 'audios', audioId));
  }

  static async updateAudioVisibility(audioId: string, isPublic: boolean): Promise<void> {
    await updateDoc(doc(db, 'audios', audioId), { isPublic });
  }

  static validateAudioFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/webm'];
    
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('audio/')) {
      return { isValid: false, error: 'Formato de audio no soportado' };
    }
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'El archivo es demasiado grande (máximo 50MB)' };
    }
    
    return { isValid: true };
  }

  static async processAndUploadAudio(
    audioBlob: Blob, 
    name: string, 
    userId: string,
    duration: number,
    startTime: number,
    endTime: number,
    isPublic: boolean = false
  ): Promise<AudioMetadata> {
    // Validar tamaño del blob
    if (audioBlob.size > 50 * 1024 * 1024) {
      throw new Error('El audio es muy grande (máximo 50MB)');
    }

    const metadata: Omit<AudioMetadata, 'id'> = {
      name,
      url: '', // Se actualizará después
      duration: endTime - startTime,
      originalDuration: duration,
      startTime,
      endTime,
      userId,
      createdAt: new Date().toISOString(),
      isPublic
    };
    
    // Subir audio y guardar metadata en paralelo
    const [audioUrl, audioId] = await Promise.all([
      this.uploadAudio(audioBlob, name, userId),
      this.saveAudioMetadata(metadata)
    ]);
    
    // Actualizar URL en metadata
    await updateDoc(doc(db, 'audios', audioId), { url: audioUrl });
    
    return {
      id: audioId,
      ...metadata,
      url: audioUrl
    };
  }

  static async getPublicAudios(): Promise<AudioMetadata[]> {
    const q = query(
      collection(db, 'audios'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const audios = await Promise.all(
      querySnapshot.docs.map(async (docSnapshot) => {
        const audioData = docSnapshot.data() as Omit<AudioMetadata, 'id'>;
        let userName = 'Usuario';
        
        try {
          const userData = await getUserDataById(audioData.userId);
          userName = userData?.fullName || userData?.email || 'Usuario';
        } catch (error) {
          console.warn('Could not fetch user data for audio:', docSnapshot.id);
        }
        
        return {
          id: docSnapshot.id,
          ...audioData,
          userName
        } as AudioMetadata & { userName: string };
      })
    );
    
    return audios;
  }

  static async deleteUserAudio(audioId: string, userId: string): Promise<void> {
    const audioDoc = await getDoc(doc(db, 'audios', audioId));
    
    if (!audioDoc.exists()) {
      throw new Error('Audio no encontrado');
    }
    
    const audioData = audioDoc.data() as AudioMetadata;
    
    if (audioData.userId !== userId) {
      throw new Error('No tienes permisos para eliminar este audio');
    }
    
    await AudioService.deleteAudio(audioId, audioData.url);
  }
}

// Funciones exportadas para uso directo
export const getPublicAudios = AudioService.getPublicAudios;
export const getUserAudios = AudioService.getUserAudios;
export const deleteUserAudio = AudioService.deleteUserAudio;
export const processAndUploadAudio = AudioService.processAndUploadAudio;
export const validateAudioFile = AudioService.validateAudioFile;