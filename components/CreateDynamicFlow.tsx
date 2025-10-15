import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserTokens } from '../lib/tokenService';
import CreateDynamic from './CreateDynamic';
import Editor from './Editor';

interface MediaFile {
  url: string;
  file: File;
  type: 'image' | 'video';
}

interface CreateDynamicFlowProps {
  onNavigateBack: () => void;
  onPublish?: () => void;
  onSwitchToPost?: () => void;
}

export default function CreateDynamicFlow({ onNavigateBack, onPublish, onSwitchToPost }: CreateDynamicFlowProps) {
  const [currentStep, setCurrentStep] = useState<'selector' | 'editor'>('selector');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [userTokens, setUserTokens] = useState(90);

  // Cargar tokens del usuario
  useEffect(() => {
    const loadUserTokens = async () => {
      try {
        if (auth.currentUser) {
          const tokenData = await getUserTokens(auth.currentUser.uid);
          setUserTokens(tokenData?.tokens || 90);
        }
      } catch (error) {
        console.error('Error loading user tokens:', error);
      }
    };
    loadUserTokens();
  }, []);

  const handleNavigateToEditor = (file: MediaFile) => {
    setSelectedFile(file);
    setCurrentStep('editor');
  };

  const handleBackFromEditor = () => {
    setCurrentStep('selector');
  };

  if (currentStep === 'selector') {
    return (
      <CreateDynamic 
        onNavigateBack={onNavigateBack}
        onNavigateToEditor={handleNavigateToEditor}
        onSwitchToPost={onSwitchToPost}
      />
    );
  }

  if (currentStep === 'editor' && selectedFile) {
    return (
      <Editor 
        mediaFile={selectedFile}
        onNavigateBack={handleBackFromEditor}
        userTokens={userTokens}
      />
    );
  }

  return null;
}