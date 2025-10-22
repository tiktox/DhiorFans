import { useCallback } from 'react';
import { getCommentsForPost, createComment, Comment, CommentsPage } from '../lib/commentService';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { useCommentsContext } from '../contexts/CommentsContext';

export const useComments = () => {
  const { commentsState, updateComments } = useCommentsContext();

  const loadComments = useCallback(async (
    postId: string,
    pageSize: number = 10,
    reset: boolean = false
  ) => {
    updateComments(postId, prev => ({
      ...prev,
      loading: true,
    }));

    try {
      let lastDoc: QueryDocumentSnapshot | undefined;
      
      const currentState = commentsState[postId];
      lastDoc = reset ? undefined : currentState?.lastDoc;
      
      const page: CommentsPage = await getCommentsForPost(postId, pageSize, lastDoc);
      
      updateComments(postId, prev => ({
        ...prev,
        comments: reset ? page.comments : [...prev.comments, ...page.comments],
        lastDoc: page.lastDoc,
        hasMore: page.hasMore,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      updateComments(postId, prev => ({
        ...prev,
        loading: false,
      }));
    }
  }, [updateComments]);

  const addComment = useCallback(async (
    postId: string,
    text: string,
    postCollection: 'reels' | 'posts' = 'reels',
    parentId?: string
  ) => {
    try {
      const newComment = await createComment(postId, text, postCollection, parentId);
      
      updateComments(postId, prev => ({
        ...prev,
        comments: [...prev.comments, newComment],
      }));
      
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, [updateComments]);

  const toggleReplies = useCallback((postId: string, commentId: string) => {
    updateComments(postId, prev => {
      const newExpanded = new Set(prev.expandedReplies);
      if (newExpanded.has(commentId)) {
        newExpanded.delete(commentId);
      } else {
        newExpanded.add(commentId);
      }
      
      return {
        ...prev,
        expandedReplies: newExpanded,
      };
    });
  }, [updateComments]);

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