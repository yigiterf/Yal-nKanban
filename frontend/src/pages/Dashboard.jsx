import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

// Son tarihe göre renk/durum hesapla
const getDueDateStatus = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Süresi Geçti', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '🔴', urgent: true };
  if (diffDays === 0) return { label: 'Bugün!', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', icon: '🟠', urgent: true };
  if (diffDays <= 3) return { label: `${diffDays} gün kaldı`, color: '#eab308', bg: '#fefce8', border: '#fef08a', icon: '🟡', urgent: false };
  return { label: `${diffDays} gün kaldı`, color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', icon: '🟢', urgent: false };
};

const PROJECT_COLORS = ['#6366F1', '#10B981', '#EC4899', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];
const PROJECT_EMOJIS = ['📁', '🚀', '💻', '🎨', '📚', '🎯', '🛠️', '📊', '⚡', '🌟', '🧩', '📈'];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI States
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Yeni proje oluşturma state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  const [newProjectEmoji, setNewProjectEmoji] = useState(PROJECT_EMOJIS[0]);
  const [createError, setCreateError] = useState(null);

  // Proje düzenleme state
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [editProjectColor, setEditProjectColor] = useState(PROJECT_COLORS[0]);
  const [editProjectEmoji, setEditProjectEmoji] = useState(PROJECT_EMOJIS[0]);
  const [editError, setEditError] = useState(null);

  // Silme onay dialog state
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);

  // Hızlı Görev Oluşturma ve Dashboard İstatistikleri State
  const [stats, setStats] = useState(null);
  const [quickProjectId, setQuickProjectId] = useState('');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('medium');
  const [quickPoints, setQuickPoints] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // API'den projeleri ve dashboard istatistiklerini çek
  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, statsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/dashboard/stats'),
      ]);
      setProjects(projectsRes.data);
      setStats(statsRes.data);
      setUpcomingTasks(statsRes.data.criticalTasks || []);
      if (projectsRes.data.length > 0) {
        setQuickProjectId(projectsRes.data[0].id.toString());
      }
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Yeni proje oluştur
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (!newProjectName.trim()) {
      setCreateError('Proje adı boş bırakılamaz.');
      return;
    }

    if (newProjectName.trim().length < 2) {
      setCreateError('Proje adı en az 2 karakter olmalıdır.');
      return;
    }

    try {
      const res = await api.post('/projects', {
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        color: newProjectColor,
        emoji: newProjectEmoji,
      });

      // Projeyi listeye ekle (optimistic)
      const newProject = {
        id: res.data.projectId,
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        color: newProjectColor,
        emoji: newProjectEmoji,
        created_at: new Date().toISOString(),
        role: 'owner',
        task_count: 0,
      };
      setProjects((prev) => [newProject, ...prev]);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectColor(PROJECT_COLORS[0]);
      setNewProjectEmoji(PROJECT_EMOJIS[0]);
      setShowCreateForm(false);
      showToast('Proje oluşturuldu!');
      
      // Sidebar'ı güncelle
      window.dispatchEvent(new Event('projects-changed'));
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Proje oluşturulamadı.');
    }
  };

  // Proje düzenleme başlat
  const handleStartEdit = (project, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setEditProjectName(project.name);
    setEditProjectDesc(project.description || '');
    setEditProjectColor(project.color || PROJECT_COLORS[0]);
    setEditProjectEmoji(project.emoji || PROJECT_EMOJIS[0]);
    setEditError(null);
  };

  // Proje düzenleme kaydet
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError(null);

    if (!editProjectName.trim()) {
      setEditError('Proje adı boş bırakılamaz.');
      return;
    }

    try {
      await api.patch(`/projects/${editingProject.id}`, {
        name: editProjectName.trim(),
        description: editProjectDesc.trim(),
        color: editProjectColor,
        emoji: editProjectEmoji,
      });

      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                name: editProjectName.trim(),
                description: editProjectDesc.trim(),
                color: editProjectColor,
                emoji: editProjectEmoji,
              }
            : p
        )
      );
      setEditingProject(null);
      showToast('Proje güncellendi!');
      
      // Sidebar'ı güncelle
      window.dispatchEvent(new Event('projects-changed'));
    } catch (err) {
      setEditError(err.response?.data?.message || 'Proje güncellenemedi.');
    }
  };

  // Proje silme (onay sonrası)
  const handleDeleteProject = async (projectId) => {
    const oldProjects = [...projects];
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setConfirmDelete(null);

    try {
      await api.delete(`/projects/${projectId}`);
      showToast('Proje silindi.');
      
      // Sidebar'ı güncelle
      window.dispatchEvent(new Event('projects-changed'));
    } catch (err) {
      setProjects(oldProjects);
      showToast(err.response?.data?.message || 'Proje silinemedi.', 'danger');
    }
  };

  // Hızlı Görev Oluştur
  const handleQuickCreateTask = async (e) => {
    e.preventDefault();
    if (!quickProjectId) {
      showToast('Lütfen önce bir proje seçin veya oluşturun.', 'danger');
      return;
    }
    if (!quickTaskTitle.trim()) {
      showToast('Görev başlığı boş bırakılamaz.', 'danger');
      return;
    }

    try {
      await api.post(`/projects/${quickProjectId}/tasks`, {
        title: quickTaskTitle.trim(),
        priority: quickPriority,
        estimatePoints: quickPoints ? parseInt(quickPoints) : null,
        dueDate: quickDueDate || null,
        description: '',
        tags: '',
        assignedTo: null,
      });

      setQuickTaskTitle('');
      setQuickPoints('');
      setQuickDueDate('');
      showToast('Görev başarıyla oluşturuldu!');
      
      // Dashboard verilerini yenile
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Görev oluşturulamadı.', 'danger');
    }
  };

  // Renk paleti (fallback için)
  const colors = PROJECT_COLORS;

  if (loading) {
    return (
      <div className="container-fluid px-0 h-100 d-flex flex-column gap-4">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div className="skeleton" style={{ width: '150px', height: '32px' }}></div>
          <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: '50px' }}></div>
        </div>
        <div className="d-flex flex-wrap gap-4 mt-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card border-0 shadow-sm overflow-hidden" style={{ width: '160px', height: '240px', borderRadius: '12px' }}>
              <div className="skeleton" style={{ height: '70%', borderRadius: '0' }}></div>
              <div className="p-3 d-flex flex-column gap-2 bg-white flex-grow-1">
                <div className="skeleton" style={{ width: '100%', height: '16px' }}></div>
                <div className="skeleton" style={{ width: '60%', height: '12px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-fluid px-0 h-100 d-flex flex-column">

      {/* Toast Bildirimi */}
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

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        show={!!confirmDelete}
        title="Projeyi Sil"
        message="Bu projeyi ve tüm görevlerini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        onConfirm={() => handleDeleteProject(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Proje Düzenleme Modalı */}
      {editingProject && (
        <>
          <div
            className="modal-backdrop show"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setEditingProject(null)}
          />
          <div className="modal d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--custom-primary), var(--custom-secondary))' }} />
                <div className="modal-header border-0 pb-0 px-4 pt-4">
                  <h5 className="modal-title fw-bold" style={{ color: 'var(--custom-text)' }}>✏️ Projeyi Düzenle</h5>
                  <button type="button" className="btn-close" onClick={() => setEditingProject(null)} />
                </div>
                <form onSubmit={handleSaveEdit}>
                  <div className="modal-body px-4 py-3">
                    {editError && (
                      <div className="alert alert-danger py-2" style={{ fontSize: '13px', borderRadius: '8px' }}>
                        ⚠️ {editError}
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label">Proje Adı</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editProjectName}
                        onChange={(e) => setEditProjectName(e.target.value)}
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
                        value={editProjectDesc}
                        onChange={(e) => setEditProjectDesc(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label d-block">Proje Rengi</label>
                      <div className="d-flex flex-wrap gap-2">
                        {PROJECT_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="rounded-circle border-0"
                            style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: c,
                              transform: editProjectColor === c ? 'scale(1.2)' : 'none',
                              border: editProjectColor === c ? '2px solid white' : 'none',
                              boxShadow: editProjectColor === c ? `0 0 0 2px ${c}` : 'none',
                              transition: 'transform 0.15s ease',
                            }}
                            onClick={() => setEditProjectColor(c)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label d-block">Proje Emojisi</label>
                      <div className="d-flex flex-wrap gap-2 p-2 border rounded bg-light" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                        {PROJECT_EMOJIS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            className="btn btn-sm btn-light border"
                            style={{
                              fontSize: '1.2rem',
                              padding: '6px 12px',
                              backgroundColor: editProjectEmoji === em ? 'rgba(99, 102, 241, 0.15)' : '',
                              borderColor: editProjectEmoji === em ? 'var(--custom-primary)' : 'rgba(0,0,0,0.1)',
                            }}
                            onClick={() => setEditProjectEmoji(em)}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-0 px-4 pb-4 pt-0">
                    <button type="button" className="btn btn-light fw-medium" onClick={() => setEditingProject(null)}>
                      İptal
                    </button>
                    <button type="submit" className="btn btn-primary fw-medium">
                      Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── DİNAMİK KARŞILAMA VE ÖZET ─── */}
      <div className="card border-0 shadow-sm p-4 mb-4 mt-2" style={{
        background: 'linear-gradient(135deg, var(--custom-primary) 0%, var(--custom-secondary) 100%)',
        color: 'white',
        borderRadius: '16px'
      }}>
        <div className="row align-items-center">
          <div className="col-md-8">
            <h3 className="fw-bold mb-1" style={{ color: 'white' }}>Hoş geldin, {user?.username || 'Kullanıcı'}! 🌟</h3>
            <p className="mb-0 opacity-75 small">
              Projelerindeki işleri takip etmek ve takımınla işbirliği yapmak için harika bir gün.
            </p>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <div className="bg-white bg-opacity-20 p-3 rounded-3 d-inline-block text-start" style={{ backdropFilter: 'blur(10px)', minWidth: '200px' }}>
              <span className="small d-block opacity-75">Genel Durum</span>
              <strong className="fs-4 d-block text-white" style={{ lineHeight: '1.2' }}>
                {projects.length > 0 ? `${projects.length} Aktif Proje` : 'Yeni Başlangıç'}
              </strong>
              <small className="opacity-75">
                {projects.reduce((sum, p) => sum + (p.task_count || 0), 0)} toplam görev
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* ─── İSTATİSTİKLER BÖLÜMÜ ─── */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--custom-primary)', fontSize: '1.5rem' }}>
                📁
              </div>
              <div>
                <h6 className="text-muted small mb-1 fw-medium">Aktif Projelerim</h6>
                <h4 className="fw-bold mb-0" style={{ color: 'var(--custom-text)' }}>{projects.length}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '1.5rem' }}>
                📋
              </div>
              <div>
                <h6 className="text-muted small mb-1 fw-medium">Bana Atanan Görevler</h6>
                <h4 className="fw-bold mb-0" style={{ color: 'var(--custom-text)' }}>
                  {stats ? (stats.taskStats.todo + stats.taskStats.in_progress + stats.taskStats.done) : 0}
                  <span className="text-muted fw-normal" style={{ fontSize: '13px' }}>
                    &nbsp;({stats?.taskStats.done || 0} bitti)
                  </span>
                </h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '1.5rem' }}>
                ⚡
              </div>
              <div>
                <h6 className="text-muted small mb-1 fw-medium">Story Points Performansı</h6>
                <h4 className="fw-bold mb-0" style={{ color: 'var(--custom-text)' }}>
                  {stats?.points.completed || 0} / {stats?.points.total || 0} SP
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DİNAMİK GRAFİK VE HIZLI GÖREV BÖLÜMÜ ─── */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: '16px', minHeight: '380px' }}>
            <h5 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--custom-text)', fontSize: '16px' }}>
              📊 Haftalık Performans Grafiği
            </h5>
            <p className="text-muted small mb-4">Son 7 günde oluşturulan ve sizin tarafınızdan tamamlanan görevler.</p>
            
            <div className="d-flex align-items-end justify-content-between px-2 mt-4" style={{ height: '180px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              {stats?.weeklyActivity.map((day, idx) => {
                const maxCount = Math.max(...stats.weeklyActivity.map(w => Math.max(w.created, w.completed, 1)));
                const createdHeight = (day.created / maxCount) * 100;
                const completedHeight = (day.completed / maxCount) * 100;
                return (
                  <div key={idx} className="d-flex flex-row gap-1 align-items-end h-100 chart-bar-container" style={{ width: '12%' }}>
                    {/* Tooltip */}
                    <div className="chart-tooltip">
                      🆕 {day.created} Yeni | ✅ {day.completed} Biten
                    </div>
                    {/* Created Bar */}
                    <div 
                      className="chart-bar" 
                      style={{ 
                        height: `${Math.max(createdHeight, 4)}%`, 
                        backgroundColor: 'var(--custom-primary)', 
                        opacity: day.created === 0 ? 0.15 : 1 
                      }} 
                    />
                    {/* Completed Bar */}
                    <div 
                      className="chart-bar" 
                      style={{ 
                        height: `${Math.max(completedHeight, 4)}%`, 
                        backgroundColor: '#22c55e', 
                        opacity: day.completed === 0 ? 0.15 : 1 
                      }} 
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Gün İsimleri */}
            <div className="d-flex justify-content-between px-2 mt-2">
              {stats?.weeklyActivity.map((day, idx) => (
                <div key={idx} className="text-center text-muted fw-semibold" style={{ width: '12%', fontSize: '11px' }}>
                  {day.dayName}
                </div>
              ))}
            </div>
            
            {/* Göstergeler */}
            <div className="d-flex gap-3 justify-content-center mt-3" style={{ fontSize: '11px' }}>
              <div className="d-flex align-items-center gap-1">
                <span className="rounded-circle d-inline-block" style={{ width: '8px', height: '8px', backgroundColor: 'var(--custom-primary)' }} />
                <span className="text-muted">Dahil Olduğum Projelerde Oluşturulan</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <span className="rounded-circle d-inline-block" style={{ width: '8px', height: '8px', backgroundColor: '#22c55e' }} />
                <span className="text-muted">Benim Tamamladıklarım</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: '16px', minHeight: '380px' }}>
            <h5 className="fw-bold mb-1" style={{ color: 'var(--custom-text)', fontSize: '16px' }}>
              ⚡ Hızlı Görev Oluşturucu
            </h5>
            <p className="text-muted small mb-3">İlgili projeye gitmeden direkt buradan yeni görev atayın.</p>
            
            <form onSubmit={handleQuickCreateTask}>
              <div className="mb-2">
                <label className="form-label small mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Proje</label>
                <select 
                  className="form-select form-select-sm" 
                  value={quickProjectId} 
                  onChange={(e) => setQuickProjectId(e.target.value)}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                  ))}
                  {projects.length === 0 && <option value="">Önce Proje Oluşturun</option>}
                </select>
              </div>
              
              <div className="mb-2">
                <label className="form-label small mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Görev Başlığı</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Yapılacak iş..." 
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                />
              </div>
              
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label small mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Öncelik</label>
                  <select 
                    className="form-select form-select-sm" 
                    value={quickPriority} 
                    onChange={(e) => setQuickPriority(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  >
                    <option value="low">⬇️ Düşük</option>
                    <option value="medium">➡️ Orta</option>
                    <option value="high">⬆️ Yüksek</option>
                    <option value="urgent">🔴 Acil</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Tahmin (SP)</label>
                  <input 
                    type="number" 
                    className="form-control form-control-sm" 
                    placeholder="Örn: 5" 
                    value={quickPoints}
                    onChange={(e) => setQuickPoints(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label small mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Son Tarih</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm" 
                  value={quickDueDate}
                  onChange={(e) => setQuickDueDate(e.target.value)}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                />
              </div>
              
              <button type="submit" className="btn btn-primary btn-sm w-100 fw-semibold py-2">
                Görev Ekle
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── YAKLAŞAN GÖREVLER BÖLÜMÜ ─── */}
      {upcomingTasks.length > 0 && (
        <div className="mb-5">
          <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <h3
              className="fw-normal mb-0 d-flex align-items-center gap-2"
              style={{ color: 'var(--custom-text)', letterSpacing: '-0.5px' }}
            >
              ⏰ Yaklaşan Görevlerim
            </h3>
            <span
              className="badge rounded-pill"
              style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontSize: '12px' }}
            >
              {upcomingTasks.length}
            </span>
          </div>

          <div className="row g-3">
            {upcomingTasks.map((task) => {
              const ds = getDueDateStatus(task.due_date);
              return (
                <div key={task.id} className="col-md-6 col-lg-4">
                  <Link
                    to={`/board/${task.project_id}`}
                    className="text-decoration-none"
                  >
                    <div
                      className="card border-0 shadow-sm p-3"
                      style={{
                        borderRadius: '12px',
                        borderLeft: `4px solid ${ds?.color || '#94a3b8'}`,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="fw-semibold mb-0" style={{ color: 'var(--custom-text)', fontSize: '14px' }}>
                          {task.title}
                        </h6>
                        {ds && (
                          <span
                            className="badge rounded-pill ms-2 flex-shrink-0"
                            style={{
                              backgroundColor: ds.bg,
                              color: ds.color,
                              border: `1px solid ${ds.border}`,
                              fontSize: '11px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            📅 {ds.label}
                          </span>
                        )}
                      </div>
                      <small className="text-muted d-flex align-items-center gap-1 mt-1">
                        <span>📁</span>
                        <span>{task.project_name}</span>
                      </small>
                      {task.description && (
                        <p className="text-muted mb-0 mt-1" style={{ fontSize: '12px' }}>
                          {task.description.length > 60 ? task.description.substring(0, 60) + '...' : task.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 1. Projeler Bölümü ─── */}
      <div className="mb-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-2 border-bottom">
          <h3
            className="fw-normal mb-3 mb-md-0 d-flex align-items-center gap-2"
            style={{ color: 'var(--custom-text)', letterSpacing: '-0.5px' }}
          >
            Projeler
          </h3>

          <div className="d-flex flex-wrap align-items-center gap-3">
            {/* Search Bar */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm rounded-pill px-3 shadow-none"
                placeholder="Proje ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '220px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
              />
              <span className="position-absolute" style={{ right: 12, top: 5, color: '#94a3b8', fontSize: '14px' }}>
                🔍
              </span>
            </div>

            {/* View Toggles */}
            <div
              className="btn-group shadow-sm bg-white rounded-pill p-1"
              role="group"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-medium border-0 ${
                  viewMode === 'grid' ? 'text-white' : 'btn-light text-muted'
                }`}
                onClick={() => setViewMode('grid')}
                style={{ background: viewMode === 'grid' ? 'var(--custom-primary)' : 'transparent' }}
              >
                Grid
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-medium border-0 ${
                  viewMode === 'list' ? 'text-white' : 'btn-light text-muted'
                }`}
                onClick={() => setViewMode('list')}
                style={{ background: viewMode === 'list' ? 'var(--custom-primary)' : 'transparent' }}
              >
                Liste
              </button>
            </div>

            {/* Oluştur Butonu */}
            <button
              className="btn btn-primary fw-medium shadow-sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              ➕ Oluştur
            </button>
          </div>
        </div>

        {/* Yeni Proje Formu (inline) */}
        {showCreateForm && (
          <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
            <form onSubmit={handleCreateProject}>
              <h6 className="fw-bold mb-3" style={{ color: 'var(--custom-text)' }}>
                Yeni Proje Oluştur
              </h6>
              {createError && (
                <div className="alert alert-danger py-2" style={{ fontSize: '13px' }}>
                  {createError}
                </div>
              )}
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label small">Proje Adı</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Proje adı"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Açıklama (opsiyonel)</label>
                    <textarea
                      className="form-control form-control-sm"
                      placeholder="Açıklama..."
                      rows="2"
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label small d-block">Proje Rengi</label>
                    <div className="d-flex flex-wrap gap-2">
                      {PROJECT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="rounded-circle border-0"
                          style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: c,
                            transform: newProjectColor === c ? 'scale(1.2)' : 'none',
                            border: newProjectColor === c ? '2px solid white' : 'none',
                            boxShadow: newProjectColor === c ? `0 0 0 2px ${c}` : 'none',
                            transition: 'transform 0.15s ease',
                          }}
                          onClick={() => setNewProjectColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small d-block">Proje Emojisi</label>
                    <div className="d-flex flex-wrap gap-2 p-1 border rounded bg-light" style={{ maxHeight: '70px', overflowY: 'auto' }}>
                      {PROJECT_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          className="btn btn-sm btn-light border p-1 px-2"
                          style={{
                            fontSize: '1rem',
                            backgroundColor: newProjectEmoji === em ? 'rgba(99, 102, 241, 0.15)' : '',
                            borderColor: newProjectEmoji === em ? 'var(--custom-primary)' : 'rgba(0,0,0,0.1)',
                          }}
                          onClick={() => setNewProjectEmoji(em)}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-12 d-flex justify-content-end gap-2 border-top pt-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Vazgeç
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Proje Oluştur
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Projects Render Area */}
        <div className="mt-4">
          {viewMode === 'grid' ? (
            <div className="d-flex flex-wrap gap-4">
              {filteredProjects.map((project, index) => {
                const percent = project.task_count > 0 
                  ? Math.round(((project.completed_task_count || 0) / project.task_count) * 100) 
                  : 0;
                return (
                  <div key={project.id} className="position-relative">
                    <Link to={`/board/${project.id}`} className="text-decoration-none">
                      <div
                        className="card border-0 shadow-sm overflow-hidden task-card-modern"
                        style={{
                          width: '180px',
                          height: '260px',
                          borderRadius: '12px',
                        }}
                      >
                        <div
                          className="w-100 d-flex align-items-center justify-content-center"
                          style={{
                            height: '45%',
                            background: `linear-gradient(135deg, ${(project.color || '#6366F1')}80, ${project.color || '#6366F1'})`,
                          }}
                        >
                          <span style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.9)' }}>
                            {project.emoji || '📁'}
                          </span>
                        </div>
                        <div className="p-3 d-flex flex-column justify-content-between flex-grow-1 bg-transparent" style={{ height: '55%' }}>
                          <div>
                            <h6
                              className="fw-semibold text-truncate mb-0"
                              style={{ color: 'var(--custom-text)', fontSize: '14px' }}
                              title={project.name}
                            >
                              {project.name}
                            </h6>
                            <small className="text-muted" style={{ fontSize: '11px' }}>
                              {project.role === 'owner' ? '👑 Sahip' : '👤 Üye'}
                            </small>
                          </div>
                          
                          <div className="mt-2">
                            <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '10px' }}>
                              <span className="text-muted">{project.task_count} görev</span>
                              <span className="fw-semibold text-primary">{percent}%</span>
                            </div>
                            <div className="progress" style={{ height: '4px', borderRadius: '2px', backgroundColor: '#f1f5f9' }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ 
                                  width: `${percent}%`, 
                                  borderRadius: '2px', 
                                  backgroundColor: project.color || 'var(--custom-primary)',
                                  transition: 'width 0.4s ease' 
                                }}
                                aria-valuenow={percent}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  {/* Aksiyon butonları — sadece sahip görebilir */}
                  {project.role === 'owner' && (
                    <div className="position-absolute d-flex gap-1" style={{ top: 8, right: 8 }}>
                      <button
                        className="btn btn-sm shadow-sm"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          width: 28,
                          height: 28,
                          padding: 0,
                          lineHeight: '28px',
                        }}
                        onClick={(e) => handleStartEdit(project, e)}
                        title="Projeyi Düzenle"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm shadow-sm"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          width: 28,
                          height: 28,
                          padding: 0,
                          lineHeight: '28px',
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDelete(project.id);
                        }}
                        title="Projeyi Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {filteredProjects.map((project, index) => (
                <div key={project.id} className="d-flex align-items-center gap-2">
                  <Link to={`/board/${project.id}`} className="text-decoration-none flex-grow-1">
                    <div className="card border-0 shadow-sm px-4 py-3 d-flex flex-row align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: project.color || 'var(--custom-primary)',
                            fontSize: '1.2rem',
                          }}
                        >
                          {project.emoji || '📁'}
                        </div>
                        <div>
                          <h6 className="fw-semibold mb-0" style={{ color: 'var(--custom-text)' }}>
                            {project.name}
                          </h6>
                          {project.description && (
                            <small className="text-muted">{project.description}</small>
                          )}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-muted border">
                          {project.role === 'owner' ? '👑 Sahip' : '👤 Üye'}
                        </span>
                        {project.task_count > 0 && (
                          <span className="badge bg-light text-muted border">
                            {project.task_count} görev
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  {/* Liste görünümünde aksiyon butonları — sadece sahip */}
                  {project.role === 'owner' && (
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-light btn-sm"
                        onClick={(e) => handleStartEdit(project, e)}
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-light btn-sm"
                        onClick={() => setConfirmDelete(project.id)}
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredProjects.length === 0 && !loading && (
            <div className="text-center py-5">
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>
                {searchQuery ? '🔍' : '📋'}
              </div>
              <h5 className="fw-semibold mb-2" style={{ color: 'var(--custom-text)' }}>
                {searchQuery
                  ? 'Sonuç Bulunamadı'
                  : 'Henüz Projeniz Yok'}
              </h5>
              <p className="text-muted mb-4" style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                {searchQuery
                  ? `"${searchQuery}" ile eşleşen proje bulunamadı. Farklı bir arama deneyin.`
                  : 'İlk projenizi oluşturarak görev takibine hemen başlayın. Her şey bir adımla başlar!'}
              </p>
              {!searchQuery && (
                <button
                  className="btn btn-primary fw-medium shadow-sm"
                  onClick={() => setShowCreateForm(true)}
                >
                  ➕ İlk Projeni Oluştur
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
