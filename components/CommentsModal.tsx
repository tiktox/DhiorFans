import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUsersDataByIds, UserData } from '../lib/userService';
import { Comment } from '../lib/commentService';
import { useComments } from '../hooks/useComments';

interface CommentWithReplies extends Comment {
  replies?: Comment[];
}

interface CommentsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onProfileClick?: (userId: string) => void;
}

export default function CommentsModal({ postId, isOpen, onClose, onProfileClick }: CommentsModalProps) {
  const { loadComments, addComment, getPostComments, toggleReplies } = useComments();
  const { comments: flatComments, hasMore, loading, expandedReplies } = getPostComments(postId);
  
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [usersData, setUsersData] = useState<{[key: string]: UserData}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    if (isOpen) {
      const { comments } = getPostComments(postId);
      if (comments.length === 0) {
        loadComments(postId, 10, true);
      }
    }
  }, [isOpen, postId]);

  // Auto-ocultar toast después de 1 segundo
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Organizar comentarios planos en estructura anidada
  useEffect(() => {
    if (!flatComments || flatComments.length === 0) {
      setComments([]);
      return;
    }

    const commentsMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];
    
    // Crear mapa de comentarios
    flatComments.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Organizar jerarquía
    flatComments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentsMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(commentsMap.get(comment.id)!);
        }
      } else {
        rootComments.push(commentsMap.get(comment.id)!);
      }
    });
    
    setComments(rootComments);
  }, [flatComments]);

  // Cargar datos de usuarios cuando cambien los comentarios
  useEffect(() => {
    const loadUsersData = async () => {
      if (!flatComments || flatComments.length === 0) return;

      const userIds = new Set<string>();
      flatComments.forEach(comment => {
        userIds.add(comment.userId);
      });

      if (userIds.size > 0) {
        try {
          const userData = await getUsersDataByIds(Array.from(userIds));
          setUsersData(userData);
        } catch (error) {
          console.error('Error cargando datos de usuarios:', error);
        }
      }
    };

    loadUsersData();
  }, [flatComments]);

  const handleAddComment = async () => {
    const trimmedComment = newComment.trim();
    
    if (!trimmedComment || isSubmitting) {
      return;
    }
    
    // Validaciones
    if (trimmedComment.length > 500) {
      setToast({message: 'El comentario no puede exceder 500 caracteres', type: 'error'});
      return;
    }
    
    if (!auth.currentUser) {
      setToast({message: 'Debes iniciar sesión para comentar', type: 'error'});
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment(postId, trimmedComment);
      setNewComment('');
      setToast({message: 'Comentario publicado', type: 'success'});
    } catch (error) {
      console.error('Error agregando comentario:', error);
      setToast({message: 'Error al publicar comentario', type: 'error'});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
    const trimmedReply = replyText.trim();
    
    if (!trimmedReply || !auth.currentUser) return;
    
    // Validaciones
    if (trimmedReply.length > 500) {
      setToast({message: 'La respuesta no puede exceder 500 caracteres', type: 'error'});
      return;
    }

    try {
      await addComment(postId, trimmedReply, 'reels', commentId);
      setReplyText('');
      setReplyingTo(null);
      toggleReplies(postId, commentId);
    } catch (error) {
      console.error('Error agregando respuesta:', error);
      setToast({message: 'Error al publicar respuesta', type: 'error'});
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes} Min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handleToggleReplies = (commentId: string) => {
    toggleReplies(postId, commentId);
  };

  if (!isOpen) return null;

  return (
    <div className="comments-modal-overlay">
      <div className="comments-modal">
        <div className="comments-header">
          <h3>Comentarios</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="15" y1="5" x2="5" y2="15"></line>
              <line x1="5" y1="5" x2="15" y2="15"></line>
            </svg>
          </button>
        </div>

        <div className="comment-input">
          <input
            type="text"
            placeholder="Agregar un comentario"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            maxLength={500}
          />
          <div className="char-counter">{newComment.length}/500</div>
          {newComment.trim() && (
            <button className="send-comment-btn" onClick={handleAddComment} disabled={isSubmitting}>
              {isSubmitting ? (
                <div style={{width: '20px', height: '20px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="2" x2="9" y2="11"></line>
                  <polygon points="18,2 12,18 9,11 2,8"></polygon>
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="no-comments">
              <p>No hay comentarios aún</p>
              <p>¡Sé el primero en comentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-main">
                <div className="comment-avatar" onClick={() => onProfileClick?.(comment.userId)} style={{ cursor: 'pointer' }}>
                  {usersData[comment.userId]?.profilePicture ? (
                    <img src={usersData[comment.userId].profilePicture} alt="Avatar" />
                  ) : (
                    <div className="default-avatar">
                      {usersData[comment.userId]?.fullName?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-username">
                      {usersData[comment.userId]?.fullName || 'Usuario'}
                    </span>
                    <span className="comment-time">
                      {formatTimeAgo(comment.timestamp)}
                    </span>
                  </div>
                  <div className="comment-text">{comment.text}</div>
                  <div className="comment-actions">
                    <button 
                      className="reply-btn"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      Responder
                    </button>
                    {comment.replies && comment.replies.length > 0 && (
                      <button 
                        className="view-replies-btn"
                        onClick={() => handleToggleReplies(comment.id)}
                      >
                        Ver {comment.replies.length} respuestas
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {replyingTo === comment.id && (
                <div className="reply-input">
                  <input
                    type="text"
                    placeholder="Escribe una respuesta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                    maxLength={500}
                    autoFocus
                  />
                  <button onClick={() => setReplyingTo(null)}>Cancelar</button>
                </div>
              )}

              {expandedReplies.has(comment.id) && comment.replies && (
                <div className="replies-list">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="reply-item">
                      <div className="comment-avatar" onClick={() => onProfileClick?.(reply.userId)} style={{ cursor: 'pointer' }}>
                        {usersData[reply.userId]?.profilePicture ? (
                          <img src={usersData[reply.userId].profilePicture} alt="Avatar" />
                        ) : (
                          <div className="default-avatar">
                            {usersData[reply.userId]?.fullName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="comment-content">
                        <div className="comment-header">
                          <span className="comment-username">
                            {usersData[reply.userId]?.fullName || 'Usuario'}
                          </span>
                          <span className="comment-time">
                            {formatTimeAgo(reply.timestamp)}
                          </span>
                        </div>
                        <div className="comment-text">{reply.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            ))
          )}
        </div>
        
        {/* Toast de notificaciones */}
        {toast && (
          <div className={`toast toast-${toast.type}`} onClick={() => setToast(null)}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}