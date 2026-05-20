import React, { useState, useEffect } from 'react';

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
  const [error, setError] = useState(null);

  // Düzenleme modunda mevcut verileri yükle
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setAssignedTo(editingTask.assigned_to || '');
      // due_date formatını YYYY-MM-DD olarak ayarla
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
    });
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setDueDate('');
    setError(null);
  };

  if (!show) return null;

  // Bugünün tarihi (min için)
  const today = new Date().toISOString().split('T')[0];
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
        <div className="modal-dialog modal-dialog-centered">
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
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Kapat"
              />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body px-4 py-3">
                {error && (
                  <div className="alert alert-danger py-2" style={{ fontSize: '13px', borderRadius: '8px' }}>
                    ⚠️ {error}
                  </div>
                )}

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
                    style={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  {/* Tarih durumu göstergesi */}
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

                {/* Atama Dropdown */}
                <div className="mb-2">
                  <label className="form-label">
                    Atanan Kişi <small className="text-muted">(opsiyonel)</small>
                  </label>
                  <select
                    className="form-select"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      padding: '0.75rem 1rem',
                    }}
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
