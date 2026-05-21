import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CommentSection = ({ taskId }) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/task/${taskId}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Yorumlar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) fetchComments();
  }, [taskId]);

  const handleSubmit = async () => {
    const content = newComment.trim();
    if (!content || submitting) return;

    setSubmitting(true);
    setError(null);

    // Optimistic update
    const tempId = Date.now();
    const optimistic = {
      id: tempId,
      content,
      user_id: user?.id,
      username: user?.username,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setComments(prev => [...prev, optimistic]);
    setNewComment('');

    try {
      const res = await api.post(`/comments/task/${taskId}`, { content });
      const realId = res.data?.commentId;
      setComments(prev =>
        prev.map(c => c.id === tempId ? { ...c, id: realId ?? tempId, _optimistic: false } : c)
      );
    } catch (err) {
      setComments(prev => prev.filter(c => c.id !== tempId));
      setNewComment(content);
      const msg = err.response?.data?.message || 'Yorum eklenirken hata oluştu.';
      setError(msg);
      console.error('Yorum eklenirken hata:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  const handleDelete = async (commentId) => {
    const backup = [...comments];
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
      await api.delete(`/comments/${commentId}`);
    } catch (err) {
      setComments(backup);
      console.error('Yorum silinirken hata:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now  = new Date();
    const diffMins  = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays  = Math.floor(diffHours / 24);
    if (diffMins < 1)  return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays < 7)  return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className="mt-3">
      <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ fontSize: '14px', color: 'var(--custom-text)' }}>
        💬 Yorumlar
        {comments.length > 0 && (
          <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: '11px' }}>
            {comments.length}
          </span>
        )}
      </h6>

      {/* Hata mesajı */}
      {error && (
        <div className="alert alert-danger py-2 mb-2" style={{ fontSize: '12px', borderRadius: '8px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Yorum Giriş Alanı — <form> YOK, nested form hatası önlenir */}
      <div className="d-flex gap-2 mb-3">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
          style={{ width: 32, height: 32, backgroundColor: 'var(--custom-primary)', color: 'white', fontSize: '11px' }}
        >
          {getInitials(user?.username)}
        </div>
        <div className="flex-grow-1 d-flex gap-2">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Yorum yazın ve Enter'a basın..."
            value={newComment}
            onChange={e => { setNewComment(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            style={{ borderRadius: '20px', fontSize: '13px', paddingLeft: '14px' }}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-pill px-3"
            disabled={submitting || !newComment.trim()}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }}
            style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
          >
            {submitting ? '...' : 'Gönder'}
          </button>
        </div>
      </div>

      {/* Yorumlar Listesi */}
      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-muted" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted text-center small py-2" style={{ fontSize: '12px' }}>
          Henüz yorum yok. İlk yorumu siz yapın!
        </p>
      ) : (
        <div className="d-flex flex-column gap-2" style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {comments.map(comment => (
            <div
              key={comment.id}
              className="d-flex gap-2 p-2 rounded-3"
              style={{
                backgroundColor: comment._optimistic ? 'rgba(99,102,241,0.04)' : '#f8fafc',
                opacity: comment._optimistic ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                style={{
                  width: 28, height: 28,
                  backgroundColor: comment.user_id === user?.id ? 'var(--custom-primary)' : '#94a3b8',
                  color: 'white',
                  fontSize: '10px',
                }}
              >
                {getInitials(comment.username)}
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="fw-semibold" style={{ fontSize: '12px', color: 'var(--custom-text)' }}>
                    {comment.username}
                  </span>
                  <span className="text-muted" style={{ fontSize: '10px' }}>
                    {formatDate(comment.created_at)}
                  </span>
                  {comment._optimistic && (
                    <span className="text-muted" style={{ fontSize: '10px' }}>· gönderiliyor...</span>
                  )}
                </div>
                <p className="mb-0" style={{ fontSize: '13px', color: 'var(--custom-text)', lineHeight: '1.5' }}>
                  {comment.content}
                </p>
              </div>
              {comment.user_id === user?.id && !comment._optimistic && (
                <button
                  type="button"
                  className="btn btn-sm p-0 border-0 text-muted flex-shrink-0 align-self-start"
                  style={{ fontSize: '11px', opacity: 0.4, transition: 'opacity 0.15s' }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(comment.id); }}
                  title="Sil"
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
