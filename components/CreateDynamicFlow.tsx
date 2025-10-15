import { useState, useEffect } from 'react';
import { getUserData } from '../lib/userService';
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
        const userData = await getUserData();
        setUserTokens(userData.tokens || 90);
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