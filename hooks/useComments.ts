import { useCallback } from 'react';
import { getCommentsForPost, createComment, Comment, CommentsPage } from '../lib/commentService';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { useCommentsContext } from '../contexts/CommentsContext';

export const useComments = () => {
  const { commentsState, setCommentsState } = useCommentsContext();

  const loadComments = useCallback(async (
    postId: string,
    pageSize: number = 10,
    reset: boolean = false
  ) => {
    setCommentsState(prev => ({
      ...prev,
      [postId]: {
        comments: prev[postId]?.comments || [],
        hasMore: prev[postId]?.hasMore ?? true,
        expandedReplies: prev[postId]?.expandedReplies || new Set(),
        loading: true,
      }
    }));

    try {
      let lastDoc: QueryDocumentSnapshot | undefined;
      
      setCommentsState(prev => {
        const currentState = prev[postId];
        lastDoc = reset ? undefined : currentState?.lastDoc;
        return prev;
      });
      
      const page: CommentsPage = await getCommentsForPost(postId, pageSize, lastDoc);
      
      setCommentsState(prev => ({
        ...prev,
        [postId]: {
          comments: reset ? page.comments : [...(prev[postId]?.comments || []), ...page.comments],
          lastDoc: page.lastDoc,
          hasMore: page.hasMore,
          loading: false,
          expandedReplies: prev[postId]?.expandedReplies || new Set(),
        }
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      setCommentsState(prev => ({
        ...prev,
        [postId]: {
          comments: prev[postId]?.comments || [],
          hasMore: prev[postId]?.hasMore ?? true,
          expandedReplies: prev[postId]?.expandedReplies || new Set(),
          loading: false,
        }
      }));
    }
  }, []);

  const addComment = useCallback(async (
    postId: string,
    text: string,
    postCollection: 'reels' | 'posts' = 'reels',
    parentId?: string
  ) => {
    try {
      const newComment = await createComment(postId, text, postCollection, parentId);
      
      setCommentsState(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: [...(prev[postId]?.comments || []), newComment],
          expandedReplies: prev[postId]?.expandedReplies || new Set(),
        }
      }));
      
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, []);

  const toggleReplies = useCallback((postId: string, commentId: string) => {
    setCommentsState(prev => {
      const currentState = prev[postId] || {
        comments: [],
        hasMore: true,
        loading: false,
        expandedReplies: new Set(),
      };
      
      const newExpanded = new Set(currentState.expandedReplies);
      if (newExpanded.has(commentId)) {
        newExpanded.delete(commentId);
      } else {
        newExpanded.add(commentId);
      }
      
      return {
        ...prev,
        [postId]: {
          ...currentState,
          expandedReplies: newExpanded,
        }
      };
    });
  }, []);

  const getPostComments = useCallback((postId: string) => {
    return commentsState[postId] || {
      comments: [],
      hasMore: true,
      loading: false,
      expandedReplies: new Set(),
    };
  }, [commentsState]);

  const loadMoreComments = useCallback(async (postId: string, pageSize: number = 10) => {
    const currentState = commentsState[postId];
    if (!currentState?.hasMore || currentState.loading) return;
    
    await loadComments(postId, pageSize, false);
  }, [loadComments, commentsState]);

  return {
    loadComments,
    addComment,
    getPostComments,
    toggleReplies,
    loadMoreComments,
  };
};