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
            <span style={{ fontSize: '1.2rem' }}>📊</span>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/my-tasks"
            className={`sidebar-nav-link d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none transition-all mb-3 ${pathname === '/my-tasks' ? 'is-active' : ''}`}
            style={{
              backgroundColor: pathname === '/my-tasks' ? 'var(--custom-primary)' : 'transparent',
              color: pathname === '/my-tasks' ? 'white' : 'var(--custom-text)',
              fontWeight: pathname === '/my-tasks' ? '600' : '500',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <span>Görevlerim</span>
          </Link>

          {/* Collapsible Projects Header */}
          <div className="px-2 mb-2 d-flex align-items-center justify-content-between">
            <span className="text-uppercase fw-bold text-muted small" style={{ letterSpacing: '1px' }}>
              Projelerim ({projects.length})
            </span>
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
    </div>
  );
};

export default AppLayout;
