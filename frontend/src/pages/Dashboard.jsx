import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

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

  // Toast state
  const [toast, setToast] = useState(null);

  // Dashboard İstatistikleri State
  const [stats, setStats] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();

    const handleProjectsUpdate = () => {
      fetchData();
    };
    window.addEventListener('projects-changed', handleProjectsUpdate);
    return () => {
      window.removeEventListener('projects-changed', handleProjectsUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="container-fluid px-0 h-100 d-flex flex-column gap-4">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div className="skeleton" style={{ width: '150px', height: '32px' }}></div>
          <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: '50px' }}></div>
        </div>
        <div className="row g-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="col-md-4">
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px', height: '100px' }}>
                <div className="skeleton" style={{ width: '80%', height: '24px' }}></div>
              </div>
            </div>
          ))}
        </div>
        <div className="row g-4 mt-2">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px', height: '380px' }}>
              <div className="skeleton" style={{ width: '40%', height: '24px', marginBottom: '16px' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '250px' }}></div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px', height: '380px' }}>
              <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: '16px' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '250px' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container-fluid px-0 h-100 d-flex flex-column">

      {/* Toast Notification */}
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

      {/* ─── GREETING BANNER ─── */}
      <div className="border-0 shadow-sm p-4 mb-4 mt-2" style={{
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
            <div className="p-3 rounded-3 d-inline-block text-start" style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(10px)', minWidth: '200px' }}>
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

      {/* ─── STATISTICS CARDS ─── */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--custom-primary)', fontSize: '1.5rem' }}>
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
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
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
          <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
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

      {/* ─── TWO COLUMN LAYOUT ─── */}
      <div className="row g-4 mb-4">
        
        {/* LEFT COLUMN: GRAPH & CRITICAL TASKS */}
        <div className="col-lg-8 d-flex flex-column gap-4">
          
          {/* Performance Chart */}
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
            <h5 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--custom-text)', fontSize: '16px' }}>
              📊 Haftalık Performans Grafiği
            </h5>
            <p className="text-muted small mb-4">Son 7 günde oluşturulan ve sizin tarafınızdan tamamlanan görevler.</p>
            
            <div className="d-flex align-items-end justify-content-between px-2 mt-4" style={{ height: '180px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '8px' }}>
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
            
            {/* Day Names */}
            <div className="d-flex justify-content-between px-2 mt-2">
              {stats?.weeklyActivity.map((day, idx) => (
                <div key={idx} className="text-center text-muted fw-semibold" style={{ width: '12%', fontSize: '11px' }}>
                  {day.dayName}
                </div>
              ))}
            </div>
            
            {/* Graph Legend */}
            <div className="d-flex gap-3 justify-content-center mt-3" style={{ fontSize: '11px' }}>
              <div className="d-flex align-items-center gap-1">
                <span className="rounded-circle d-inline-block" style={{ width: '8px', height: '8px', backgroundColor: 'var(--custom-primary)' }} />
                <span className="text-muted">Projelerde Oluşturulan</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <span className="rounded-circle d-inline-block" style={{ width: '8px', height: '8px', backgroundColor: '#22c55e' }} />
                <span className="text-muted">Benim Tamamladıklarım</span>
              </div>
            </div>
          </div>

          {/* Critical Upcoming Tasks */}
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--custom-text)', fontSize: '16px' }}>
                ⏰ Yaklaşan Görevlerim
              </h5>
              <span
                className="badge rounded-pill"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '12px' }}
              >
                {upcomingTasks.length} Acil / Yaklaşan
              </span>
            </div>

            {upcomingTasks.length > 0 ? (
              <div className="row g-3">
                {upcomingTasks.slice(0, 10).map((task) => {
                  const ds = getDueDateStatus(task.due_date);
                  const isUrgent = task.priority === 'urgent';
                  const borderColor = isUrgent ? '#dc2626' : (ds?.color || '#94a3b8');
                  return (
                    <div key={task.id} className="col-md-6">
                      <Link to={`/board/${task.project_id}`} className="text-decoration-none">
                        <div
                          className="p-3 rounded-3 border h-100 transition-all task-card-modern"
                          style={{
                            borderLeft: `4px solid ${borderColor}`,
                            background: 'var(--surface-card)',
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="fw-semibold mb-0 text-truncate" style={{ color: 'var(--custom-text)', fontSize: '14px', maxWidth: '60%' }}>
                              {task.title}
                            </h6>
                            <div className="d-flex gap-1 flex-shrink-0 ms-2 flex-wrap justify-content-end">
                              {isUrgent && (
                                <span
                                  className="badge rounded-pill"
                                  style={{
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    fontSize: '10px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  🔴 Acil
                                </span>
                              )}
                              {ds && (
                                <span
                                  className="badge rounded-pill"
                                  style={{
                                    backgroundColor: ds.bg,
                                    color: ds.color,
                                    border: `1px solid ${ds.border}`,
                                    fontSize: '10px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {ds.label}
                                </span>
                              )}
                              {!ds && !task.due_date && (
                                <span
                                  className="badge rounded-pill"
                                  style={{
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '10px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  📅 Tarih yok
                                </span>
                              )}
                            </div>
                          </div>
                          <small className="text-muted d-flex align-items-center gap-1 mt-1">
                            <span>📁</span>
                            <span className="text-truncate">{task.project_name}</span>
                          </small>
                          {task.description && (
                            <p className="text-muted mb-0 mt-2 text-truncate" style={{ fontSize: '12px' }}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <span style={{ fontSize: '2rem' }}>🎉</span>
                <p className="mb-0 mt-2 small">Yakın zamanda teslim edilmesi gereken acil bir göreviniz bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PROJECT PROGRESS SUMMARY */}
        <div className="col-lg-4 d-flex flex-column gap-4">
          
          {/* Project Progress Summary list */}
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: '16px', background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
            <h5 className="fw-bold mb-1" style={{ color: 'var(--custom-text)', fontSize: '16px' }}>
              📈 Proje İlerleme Durumları
            </h5>
            <p className="text-muted small mb-3">Projelerinizdeki görevlerin tamamlanma oranları.</p>

            <div className="d-flex flex-column gap-3" style={{ overflowY: 'auto' }}>
              {projects.map((project) => {
                const percent = project.task_count > 0 
                  ? Math.round(((project.completed_task_count || 0) / project.task_count) * 100) 
                  : 0;
                return (
                  <Link key={project.id} to={`/board/${project.id}`} className="text-decoration-none">
                    <div className="p-2 rounded-3 hover-bg-subtle transition-all" style={{ border: '1px solid var(--surface-border)', background: 'var(--surface-subtle)' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2 text-truncate">
                          <span>{project.emoji || '📁'}</span>
                          <span className="fw-semibold text-truncate" style={{ color: 'var(--custom-text)', fontSize: '13px' }}>{project.name}</span>
                        </div>
                        <span className="fw-bold text-primary" style={{ fontSize: '12px' }}>{percent}%</span>
                      </div>
                      <div className="progress" style={{ height: '4px', borderRadius: '2px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                        <div 
                          className="progress-bar" 
                          style={{ 
                            width: `${percent}%`, 
                            backgroundColor: project.color || 'var(--custom-primary)',
                            borderRadius: '2px'
                          }} 
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
              {projects.length === 0 && (
                <div className="text-center py-4 text-muted small">
                  Henüz bir projeniz yok. Sol taraftaki ＋ simgesinden yeni bir proje oluşturun!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
