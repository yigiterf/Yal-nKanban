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
  const [createError, setCreateError] = useState(null);

  // Proje düzenleme state
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [editError, setEditError] = useState(null);

  // Silme onay dialog state
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // API'den projeleri ve yaklaşan görevleri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsRes, upcomingRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks/upcoming'),
        ]);
        setProjects(projectsRes.data);
        setUpcomingTasks(upcomingRes.data);
      } catch (err) {
        setError('Veriler yüklenirken hata oluştu.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

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
      });

      // Projeyi listeye ekle (optimistic)
      const newProject = {
        id: res.data.projectId,
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        created_at: new Date().toISOString(),
        role: 'owner',
        task_count: 0,
      };
      setProjects((prev) => [newProject, ...prev]);
      setNewProjectName('');
      setNewProjectDesc('');
      setShowCreateForm(false);
      showToast('Proje oluşturuldu!');
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
      });

      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? { ...p, name: editProjectName.trim(), description: editProjectDesc.trim() }
            : p
        )
      );
      setEditingProject(null);
      showToast('Proje güncellendi!');
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
    } catch (err) {
      setProjects(oldProjects);
      showToast(err.response?.data?.message || 'Proje silinemedi.', 'danger');
    }
  };

  // Renk paleti (projelere sırayla renk atar)
  const colors = ['#6366F1', '#A5B4FC', '#FCA5A5', '#10B981', '#F59E0B', '#EC4899'];

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
                <div className="col-md-5">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Proje adı"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="col-md-5">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Açıklama (opsiyonel)"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                </div>
                <div className="col-md-2 d-flex gap-2">
                  <button type="submit" className="btn btn-primary flex-grow-1">
                    Kaydet
                  </button>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowCreateForm(false)}
                  >
                    ✕
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
              {filteredProjects.map((project, index) => (
                <div key={project.id} className="position-relative">
                  <Link to={`/board/${project.id}`} className="text-decoration-none">
                    <div
                      className="card border-0 shadow-sm overflow-hidden"
                      style={{
                        width: '160px',
                        height: '240px',
                        borderRadius: '12px',
                        backgroundColor: '#F8FAFC',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                      }}
                    >
                      <div
                        className="w-100 d-flex align-items-center justify-content-center"
                        style={{
                          height: '70%',
                          background: `linear-gradient(135deg, ${colors[index % colors.length]}80, ${colors[index % colors.length]})`,
                        }}
                      >
                        <span style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.7)' }}>📁</span>
                      </div>
                      <div className="p-3 d-flex flex-column justify-content-between flex-grow-1 bg-white">
                        <h6
                          className="fw-semibold text-truncate mb-0"
                          style={{ color: 'var(--custom-text)', fontSize: '14px' }}
                        >
                          {project.name}
                        </h6>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <small className="text-muted" style={{ fontSize: '11px' }}>
                            {project.role === 'owner' ? '👑 Sahip' : '👤 Üye'}
                          </small>
                          {project.task_count > 0 && (
                            <span className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>
                              {project.task_count} görev
                            </span>
                          )}
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
                    <div className="card border-0 shadow-sm px-4 py-3 bg-white d-flex flex-row align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: colors[index % colors.length],
                          }}
                        />
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
