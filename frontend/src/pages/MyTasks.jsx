import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const priorityConfig = {
  low:    { label: 'Düşük', bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  medium: { label: 'Orta', bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
  high:   { label: 'Yüksek', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  urgent: { label: 'Acil', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const statusConfig = {
  todo:        { label: 'Yapılacak',     bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', icon: '📋' },
  in_progress: { label: 'Devam Ediyor',  bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe', icon: '⚡' },
  done:        { label: 'Tamamlandı',    bg: '#f0fdf4', color: '#22c55e', border: '#bbf7d0', icon: '✅' },
};

// Son tarihe göre renk/durum hesapla
const getDueDateStatus = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Geçti', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '🔴' };
  if (diffDays === 0) return { label: 'Bugün', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', icon: '🟠' };
  if (diffDays <= 3) return { label: `${diffDays} gün kaldı`, color: '#eab308', bg: '#fefce8', border: '#fef08a', icon: '🟡' };
  return { label: `${diffDays} gün kaldı`, color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', icon: '🟢' };
};

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/assigned');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setError('Görevler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    const oldTasks = [...tasks];
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      showToast('Görev durumu güncellendi.');
    } catch (err) {
      setTasks(oldTasks);
      showToast('Durum güncellenirken hata oluştu.', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-0 h-100 d-flex flex-column gap-4">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div className="skeleton" style={{ width: '180px', height: '36px' }}></div>
          <div className="skeleton" style={{ width: '150px', height: '36px' }}></div>
        </div>
        <div className="d-flex flex-column gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-3 border-0 bg-white" style={{ height: '100px' }}>
              <div className="skeleton mb-2" style={{ width: '30%', height: '20px' }}></div>
              <div className="skeleton" style={{ width: '70%', height: '14px' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Filtreleme
  const filteredTasks = tasks.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          t.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="container-fluid px-0 h-100 d-flex flex-column">
      {/* Toast */}
      {toast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div
            className={`alert alert-${toast.type} alert-dismissible shadow-lg border-0 fade show`}
            role="alert"
            style={{ borderRadius: '12px', fontSize: '14px', minWidth: '250px' }}
          >
            {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--custom-text)', letterSpacing: '-0.5px' }}>
            ✅ Görevlerim
          </h3>
          <p className="text-muted mb-0 small">
            Farklı projelerde size atanmış olan tüm görevleri tek panelden yönetin.
          </p>
        </div>
        <span className="badge bg-light text-muted border px-3 py-2 mt-2 mt-md-0" style={{ fontSize: '13px' }}>
          Toplam {filteredTasks.length} Görev listeleniyor
        </span>
      </div>

      {/* Filters Bar */}
      <div className="card border-0 shadow-sm p-3 mb-4 bg-white" style={{ borderRadius: '12px' }}>
        <div className="row g-3">
          {/* Search */}
          <div className="col-md-4">
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm rounded-3 shadow-none ps-3 pe-5"
                placeholder="Görev veya proje ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: '1px solid #e2e8f0', height: '40px' }}
              />
              <span className="position-absolute" style={{ right: 12, top: 9, color: '#94a3b8' }}>🔍</span>
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-md-4 col-sm-6">
            <select
              className="form-select form-select-sm rounded-3"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ height: '40px' }}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="todo">Yapılacak</option>
              <option value="in_progress">Devam Ediyor</option>
              <option value="done">Tamamlandı</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-md-4 col-sm-6">
            <select
              className="form-select form-select-sm rounded-3"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ height: '40px' }}
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="low">Düşük Öncelik</option>
              <option value="medium">Orta Öncelik</option>
              <option value="high">Yüksek Öncelik</option>
              <option value="urgent">Acil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="d-flex flex-column gap-3">
        {filteredTasks.map((task) => {
          const pr = priorityConfig[task.priority] || priorityConfig.medium;
          const st = statusConfig[task.status] || statusConfig.todo;
          const ds = getDueDateStatus(task.due_date);

          // Etiketleri parse et
          const taskTags = task.tags ? task.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

          return (
            <div
              key={task.id}
              className="card border-0 shadow-sm p-3 bg-white"
              style={{
                borderRadius: '16px',
                borderLeft: `5px solid ${task.project_color || 'var(--custom-primary)'}`,
                transition: 'transform 0.2s ease',
              }}
            >
              <div className="row align-items-center g-3">
                {/* Task Title & Details */}
                <div className="col-lg-6 col-md-5">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span style={{ fontSize: '1.1rem' }}>{task.project_emoji || '📁'}</span>
                    <Link
                      to={`/board/${task.project_id}`}
                      className="fw-semibold small text-decoration-none"
                      style={{ color: task.project_color || 'var(--custom-primary)' }}
                    >
                      {task.project_name}
                    </Link>
                  </div>
                  <h5 className="fw-bold mb-1" style={{ color: 'var(--custom-text)', fontSize: '16px' }}>
                    {task.title}
                  </h5>
                  {task.description ? (
                    <p className="text-muted mb-2 small" style={{ lineHeight: '1.4' }}>
                      {task.description}
                    </p>
                  ) : (
                    <p className="text-muted mb-2 small italic">Açıklama girilmemiş.</p>
                  )}

                  {/* Render Tags */}
                  {taskTags.length > 0 && (
                    <div className="d-flex flex-wrap gap-1">
                      {taskTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="badge rounded-pill bg-light text-muted border px-2 py-1"
                          style={{ fontSize: '10px' }}
                        >
                          🏷️ {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Task Badges & Deadlines */}
                <div className="col-lg-4 col-md-4 d-flex flex-wrap align-items-center gap-2">
                  {/* Status Badge */}
                  <span
                    className="badge rounded-pill fw-medium"
                    style={{
                      backgroundColor: st.bg,
                      color: st.color,
                      border: `1px solid ${st.border}`,
                      fontSize: '11px',
                      padding: '6px 12px',
                    }}
                  >
                    {st.icon} {st.label}
                  </span>

                  {/* Priority Badge */}
                  <span
                    className="badge rounded-pill fw-medium"
                    style={{
                      backgroundColor: pr.bg,
                      color: pr.color,
                      border: `1px solid ${pr.border}`,
                      fontSize: '11px',
                      padding: '6px 12px',
                    }}
                  >
                    🚨 {pr.label}
                  </span>

                  {/* Story Points */}
                  {task.estimate_points !== null && (
                    <span
                      className="badge rounded-pill bg-light text-dark border fw-semibold"
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                    >
                      ⚡ {task.estimate_points} Puan
                    </span>
                  )}

                  {/* Due Date */}
                  {ds && (
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: ds.bg,
                        color: ds.color,
                        border: `1px solid ${ds.border}`,
                        fontSize: '11px',
                        padding: '6px 12px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📅 {ds.label}
                    </span>
                  )}
                </div>

                {/* Task Quick Actions */}
                <div className="col-lg-2 col-md-3 d-flex justify-content-md-end gap-1">
                  {task.status !== 'todo' && (
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => handleStatusChange(task.id, 'todo')}
                      title="Yapılacak sütununa taşı"
                      style={{ borderRadius: '8px', padding: '6px 10px' }}
                    >
                      ⏪ Yap
                    </button>
                  )}
                  {task.status !== 'in_progress' && (
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => handleStatusChange(task.id, 'in_progress')}
                      title="Devam Ediyor sütununa taşı"
                      style={{ borderRadius: '8px', padding: '6px 10px' }}
                    >
                      ⚙️ Başla
                    </button>
                  )}
                  {task.status !== 'done' && (
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => handleStatusChange(task.id, 'done')}
                      title="Tamamlandı sütununa taşı"
                      style={{ borderRadius: '8px', padding: '6px 10px' }}
                    >
                      ✅ Bitir
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-dashed border-2">
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>
              🎉
            </div>
            <h5 className="fw-semibold mb-2" style={{ color: 'var(--custom-text)' }}>
              Harika! Hiç Göreviniz Yok
            </h5>
            <p className="text-muted mb-0 small" style={{ maxWidth: '400px', margin: '0 auto' }}>
              Şu anda size atanmış veya arama kriterlerinizle eşleşen herhangi bir görev bulunmuyor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
