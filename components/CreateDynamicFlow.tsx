import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserTokens } from '../lib/tokenService';
import CreateDynamic from './CreateDynamic';
import Editor from './Editor';
import BasicEditor from './BasicEditor';

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
  const [currentStep, setCurrentStep] = useState<'selector' | 'editor' | 'multi-editor'>('selector');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
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

  const handleNavigateToEditor = (file: MediaFile | MediaFile[]) => {
    if (Array.isArray(file)) {
      setSelectedFiles(file);
      setCurrentStep('multi-editor');
    } else {
      setSelectedFile(file);
      setCurrentStep('editor');
    }
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

  if (currentStep === 'multi-editor' && selectedFiles.length > 0) {
    return (
      <BasicEditor 
        mediaFile={selectedFiles[0]}
        multipleImages={selectedFiles}
        onNavigateBack={handleBackFromEditor}
        onPublish={() => {
          onPublish?.();
        }}
      />
    );
  }

  return null;
}