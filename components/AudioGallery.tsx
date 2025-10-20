import { useState, useRef, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getPublicAudios, getUserAudios, deleteUserAudio } from '../lib/audioService';
import styles from './AudioGallery.module.css';

interface AudioItem {
  id: string;
  name: string;
  url: string;
  duration: number;
  userId: string;
  userName?: string;
  createdAt: Date;
}

interface AudioGalleryProps {
  onNavigateBack: () => void;
  onUseAudio: (audioUrl: string, audioName: string, audioBlob?: Blob) => void;
}

export default function AudioGallery({ onNavigateBack, onUseAudio }: AudioGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'explore' | 'myAudios'>('explore');
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    loadAudios();
  }, [activeFilter]);

  const loadAudios = async () => {
    setLoading(true);
    try {
      let audioList: AudioItem[] = [];
      
      if (activeFilter === 'myAudios' && auth.currentUser) {
        const userAudios = await getUserAudios(auth.currentUser.uid);
        audioList = userAudios.filter(audio => audio.id) as AudioItem[];
      } else {
        const publicAudios = await getPublicAudios();
        audioList = publicAudios.filter(audio => audio.id) as AudioItem[];
      }
      
      setAudios(audioList);
    } catch (error) {
      console.error('Error loading audios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAudios = audios.filter(audio =>
    audio.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = (audioId: string, audioUrl: string) => {
    const currentAudio = audioRefs.current[audioId];
    
    if (playingAudio && playingAudio !== audioId) {
      const prevAudio = audioRefs.current[playingAudio];
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    if (!currentAudio) {
      const audio = new Audio(audioUrl);
      audioRefs.current[audioId] = audio;
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(prev => ({ ...prev, [audioId]: audio.currentTime }));
      });
      
      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
        setCurrentTime(prev => ({ ...prev, [audioId]: 0 }));
      });
      
      audio.play();
      setPlayingAudio(audioId);
    } else {
      if (playingAudio === audioId) {
        currentAudio.pause();
        setPlayingAudio(null);
      } else {
        currentAudio.currentTime = 0;
        currentAudio.play();
        setPlayingAudio(audioId);
      }
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    if (!auth.currentUser) {
      alert('Debes iniciar sesión para eliminar audios');
      return;
    }
    
    const audioToDelete = audios.find(audio => audio.id === audioId);
    if (!audioToDelete || audioToDelete.userId !== auth.currentUser.uid) {
      alert('No tienes permisos para eliminar este audio');
      return;
    }
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${audioToDelete.name}"?`)) {
      try {
        await deleteUserAudio(audioId, auth.currentUser.uid);
        setAudios(prev => prev.filter(audio => audio.id !== audioId));
        
        if (playingAudio === audioId) {
          const audio = audioRefs.current[audioId];
          if (audio) {
            audio.pause();
            delete audioRefs.current[audioId];
          }
          setPlayingAudio(null);
        }
        
        console.log('Audio eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting audio:', error);
        alert('Error al eliminar el audio. Inténtalo de nuevo.');
      }
    }
  };

  const PlayPauseIcon = ({ isPlaying }: { isPlaying: boolean }) => {
    return isPlaying ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
        <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M6 3V21L18 12L6 3Z" fill="currentColor"/>
      </svg>
    );
  };

  return (
    <div className={styles.audioGallery}>
      <div className={styles.galleryHeader}>
        <button className={styles.backButton} onClick={onNavigateBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1>Galería de audio</h1>
      </div>

      <div className={styles.galleryContent}>
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Buscar audios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterSection}>
          <button
            className={`${styles.filterButton} ${activeFilter === 'myAudios' ? styles.active : ''}`}
            onClick={() => setActiveFilter('myAudios')}
          >
            Mis audios
          </button>
          <button
            className={`${styles.filterButton} ${activeFilter === 'explore' ? styles.active : ''}`}
            onClick={() => setActiveFilter('explore')}
          >
            Explorar
          </button>
        </div>

        <div className={styles.audioList}>
          {loading ? (
            <div className={styles.loading}>Cargando audios...</div>
          ) : filteredAudios.length === 0 ? (
            <div className={styles.noAudios}>
              {activeFilter === 'myAudios' ? 'No tienes audios publicados' : 'No se encontraron audios'}
            </div>
          ) : (
            filteredAudios.map((audio) => (
              <div key={audio.id} className={styles.audioItem}>
                <div className={styles.audioInfo}>
                  <h3 className={styles.audioName}>{audio.name}</h3>
                  {activeFilter === 'explore' && audio.userName && (
                    <p className={styles.audioAuthor}>Por: {audio.userName}</p>
                  )}
                </div>

                <div className={styles.audioControls}>
                  <button
                    className={styles.playButton}
                    onClick={() => togglePlayback(audio.id, audio.url)}
                  >
                    <PlayPauseIcon isPlaying={playingAudio === audio.id} />
                  </button>
                  
                  <div className={styles.timeInfo}>
                    <span className={styles.currentTime}>
                      {formatTime(currentTime[audio.id] || 0)}
                    </span>
                    <span className={styles.separator}>/</span>
                    <span className={styles.totalTime}>
                      {formatTime(audio.duration)}
                    </span>
                  </div>
                </div>

                <div className={styles.audioActions}>
                  <button
                    className={styles.useButton}
                    onClick={async () => {
                      try {
                        const response = await fetch(audio.url);
                        const audioBlob = await response.blob();
                        onUseAudio(audio.url, audio.name, audioBlob);
                      } catch (error) {
                        console.error('Error loading audio:', error);
                        onUseAudio(audio.url, audio.name);
                      }
                    }}
                  >
                    Usar este audio
                  </button>
                  
                  {auth.currentUser && audio.userId === auth.currentUser.uid && (
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteAudio(audio.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}