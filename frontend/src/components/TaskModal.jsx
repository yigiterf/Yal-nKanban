import React, { useState, useEffect } from 'react';
import CommentSection from './CommentSection';

const priorityOptions = [
  { value: 'low', label: 'Düşük', color: '#64748b', bg: '#f1f5f9' },
  { value: 'medium', label: 'Orta', color: '#ca8a04', bg: '#fefce8' },
  { value: 'high', label: 'Yüksek', color: '#ea580c', bg: '#fff7ed' },
  { value: 'urgent', label: 'Acil', color: '#dc2626', bg: '#fef2f2' },
];

// Son tarihe göre renk/durum hesapla
const getDueDateStatus = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Geçti', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' };
  if (diffDays === 0) return { label: 'Bugün', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' };
  if (diffDays <= 3) return { label: `${diffDays} gün`, color: '#eab308', bg: '#fefce8', border: '#fef08a' };
  return { label: `${diffDays} gün`, color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' };
};

const TaskModal = ({ show, onClose, onSubmit, editingTask, members = [] }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tags, setTags] = useState('');
  const [estimatePoints, setEstimatePoints] = useState('');
  const [error, setError] = useState(null);

  // Düzenleme modunda mevcut verileri yükle
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setAssignedTo(editingTask.assigned_to || '');
      setPriority(editingTask.priority || 'medium');
      setTags(editingTask.tags || '');
      setEstimatePoints(editingTask.estimate_points != null ? String(editingTask.estimate_points) : '');
      if (editingTask.due_date) {
        const d = new Date(editingTask.due_date);
        const formatted = d.toISOString().split('T')[0];
        setDueDate(formatted);
      } else {
        setDueDate('');
      }
    } else {
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDueDate('');
      setPriority('medium');
      setTags('');
      setEstimatePoints('');
    }
    setError(null);
  }, [editingTask, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Görev başlığı boş bırakılamaz.');
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      priority,
      tags: tags.trim(),
      estimatePoints: estimatePoints ? parseInt(estimatePoints) : null,
    });
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setDueDate('');
    setPriority('medium');
    setTags('');
    setEstimatePoints('');
    setError(null);
  };

  if (!show) return null;

  const dueDateStatus = getDueDateStatus(dueDate);

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop show"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="modal d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: '16px', overflow: 'hidden' }}
          >
            {/* Üst renk şeridi */}
            <div
              style={{
                height: '4px',
                background: 'linear-gradient(90deg, var(--custom-primary), var(--custom-secondary))',
              }}
            />

            <div className="modal-header border-0 pb-0 px-4 pt-4">
              <h5 className="modal-title fw-bold" style={{ color: 'var(--custom-text)' }}>
                {editingTask ? '✏️ Görevi Düzenle' : '➕ Yeni Görev'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Kapat" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body px-4 py-3">
                {error && (
                  <div className="alert alert-danger py-2" style={{ fontSize: '13px', borderRadius: '8px' }}>
                    ⚠️ {error}
                  </div>
                )}

                <div className="row g-3">
                  {/* Sol Kolon */}
                  <div className="col-md-7">
                    <div className="mb-3">
                      <label className="form-label">Başlık</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Görev başlığı..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Açıklama <small className="text-muted">(opsiyonel)</small>
                      </label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Görev hakkında detaylar..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    {/* Etiketler */}
                    <div className="mb-3">
                      <label className="form-label">
                        Etiketler <small className="text-muted">(virgülle ayırın)</small>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="frontend, bug, UI..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                      {tags && (
                        <div className="d-flex flex-wrap gap-1 mt-2">
                          {tags.split(',').map((tag, idx) => tag.trim() && (
                            <span
                              key={idx}
                              className="badge rounded-pill bg-light text-muted border"
                              style={{ fontSize: '11px' }}
                            >
                              🏷️ {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {editingTask && (
                      <div className="mt-4 pt-3 border-top">
                        <CommentSection taskId={editingTask.id} />
                      </div>
                    )}
                  </div>

                  {/* Sağ Kolon */}
                  <div className="col-md-5">
                    {/* Öncelik */}
                    <div className="mb-3">
                      <label className="form-label">Öncelik</label>
                      <div className="d-flex flex-wrap gap-2">
                        {priorityOptions.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            className="btn btn-sm rounded-pill px-3"
                            style={{
                              backgroundColor: priority === p.value ? p.bg : 'transparent',
                              color: priority === p.value ? p.color : '#94a3b8',
                              border: `1px solid ${priority === p.value ? p.color : '#e2e8f0'}`,
                              fontWeight: priority === p.value ? 600 : 400,
                              fontSize: '12px',
                              transition: 'all 0.15s ease',
                            }}
                            onClick={() => setPriority(p.value)}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Son Tarih */}
                    <div className="mb-3">
                      <label className="form-label">
                        Son Tarih <small className="text-muted">(opsiyonel)</small>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                      {dueDate && dueDateStatus && (
                        <div
                          className="mt-1 d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                          style={{
                            backgroundColor: dueDateStatus.bg,
                            color: dueDateStatus.color,
                            border: `1px solid ${dueDateStatus.border}`,
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          📅 {dueDateStatus.label} kaldı
                        </div>
                      )}
                    </div>

                    {/* Story Points */}
                    <div className="mb-3">
                      <label className="form-label">
                        Story Point <small className="text-muted">(opsiyonel)</small>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0–100"
                        value={estimatePoints}
                        onChange={(e) => setEstimatePoints(e.target.value)}
                        min="0"
                        max="100"
                      />
                    </div>

                    {/* Atama Dropdown */}
                    <div className="mb-2">
                      <label className="form-label">
                        Atanan Kişi <small className="text-muted">(opsiyonel)</small>
                      </label>
                      <select
                        className="form-select"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                      >
                        <option value="">Atanmamış</option>
                        {members.map((m) => (
                          <option key={m.user_id} value={m.user_id}>
                            {m.username} ({m.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 px-4 pb-4 pt-0">
                <button type="button" className="btn btn-light fw-medium" onClick={onClose}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary fw-medium">
                  {editingTask ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskModal;
