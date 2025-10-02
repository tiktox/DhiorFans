import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getUserDataById, UserData } from '../lib/userService';
import { addComment, getCommentsWithReplies, Comment } from '../lib/commentService';

interface CommentWithReplies extends Comment {
  replies?: Comment[];
}

interface CommentsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentsModal({ postId, isOpen, onClose }: CommentsModalProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [usersData, setUsersData] = useState<{[key: string]: UserData}>({});

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    try {
      const commentsData = await getCommentsWithReplies(postId);
      setComments(commentsData);

      // Cargar datos de usuarios
      const userIds = new Set<string>();
      commentsData.forEach(comment => {
        userIds.add(comment.userId);
        comment.replies?.forEach(reply => userIds.add(reply.userId));
      });

      const userData: {[key: string]: UserData} = {};
      for (const userId of userIds) {
        try {
          const data = await getUserDataById(userId);
          if (data) {
            userData[userId] = data;
          }
        } catch (error) {
          console.error('Error cargando datos de usuario:', error);
        }
      }
      setUsersData(userData);
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !auth.currentUser) return;

    try {
      await addComment(postId, newComment);
      setNewComment('');
      await loadComments(); // Recargar comentarios
    } catch (error) {
      console.error('Error agregando comentario:', error);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyText.trim() || !auth.currentUser) return;

    try {
      await addComment(postId, replyText, commentId);
      setReplyText('');
      setReplyingTo(null);
      await loadComments(); // Recargar comentarios
    } catch (error) {
      console.error('Error agregando respuesta:', error);
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

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="comments-modal-overlay">
      <div className="comments-modal">
        <div className="comments-header">
          <h3>Comentarios</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
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
          {newComment.trim() && (
            <button className="send-comment-btn" onClick={handleAddComment}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9"></polygon>
              </svg>
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
                <div className="comment-avatar">
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
                  <div className="comment-text">{comment.content}</div>
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
                        onClick={() => toggleReplies(comment.id)}
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
                    autoFocus
                  />
                  <button onClick={() => setReplyingTo(null)}>Cancelar</button>
                </div>
              )}

              {expandedReplies.has(comment.id) && comment.replies && (
                <div className="replies-list">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="reply-item">
                      <div className="comment-avatar">
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
                        <div className="comment-text">{reply.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}