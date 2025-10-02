import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Comment } from '../lib/commentService';
import { QueryDocumentSnapshot } from 'firebase/firestore';

interface CommentsState {
  [postId: string]: {
    comments: Comment[];
    lastDoc?: QueryDocumentSnapshot;
    hasMore: boolean;
    loading: boolean;
    expandedReplies: Set<string>;
  };
}

interface CommentsContextType {
  commentsState: CommentsState;
  setCommentsState: React.Dispatch<React.SetStateAction<CommentsState>>;
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

export const CommentsProvider = ({ children }: { children: ReactNode }) => {
  const [commentsState, setCommentsState] = useState<CommentsState>({});

  return (
    <CommentsContext.Provider value={{ commentsState, setCommentsState }}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useCommentsContext = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useCommentsContext must be used within CommentsProvider');
  }
  return context;
};