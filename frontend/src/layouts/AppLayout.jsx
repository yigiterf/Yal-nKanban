import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import NotificationDropdown from '../components/NotificationDropdown';

const AppLayout = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [projects, setProjects] = useState([]);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Project creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#4F46E5');
  const [newProjectEmoji, setNewProjectEmoji] = useState('📁');
  const [newProjectMaxMembers, setNewProjectMaxMembers] = useState('');
  const [createError, setCreateError] = useState(null);

  const PROJECT_COLORS = ['#4F46E5', '#10B981', '#EC4899', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];
  const PROJECT_EMOJIS = ['📁', '🚀', '💻', '🎨', '📚', '🎯', '🛠️', '📊', '⚡', '🌟', '🧩', '📈'];

  // Dark/Light Theme Handler
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Dinamik projeleri yükle
  const fetchSidebarProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Sidebar projeleri yüklenirken hata:', err);
    }
  };

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (!newProjectName.trim()) {
      setCreateError('Proje adı boş bırakılamaz.');
      return;
    }

    try {
      const res = await api.post('/projects', {
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        color: newProjectColor,
        emoji: newProjectEmoji,
        maxMembers: newProjectMaxMembers ? parseInt(newProjectMaxMembers) : null,
      });

      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectColor('#4F46E5');
      setNewProjectEmoji('📁');
      setNewProjectMaxMembers('');
      setShowCreateModal(false);

      fetchSidebarProjects();
      window.dispatchEvent(new Event('projects-changed'));
      navigate(`/board/${res.data.projectId}`);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Proje oluşturulamadı.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchSidebarProjects();
      
      // Proje değişikliklerini takip eden event listener
      const handleProjectsUpdate = () => {
        fetchSidebarProjects();
      };
      window.addEventListener('projects-changed', handleProjectsUpdate);
      return () => {
        window.removeEventListener('projects-changed', handleProjectsUpdate);
      };
    }
  }, [user]);

  // Kullanıcı baş harflerini oluştur
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell d-flex min-vh-100" style={{ backgroundColor: 'var(--custom-bg)' }}>
      {/* Sidebar */}
      <aside
        className="app-sidebar d-flex flex-column bg-white shadow-sm transition-all"
        style={{ width: '280px', position: 'sticky', top: 0, height: '100vh', zIndex: 1000 }}
      >
        {/* Brand Header */}
        <div className="p-4 d-flex align-items-center gap-2 border-bottom">
          <span style={{ fontSize: '1.5rem' }}>✨</span>
          <span className="fw-bold fs-5" style={{ color: 'var(--custom-primary)' }}>YalınKanban</span>
        </div>

        {/* Navigation Section */}
        <div className="d-flex flex-column px-3 py-3 flex-grow-1 gap-1" style={{ overflowY: 'auto' }}>
          {/* Main Links */}
          <Link
            to="/dashboard"
            className={`sidebar-nav-link d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none transition-all mb-1 ${pathname === '/dashboard' ? 'is-active' : ''}`}
            style={{
              backgroundColor: pathname === '/dashboard' ? 'var(--custom-primary)' : 'transparent',
              color: pathname === '/dashboard' ? 'white' : 'var(--custom-text)',
              fontWeight: pathname === '/dashboard' ? '600' : '500',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🏠</span>
            <span>Anasayfa</span>
          </Link>

          <Link
            to="/my-tasks"
            className={`sidebar-nav-link d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none transition-all mb-1 ${pathname === '/my-tasks' ? 'is-active' : ''}`}
            style={{
              backgroundColor: pathname === '/my-tasks' ? 'var(--custom-primary)' : 'transparent',
              color: pathname === '/my-tasks' ? 'white' : 'var(--custom-text)',
              fontWeight: pathname === '/my-tasks' ? '600' : '500',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <span>Görevlerim</span>
          </Link>

          <Link
            to="/discover"
            className={`sidebar-nav-link d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none transition-all mb-3 ${pathname === '/discover' ? 'is-active' : ''}`}
            style={{
              backgroundColor: pathname === '/discover' ? 'var(--custom-primary)' : 'transparent',
              color: pathname === '/discover' ? 'white' : 'var(--custom-text)',
              fontWeight: pathname === '/discover' ? '600' : '500',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔭</span>
            <span>Keşfet</span>
          </Link>

          {/* Collapsible Projects Header */}
          <div className="px-2 mb-2 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span className="text-uppercase fw-bold text-muted small" style={{ letterSpacing: '1px' }}>
                Projelerim ({projects.length})
              </span>
              <button
                onClick={() => {
                  setCreateError(null);
                  setShowCreateModal(true);
                }}
                className="btn btn-sm p-0 border-0 text-primary d-flex align-items-center justify-content-center"
                style={{ fontSize: '15px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                title="Yeni Proje Oluştur"
              >
                ＋
              </button>
            </div>
            <button
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              className="btn btn-sm p-0 border-0 text-muted"
              style={{ fontSize: '12px', outline: 'none', boxShadow: 'none' }}
              title={isProjectsExpanded ? 'Gizle' : 'Göster'}
            >
              {isProjectsExpanded ? '▼' : '▶'}
            </button>
          </div>

          {/* Dynamic Project List */}
          {isProjectsExpanded && (
            <div className="d-flex flex-column gap-1 ms-1 ps-1 border-start" style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}>
              {projects.map((project) => {
                const isProjectActive = pathname === `/board/${project.id}`;
                return (
                  <Link
                    key={project.id}
                    to={`/board/${project.id}`}
                    className={`sidebar-project-link d-flex align-items-center justify-content-between p-2 rounded-3 text-decoration-none transition-all ${isProjectActive ? 'is-active' : ''}`}
                    style={{
                      backgroundColor: isProjectActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      color: 'var(--custom-text)',
                      fontWeight: isProjectActive ? '600' : '400',
                      borderLeft: `3px solid ${isProjectActive ? (project.color || 'var(--custom-primary)') : 'transparent'}`,
                      paddingLeft: isProjectActive ? '8px' : '11px',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      <span>{project.emoji || '📁'}</span>
                      <span className="text-truncate" style={{ fontSize: '14px' }}>
                        {project.name}
                      </span>
                    </div>
                    {project.task_count > 0 && (
                      <span
                        className="badge rounded-pill bg-light text-muted border small"
                        style={{ fontSize: '10px' }}
                      >
                        {project.task_count}
                      </span>
                    )}
                  </Link>
                );
              })}
              {projects.length === 0 && (
                <span className="text-muted small px-3 py-2 italic" style={{ fontSize: '12px' }}>
                  Henüz proje yok
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="p-4 border-top">
          {/* Notification Dropdown */}
          <div className="mb-3">
            <NotificationDropdown />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-light w-100 fw-medium d-flex align-items-center justify-content-center gap-2 mb-3"
            style={{ fontSize: '14px' }}
          >
            <span>{theme === 'light' ? '🌙' : '☀️'}</span>
            <span>{theme === 'light' ? 'Karanlık Tema' : 'Aydınlık Tema'}</span>
          </button>

          {/* Profile Section */}
          <Link
            to="/profile"
            className={`sidebar-profile-link d-flex align-items-center gap-3 mb-3 p-2 rounded-3 text-decoration-none transition-all ${pathname === '/profile' ? 'is-active' : ''}`}
            style={{
              backgroundColor: pathname === '/profile' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              color: 'var(--custom-text)',
              borderLeft: `3px solid ${pathname === '/profile' ? 'var(--custom-primary)' : 'transparent'}`,
              paddingLeft: pathname === '/profile' ? '8px' : '11px',
            }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center bg-light fw-bold flex-shrink-0"
              style={{ width: '40px', height: '40px', color: 'var(--custom-primary)' }}
            >
              {getInitials(user?.username)}
            </div>
            <div className="text-truncate flex-grow-1">
              <p className="fw-semibold mb-0 text-truncate" style={{ color: 'var(--custom-text)', fontSize: '14px' }}>
                {user?.username || 'Kullanıcı'}
              </p>
              <p className="small text-muted mb-0 text-truncate" style={{ fontSize: '12px' }}>
                {user?.email || ''}
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="btn btn-light w-100 fw-medium d-flex align-items-center justify-content-center gap-2"
          >
            <span>🚪</span> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main flex-grow-1 d-flex flex-column" style={{ overflowY: 'auto', height: '100vh' }}>
        <div className="app-content p-4 p-md-5">
          {children}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', background: 'var(--surface-card)', color: 'var(--custom-text)' }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--custom-text)' }}>✨ Yeni Proje Oluştur</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} aria-label="Close" style={{ filter: theme === 'dark' ? 'invert(1) grayscale(1) brightness(2)' : 'none' }}></button>
              </div>
              <form onSubmit={handleCreateProjectSubmit}>
                <div className="modal-body pt-3">
                  {createError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {createError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label small fw-medium">Proje Adı</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: Mobil Uygulama Geliştirme"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium">Açıklama (İsteğe Bağlı)</label>
                    <textarea
                      className="form-control"
                      placeholder="Projenin amacı ve hedefleri..."
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      rows="2"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium">Maksimum Üye Sayısı (İsteğe Bağlı)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Örn: 10 (Boş bırakılırsa sınırsız)"
                      value={newProjectMaxMembers}
                      onChange={(e) => setNewProjectMaxMembers(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small d-block fw-medium mb-2">Renk Vurgusu</label>
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
                            outline: newProjectColor === c ? '2px solid var(--custom-text)' : 'none',
                            outlineOffset: '2px',
                            transition: 'transform 0.2s'
                          }}
                          onClick={() => setNewProjectColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small d-block fw-medium mb-2">Emoji Seçin</label>
                    <div className="d-flex flex-wrap gap-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      {PROJECT_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          className="btn btn-light p-2 d-flex align-items-center justify-content-center"
                          style={{
                            width: '38px',
                            height: '38px',
                            fontSize: '1.2rem',
                            backgroundColor: newProjectEmoji === em ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                            borderColor: newProjectEmoji === em ? 'var(--custom-primary)' : 'rgba(0,0,0,0.1)',
                            borderRadius: '8px'
                          }}
                          onClick={() => setNewProjectEmoji(em)}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button type="button" className="btn btn-light fw-medium" onClick={() => setShowCreateModal(false)}>İptal</button>
                  <button type="submit" className="btn btn-primary fw-medium">Oluştur</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
