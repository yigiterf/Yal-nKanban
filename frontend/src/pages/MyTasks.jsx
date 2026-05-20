import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const priorityConfig = {
  low:    { label: 'Düşük',   bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', order: 0 },
  medium: { label: 'Orta',    bg: '#fefce8', color: '#ca8a04', border: '#fef08a', order: 1 },
  high:   { label: 'Yüksek',  bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', order: 2 },
  urgent: { label: 'Acil',    bg: '#fef2f2', color: '#dc2626', border: '#fecaca', order: 3 },
};

const statusConfig = {
  todo:        { label: 'Yapılacak',    bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', icon: '📋' },
  in_progress: { label: 'Devam Ediyor', bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe', icon: '⚡' },
  done:        { label: 'Tamamlandı',   bg: '#f0fdf4', color: '#22c55e', border: '#bbf7d0', icon: '✅' },
};

const getDueDateStatus = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Geçti',            color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '🔴', urgent: true };
  if (diffDays === 0) return { label: 'Bugün!',          color: '#f97316', bg: '#fff7ed', border: '#fed7aa', icon: '🟠', urgent: true };
  if (diffDays <= 3)  return { label: `${diffDays}g kaldı`, color: '#eab308', bg: '#fefce8', border: '#fef08a', icon: '🟡', urgent: false };
  return { label: `${diffDays}g kaldı`,                  color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', icon: '🟢', urgent: false };
};

const SORT_OPTIONS = [
  { value: 'default',    label: 'Varsayılan Sıra' },
  { value: 'due_date',   label: '📅 Son Tarihe Göre' },
  { value: 'priority',   label: '🚨 Önceliğe Göre' },
  { value: 'points_asc', label: '⚡ Puana Göre (Artan)' },
  { value: 'points_desc',label: '⚡ Puana Göre (Azalan)' },
];

const MyTasks = () => {
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [sortBy, setSortBy]             = useState('default');
  const [selectedIds, setSelectedIds]   = useState([]);
  const [bulkStatus, setBulkStatus]     = useState('in_progress');
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [toast, setToast]               = useState(null);

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

  useEffect(() => { fetchTasks(); }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    const oldTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      showToast('Görev durumu güncellendi.');
    } catch (err) {
      setTasks(oldTasks);
      showToast('Durum güncellenirken hata oluştu.', 'danger');
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    const oldTasks = [...tasks];
    setTasks(prev => prev.map(t => selectedIds.includes(t.id) ? { ...t, status: bulkStatus } : t));
    try {
      await Promise.all(selectedIds.map(id => api.patch(`/tasks/${id}/status`, { status: bulkStatus })));
      showToast(`${selectedIds.length} görev güncellendi.`);
      setSelectedIds([]);
    } catch (err) {
      setTasks(oldTasks);
      showToast('Toplu güncelleme başarısız.', 'danger');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (ids) => {
    const allSelected = ids.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter(id => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
  };

  // Sıralama & filtreleme
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      const matchesStatus   = filterStatus   === 'all' || t.status   === filterStatus;
      const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
      const matchesSearch   =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.project_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesPriority && matchesSearch;
    });

    switch (sortBy) {
      case 'due_date':
        result = result.slice().sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        });
        break;
      case 'priority':
        result = result.slice().sort((a, b) =>
          (priorityConfig[b.priority]?.order ?? 1) - (priorityConfig[a.priority]?.order ?? 1)
        );
        break;
      case 'points_asc':
        result = result.slice().sort((a, b) => (a.estimate_points ?? 0) - (b.estimate_points ?? 0));
        break;
      case 'points_desc':
        result = result.slice().sort((a, b) => (b.estimate_points ?? 0) - (a.estimate_points ?? 0));
        break;
      default:
        break;
    }
    return result;
  }, [tasks, filterStatus, filterPriority, searchQuery, sortBy]);

  // Stat hesaplamaları
  const stats = useMemo(() => ({
    total:       tasks.length,
    done:        tasks.filter(t => t.status === 'done').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    todo:        tasks.filter(t => t.status === 'todo').length,
    urgent:      tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
    totalPoints: tasks.reduce((s, t) => s + (t.estimate_points || 0), 0),
    donePoints:  tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimate_points || 0), 0),
  }), [tasks]);

  const filteredIds = filteredTasks.map(t => t.id);

  if (loading) {
    return (
      <div className="container-fluid px-0 h-100 d-flex flex-column gap-4">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div className="skeleton" style={{ width: '180px', height: '36px' }} />
          <div className="skeleton" style={{ width: '150px', height: '36px' }} />
        </div>
        <div className="d-flex flex-column gap-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="card p-3 border-0 bg-white" style={{ height: '100px' }}>
              <div className="skeleton mb-2" style={{ width: '30%', height: '20px' }} />
              <div className="skeleton"    style={{ width: '70%', height: '14px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div className="alert alert-danger">{error}</div>;

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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--custom-text)', letterSpacing: '-0.5px' }}>
            ✅ Görevlerim
          </h3>
          <p className="text-muted mb-0 small">
            Farklı projelerde size atanmış tüm görevleri tek panelden yönetin.
          </p>
        </div>
        <span className="badge bg-light text-muted border px-3 py-2 mt-2 mt-md-0" style={{ fontSize: '13px' }}>
          {filteredTasks.length} / {tasks.length} görev
        </span>
      </div>

      {/* İstatistik Şeridi */}
      <div className="row g-2 mb-3">
        {[
          { label: 'Yapılacak',    value: stats.todo,        color: '#64748b', bg: '#f1f5f9', icon: '📋' },
          { label: 'Devam Ediyor', value: stats.in_progress, color: '#3b82f6', bg: '#eff6ff', icon: '⚡' },
          { label: 'Tamamlandı',   value: stats.done,        color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
          { label: 'Acil Görev',   value: stats.urgent,      color: '#dc2626', bg: '#fef2f2', icon: '🔴' },
          { label: 'Story Points', value: `${stats.donePoints}/${stats.totalPoints}`, color: '#8b5cf6', bg: '#f5f3ff', icon: '⚡' },
        ].map((s, i) => (
          <div key={i} className="col">
            <div
              className="rounded-3 px-3 py-2 d-flex align-items-center gap-2"
              style={{ backgroundColor: s.bg, border: `1px solid ${s.color}20`, minWidth: '90px' }}
            >
              <span style={{ fontSize: '16px' }}>{s.icon}</span>
              <div>
                <div className="fw-bold" style={{ color: s.color, fontSize: '14px', lineHeight: 1.1 }}>
                  {s.value}
                </div>
                <div className="text-muted" style={{ fontSize: '10px' }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Sort Bar */}
      <div className="card border-0 shadow-sm p-3 mb-3 bg-white" style={{ borderRadius: '12px' }}>
        <div className="row g-2 align-items-center">
          {/* Search */}
          <div className="col-md-3">
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm rounded-3 shadow-none ps-3 pe-5"
                placeholder="Görev veya proje ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: '1px solid #e2e8f0', height: '38px' }}
              />
              <span className="position-absolute" style={{ right: 10, top: 9, color: '#94a3b8', fontSize: '13px' }}>🔍</span>
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-md-2 col-sm-6">
            <select
              className="form-select form-select-sm rounded-3"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ height: '38px' }}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="todo">Yapılacak</option>
              <option value="in_progress">Devam Ediyor</option>
              <option value="done">Tamamlandı</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-md-2 col-sm-6">
            <select
              className="form-select form-select-sm rounded-3"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              style={{ height: '38px' }}
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </div>

          {/* Sort */}
          <div className="col-md-2">
            <select
              className="form-select form-select-sm rounded-3"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ height: '38px' }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Select All / Deselect */}
          <div className="col-md-3 d-flex align-items-center gap-2 justify-content-md-end">
            <button
              className="btn btn-sm btn-light border"
              style={{ borderRadius: '8px', fontSize: '12px', height: '38px', whiteSpace: 'nowrap' }}
              onClick={() => toggleSelectAll(filteredIds)}
            >
              {filteredIds.every(id => selectedIds.includes(id)) && filteredIds.length > 0
                ? '☑️ Seçimi Kaldır'
                : '☐ Tümünü Seç'}
            </button>
          </div>
        </div>
      </div>

      {/* Toplu İşlem Çubuğu */}
      {selectedIds.length > 0 && (
        <div
          className="card border-0 shadow-sm p-2 mb-3 d-flex flex-row align-items-center gap-3"
          style={{ borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <span className="fw-semibold text-primary" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
            {selectedIds.length} görev seçildi
          </span>
          <div className="d-flex align-items-center gap-2 flex-grow-1">
            <select
              className="form-select form-select-sm"
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              style={{ maxWidth: '180px', borderRadius: '8px' }}
            >
              <option value="todo">📋 Yapılacak</option>
              <option value="in_progress">⚡ Devam Ediyor</option>
              <option value="done">✅ Tamamlandı</option>
            </select>
            <button
              className="btn btn-sm btn-primary fw-semibold"
              style={{ borderRadius: '8px' }}
              onClick={handleBulkStatusChange}
              disabled={bulkLoading}
            >
              {bulkLoading ? 'Güncelleniyor...' : '✔ Uygula'}
            </button>
          </div>
          <button
            className="btn btn-sm btn-light border ms-auto"
            style={{ borderRadius: '8px', fontSize: '12px' }}
            onClick={() => setSelectedIds([])}
          >
            İptal
          </button>
        </div>
      )}

      {/* Tasks List */}
      <div className="d-flex flex-column gap-3">
        {filteredTasks.map(task => {
          const pr = priorityConfig[task.priority] || priorityConfig.medium;
          const st = statusConfig[task.status]   || statusConfig.todo;
          const ds = getDueDateStatus(task.due_date);
          const taskTags = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
          const isSelected = selectedIds.includes(task.id);

          return (
            <div
              key={task.id}
              className="card border-0 shadow-sm bg-white task-card-modern"
              style={{
                borderRadius: '14px',
                borderLeft: `5px solid ${task.project_color || 'var(--custom-primary)'}`,
                outline: isSelected ? '2px solid rgba(99,102,241,0.4)' : 'none',
                backgroundColor: isSelected ? 'rgba(99,102,241,0.03)' : 'white',
              }}
            >
              <div className="p-3">
                <div className="row align-items-center g-3">
                  {/* Checkbox */}
                  <div className="col-auto d-flex align-items-center">
                    <input
                      type="checkbox"
                      className="form-check-input mt-0"
                      checked={isSelected}
                      onChange={() => toggleSelect(task.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--custom-primary)' }}
                    />
                  </div>

                  {/* Task Title & Details */}
                  <div className="col-lg-5 col-md-5">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ fontSize: '1rem' }}>{task.project_emoji || '📁'}</span>
                      <Link
                        to={`/board/${task.project_id}`}
                        className="fw-semibold small text-decoration-none"
                        style={{ color: task.project_color || 'var(--custom-primary)' }}
                      >
                        {task.project_name}
                      </Link>
                    </div>
                    <h5
                      className="fw-bold mb-1"
                      style={{
                        color: 'var(--custom-text)',
                        fontSize: '15px',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        opacity: task.status === 'done' ? 0.6 : 1,
                      }}
                    >
                      {task.title}
                    </h5>
                    {task.description && (
                      <p className="text-muted mb-1 small" style={{ lineHeight: '1.4', fontSize: '12px' }}>
                        {task.description.length > 80 ? task.description.slice(0, 80) + '…' : task.description}
                      </p>
                    )}
                    {taskTags.length > 0 && (
                      <div className="d-flex flex-wrap gap-1 mt-1">
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

                  {/* Task Badges */}
                  <div className="col-lg-4 col-md-4 d-flex flex-wrap align-items-center gap-2">
                    <span
                      className="badge rounded-pill fw-medium"
                      style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: '11px', padding: '5px 10px' }}
                    >
                      {st.icon} {st.label}
                    </span>
                    <span
                      className="badge rounded-pill fw-medium"
                      style={{ backgroundColor: pr.bg, color: pr.color, border: `1px solid ${pr.border}`, fontSize: '11px', padding: '5px 10px' }}
                    >
                      🚨 {pr.label}
                    </span>
                    {task.estimate_points != null && (
                      <span className="badge rounded-pill bg-light text-dark border fw-semibold" style={{ fontSize: '11px', padding: '5px 10px' }}>
                        ⚡ {task.estimate_points} SP
                      </span>
                    )}
                    {ds && (
                      <span
                        className="badge rounded-pill"
                        style={{ backgroundColor: ds.bg, color: ds.color, border: `1px solid ${ds.border}`, fontSize: '11px', padding: '5px 10px', whiteSpace: 'nowrap' }}
                      >
                        📅 {ds.label}
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="col-lg-2 col-md-2 d-flex justify-content-md-end gap-1">
                    {task.status !== 'todo' && (
                      <button
                        className="btn btn-sm btn-light border"
                        onClick={() => handleStatusChange(task.id, 'todo')}
                        title="Yapılacak"
                        style={{ borderRadius: '8px', padding: '5px 8px', fontSize: '12px' }}
                      >
                        ⏪
                      </button>
                    )}
                    {task.status !== 'in_progress' && (
                      <button
                        className="btn btn-sm btn-light border"
                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                        title="Başla"
                        style={{ borderRadius: '8px', padding: '5px 8px', fontSize: '12px' }}
                      >
                        ⚙️
                      </button>
                    )}
                    {task.status !== 'done' && (
                      <button
                        className="btn btn-sm btn-light border"
                        onClick={() => handleStatusChange(task.id, 'done')}
                        title="Tamamlandı"
                        style={{ borderRadius: '8px', padding: '5px 8px', fontSize: '12px' }}
                      >
                        ✅
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm" style={{ border: '1px dashed #e2e8f0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>🎉</div>
            <h5 className="fw-semibold mb-2" style={{ color: 'var(--custom-text)' }}>
              {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Eşleşen Görev Bulunamadı'
                : 'Harika! Göreviniz Yok'}
            </h5>
            <p className="text-muted mb-0 small" style={{ maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Farklı filtreler veya arama kriterleri deneyin.'
                : 'Şu anda size atanmış herhangi bir görev bulunmuyor.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
