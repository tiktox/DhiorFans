import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
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
  updateComments: (postId: string, updater: (prev: CommentsState[string]) => CommentsState[string]) => void;
  resetComments: (postId: string) => void;
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

export const CommentsProvider = ({ children }: { children: ReactNode }) => {
  const [commentsState, setCommentsState] = useState<CommentsState>({});

  const updateComments = useCallback((postId: string, updater: (prev: CommentsState[string]) => CommentsState[string]) => {
    setCommentsState(prev => ({
      ...prev,
      [postId]: updater(prev[postId] || {
        comments: [],
        hasMore: true,
        loading: false,
        expandedReplies: new Set()
      })
    }));
  }, []);

  const resetComments = useCallback((postId: string) => {
    setCommentsState(prev => {
      const { [postId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const contextValue = useMemo(() => ({
    commentsState,
    updateComments,
    resetComments
  }), [commentsState, updateComments, resetComments]);

  return (
    <CommentsContext.Provider value={contextValue}>
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