import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AppLayout = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Projelerim', path: '/dashboard', icon: '📁' },
  ];

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
    <div className="d-flex min-vh-100" style={{ backgroundColor: 'var(--custom-bg)' }}>
      {/* Sidebar / Toolbar */}
      <aside
        className="d-flex flex-column bg-white shadow-sm"
        style={{ width: '280px', position: 'sticky', top: 0, height: '100vh', zIndex: 1000 }}
      >
        <div className="p-4 d-flex align-items-center gap-2 mb-4 border-bottom">
          <span style={{ fontSize: '1.5rem' }}>✨</span>
          <span className="fw-bold fs-5" style={{ color: 'var(--custom-primary)' }}>YalınKanban</span>
        </div>

        <div className="d-flex flex-column px-3 flex-grow-1 gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className="d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--custom-primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--custom-text)',
                  fontWeight: isActive ? '600' : '500',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-top">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center bg-light fw-bold"
              style={{ width: '40px', height: '40px', color: 'var(--custom-primary)' }}
            >
              {getInitials(user?.username)}
            </div>
            <div>
              <p className="fw-semibold mb-0" style={{ color: 'var(--custom-text)' }}>
                {user?.username || 'Kullanıcı'}
              </p>
              <p className="small text-muted mb-0">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-light w-100 fw-medium d-flex align-items-center justify-content-center gap-2"
          >
            <span>🚪</span> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow-1 d-flex flex-column" style={{ overflowY: 'auto', height: '100vh' }}>
        <div className="p-4 p-md-5">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
