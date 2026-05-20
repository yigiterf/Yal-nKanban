import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CommentSection = ({ taskId }) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/task/${taskId}`);
      setComments(res.data);
    } catch (err) {
      console.error('Yorumlar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) fetchComments();
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/comments/task/${taskId}`, { content: newComment.trim() });
      setNewComment('');
      fetchComments(); // Yenile
    } catch (err) {
      console.error('Yorum eklenirken hata:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Yorum silinirken hata:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
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

      {/* Yorum Ekleme Formu */}
      <form onSubmit={handleSubmit} className="d-flex gap-2 mb-3">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
          style={{
            width: 32, height: 32,
            backgroundColor: 'var(--custom-primary)',
            color: 'white',
            fontSize: '11px',
          }}
        >
          {getInitials(user?.username)}
        </div>
        <div className="flex-grow-1 d-flex gap-2">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Yorum yazın..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ borderRadius: '20px', fontSize: '13px', paddingLeft: '14px' }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm rounded-pill px-3"
            disabled={submitting || !newComment.trim()}
            style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
          >
            {submitting ? '...' : 'Gönder'}
          </button>
        </div>
      </form>

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
        <div className="d-flex flex-column gap-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="d-flex gap-2 p-2 rounded-3"
              style={{
                backgroundColor: '#f8fafc',
                transition: 'background-color 0.15s ease',
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
                </div>
                <p className="mb-0" style={{ fontSize: '13px', color: 'var(--custom-text)', lineHeight: '1.5' }}>
                  {comment.content}
                </p>
              </div>
              {comment.user_id === user?.id && (
                <button
                  className="btn btn-sm p-0 border-0 text-muted flex-shrink-0 align-self-start"
                  style={{ fontSize: '11px', opacity: 0.5 }}
                  onClick={() => handleDelete(comment.id)}
                  title="Sil"
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
