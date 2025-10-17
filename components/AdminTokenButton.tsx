import { useState } from 'react';
import { addTokens } from '../lib/tokenService';

interface AdminTokenButtonProps {
  userId: string;
  onTokensAdded?: (newTotal: number) => void;
}

export default function AdminTokenButton({ userId, onTokensAdded }: AdminTokenButtonProps) {
  const [isUsed, setIsUsed] = useState(false);

  const handleAddTokens = async () => {
    if (isUsed) return;
    
    const result = await addTokens(userId, 100000000); // 100M tokens
    if (result.success) {
      setIsUsed(true);
      onTokensAdded?.(result.totalTokens);
    }
  };

  if (isUsed) return null;

  
}