import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const priorityConfig = {
  low:    { label: 'Düşük',  color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
  medium: { label: 'Orta',   color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
  high:   { label: 'Yüksek', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  urgent: { label: 'Acil',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const statusConfig = {
  todo:        { label: 'Yapılacak',    color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: 'Devam Ediyor', color: '#3b82f6', bg: '#eff6ff' },
  done:        { label: 'Tamamlandı',   color: '#22c55e', bg: '#f0fdf4' },
};

// ─── Proje Kartı ─────────────────────────────────────────────────────────────
const ProjectCard = ({ project, onClick }) => {
  const completionRate = project.task_count > 0
    ? Math.round((project.done_count / project.task_count) * 100)
    : 0;

  return (
    <div
      className="card border-0 shadow-sm h-100 transition-all"
      style={{
        borderRadius: '16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onClick={() => onClick(project)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Top accent */}
      <div style={{ height: '4px', borderRadius: '16px 16px 0 0', background: project.color || 'var(--custom-primary)' }} />
      <div className="card-body p-4">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: '2rem' }}>{project.emoji || '📁'}</span>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--custom-text)', fontSize: '15px' }}>
                  {project.name}
                </h5>
                {project.is_full && (
                  <span className="badge bg-danger rounded-pill" style={{ fontSize: '10px' }}>
                    Kontenjan Dolu
                  </span>
                )}
              </div>
              <small className="text-muted">
                👤 {project.owner_name} · {project.member_count}{project.max_members ? `/${project.max_members}` : ''} üye
              </small>
            </div>
          </div>
        </div>

        {project.description && (
          <p className="text-muted small mb-3" style={{ lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}

        {/* Stats row */}
        <div className="d-flex gap-3 mb-3">
          <div className="text-center">
            <div className="fw-bold" style={{ color: 'var(--custom-text)', fontSize: '18px' }}>{project.task_count || 0}</div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Görev</div>
          </div>
          <div className="text-center">
            <div className="fw-bold" style={{ color: '#22c55e', fontSize: '18px' }}>{project.done_count || 0}</div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Bitti</div>
          </div>
          <div className="text-center">
            <div className="fw-bold" style={{ color: '#3b82f6', fontSize: '18px' }}>{project.open_task_count || 0}</div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Açık</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress mb-3" style={{ height: '6px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.06)' }}>
          <div
            className="progress-bar"
            style={{
              width: `${completionRate}%`,
              background: 'linear-gradient(90deg, var(--custom-primary), #22c55e)',
              borderRadius: '4px',
              transition: 'width 0.6s ease',
            }}
          />
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <span className="text-muted" style={{ fontSize: '12px' }}>%{completionRate} tamamlandı</span>
          <button
            className="btn btn-sm fw-semibold"
            style={{
              background: 'var(--custom-primary)',
              color: 'white',
              borderRadius: '8px',
              fontSize: '12px',
              padding: '4px 14px',
            }}
          >
            🔍 İncele
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Görev Satırı ─────────────────────────────────────────────────────────────
const TaskRow = ({ task, onClaim, claimingId, currentUserId, isProjectFull, isProjectMember }) => {
  const pr = priorityConfig[task.priority] || priorityConfig.medium;
  const st = statusConfig[task.status] || statusConfig.todo;
  const isMine = task.assigned_to === currentUserId;
  const isAssigned = !!task.assigned_to;
  const isClaiming = claimingId === task.id;

  return (
    <div
      className="p-3 rounded-3 mb-2"
      style={{
        background: 'var(--surface-subtle, rgba(0,0,0,0.02))',
        border: '1px solid var(--surface-border)',
        borderLeft: `4px solid ${pr.color}`,
        transition: 'all 0.2s ease',
      }}
    >
      <div className="d-flex align-items-center justify-content-between gap-2">
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <span className="fw-semibold text-truncate" style={{ color: 'var(--custom-text)', fontSize: '14px', maxWidth: '280px' }}>
              {task.title}
            </span>
            <span className="badge rounded-pill" style={{ backgroundColor: pr.bg, color: pr.color, border: `1px solid ${pr.border}`, fontSize: '10px' }}>
              {pr.label}
            </span>
            <span className="badge rounded-pill" style={{ backgroundColor: st.bg, color: st.color, fontSize: '10px' }}>
              {st.label}
            </span>
          </div>
          {task.description && (
            <div className="text-muted" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
              {task.description}
            </div>
          )}
          {isAssigned && !isMine && (
            <div className="text-muted mt-1" style={{ fontSize: '11px' }}>
              👤 {task.assigned_username || 'Atanmış'}
            </div>
          )}
          {isMine && (
            <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: 600, marginTop: '2px' }}>
              ✅ Üstlendiniz
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {task.status !== 'done' && !isMine && (
            <button
              className="btn btn-sm fw-semibold"
              disabled={isClaiming || (isProjectFull && !isProjectMember)}
              onClick={() => onClaim(task.id)}
              style={{
                background: (isProjectFull && !isProjectMember) ? '#9ca3af' : isAssigned ? 'transparent' : 'var(--custom-primary)',
                color: (isProjectFull && !isProjectMember) ? 'white' : isAssigned ? 'var(--custom-primary)' : 'white',
                border: (isProjectFull && !isProjectMember) ? 'none' : isAssigned ? '1px solid var(--custom-primary)' : 'none',
                borderRadius: '8px',
                fontSize: '11px',
                padding: '5px 12px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                cursor: (isProjectFull && !isProjectMember) ? 'not-allowed' : 'pointer'
              }}
              title={(isProjectFull && !isProjectMember) ? 'Proje kontenjanı dolu' : ''}
            >
              {isClaiming ? '⏳ ...' : isAssigned ? '🔄 Devral' : '🙋 Üstlen'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Proje Detay Drawer ────────────────────────────────────────────────────────
const ProjectDrawer = ({ projectId, onClose, currentUserId, onJoined }) => {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [toast, setToast]         = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/discover/projects/${projectId}`);
      setData(res.data);
    } catch {
      showToast('Proje detayları yüklenemedi.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [projectId]);

  const handleClaim = async (taskId) => {
    setClaimingId(taskId);
    try {
      await api.post(`/discover/tasks/${taskId}/claim`);
      showToast('Görev üstlenildi! Projelerim\'e eklendi. 🎉');
      fetchDetail();
      onJoined && onJoined();
    } catch (err) {
      showToast(err.response?.data?.message || 'Üstlenemedi.', 'danger');
    } finally {
      setClaimingId(null);
    }
  };

  const handleJoin = async () => {
    try {
      const res = await api.post(`/discover/projects/${projectId}/join`);
      showToast(res.data?.message || 'Katılım talebiniz iletildi! 🎉');
      fetchDetail();
      onJoined && onJoined();
    } catch (err) {
      showToast(err.response?.data?.message || 'Katılınamadı.', 'danger');
    }
  };

  const filteredTasks = data?.tasks?.filter(t =>
    statusFilter === 'all' ? true : t.status === statusFilter
  ) || [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', zIndex: 1040,
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '560px', maxWidth: '95vw',
          background: 'var(--surface-card)', zIndex: 1050, overflowY: 'auto',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

        {/* Toast */}
        {toast && (
          <div className={`alert alert-${toast.type} m-3 py-2 border-0`} style={{ fontSize: '13px', borderRadius: '10px', position: 'sticky', top: '12px', zIndex: 10 }}>
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="spinner-border text-primary" />
          </div>
        ) : data ? (
          <>
            {/* Header */}
            <div className="p-4 border-bottom" style={{ background: 'var(--surface-card)' }}>
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                  <span style={{ fontSize: '2.5rem' }}>{data.project.emoji || '📁'}</span>
                  <div>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--custom-text)' }}>{data.project.name}</h4>
                    <span className="text-muted small">👤 Proje Sahibi: {data.project.owner_name}</span>
                  </div>
                </div>
                <button className="btn btn-sm btn-light" onClick={onClose} style={{ borderRadius: '8px' }}>✕</button>
              </div>

              {data.project.description && (
                <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>{data.project.description}</p>
              )}

              {/* Üye avatarları */}
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="d-flex">
                  {data.members.slice(0, 5).map((m, i) => (
                    <div
                      key={m.user_id}
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold border border-2"
                      style={{
                        width: 28, height: 28, fontSize: '10px',
                        backgroundColor: ['#6366F1','#10B981','#EC4899','#F59E0B','#3B82F6'][i % 5],
                        color: 'white', marginLeft: i > 0 ? '-6px' : 0, zIndex: 5 - i, position: 'relative',
                        borderColor: 'var(--surface-card)',
                      }}
                      title={m.username}
                    >
                      {m.username.substring(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="text-muted small">{data.members.length}{data.project.max_members ? `/${data.project.max_members}` : ''} üye</span>
              </div>

              {data.isFull && !data.isMember && (
                <div className="alert alert-warning py-2 mb-3 small" style={{ borderRadius: '8px' }}>
                  ⚠️ Bu projenin kontenjanı dolmuştur. Şu an için sadece görevleri inceleyebilirsiniz.
                </div>
              )}

              <div className="d-flex gap-2 flex-wrap">
                {!data.isMember && (
                  <button
                    className="btn btn-sm fw-semibold"
                    onClick={handleJoin}
                    disabled={data.isFull || data.joinRequestStatus === 'pending'}
                    style={{
                      background: (data.isFull || data.joinRequestStatus === 'pending') ? '#9ca3af' : 'var(--custom-primary)',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: (data.isFull || data.joinRequestStatus === 'pending') ? 'not-allowed' : 'pointer',
                      border: 'none',
                      padding: '6px 14px'
                    }}
                  >
                    {data.joinRequestStatus === 'pending'
                      ? '⏳ Katılım Talebi Beklemede'
                      : data.joinRequestStatus === 'rejected'
                        ? '🔄 Tekrar Katılım Talebi Gönder'
                        : '🚀 Projeye Katılma Talebi Gönder'}
                  </button>
                )}
                {data.isMember && (
                  <button
                    className="btn btn-sm fw-semibold"
                    onClick={() => navigate(`/board/${projectId}`)}
                    style={{ background: 'var(--custom-primary)', color: 'white', borderRadius: '8px', fontSize: '13px' }}
                  >
                    📋 Kanban Tahtasına Git
                  </button>
                )}
              </div>
            </div>

            {/* Task list or Permission Notice */}
            <div className="p-4">
              {data.isMember ? (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--custom-text)' }}>
                      📋 Görevler ({data.tasks.length})
                    </h6>
                    <select
                      className="form-select form-select-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ width: 'auto', fontSize: '12px' }}
                    >
                      <option value="all">Tümü</option>
                      <option value="todo">Yapılacak</option>
                      <option value="in_progress">Devam Ediyor</option>
                      <option value="done">Tamamlandı</option>
                    </select>
                  </div>

                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onClaim={handleClaim}
                        claimingId={claimingId}
                        currentUserId={currentUserId}
                        isProjectFull={data.isFull}
                        isProjectMember={data.isMember}
                      />
                    ))
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <span style={{ fontSize: '2rem' }}>📭</span>
                      <p className="mt-2 small">Bu kategoride görev yok.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5 px-3 rounded-4" style={{ background: 'rgba(0, 0, 0, 0.02)', border: '1px dashed var(--surface-border)' }}>
                  <span style={{ fontSize: '2.5rem' }}>🔒</span>
                  <h6 className="fw-bold mt-3 mb-2" style={{ color: 'var(--custom-text)' }}>Proje İçeriği Gizli</h6>
                  <p className="text-muted small mb-0" style={{ lineHeight: '1.5' }}>
                    Bu projenin görevlerini ve detaylarını görüntülemek için üye olmanız gerekmektedir.
                    Yukarıdaki butonu kullanarak katılım talebi gönderebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-5 text-muted">Yüklenemedi.</div>
        )}
      </div>
    </>
  );
};

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────
const DiscoverPage = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedId, setSelectedId]   = useState(null);

  const fetchProjects = async (q = '') => {
    try {
      setLoading(true);
      const res = await api.get('/discover/projects', { params: { search: q } });
      setProjects(res.data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProjects(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--custom-text)', fontSize: '24px' }}>
            🔭 Keşfet
          </h2>
          <p className="text-muted mb-0 small">
            Diğer kullanıcıların projelerini keşfet, görevleri üstlen, projelere katıl.
          </p>
        </div>
        <span
          className="badge rounded-pill"
          style={{ backgroundColor: 'rgba(79,70,229,0.1)', color: 'var(--custom-primary)', border: '1px solid rgba(79,70,229,0.2)', fontSize: '13px', padding: '8px 16px' }}
        >
          {projects.length} proje
        </span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div style={{ position: 'relative', maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Proje veya sahip adına göre ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px', borderRadius: '12px', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="row g-4">
          {[1,2,3,4,5,6].map((n) => (
            <div key={n} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px', height: '200px' }}>
                <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '12px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '80%', height: '14px', borderRadius: '6px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="row g-4">
          {projects.map((project) => (
            <div key={project.id} className="col-md-6 col-lg-4">
              <ProjectCard project={project} onClick={(p) => setSelectedId(p.id)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 text-muted">
          <span style={{ fontSize: '3.5rem' }}>🌐</span>
          <h5 className="mt-3 fw-semibold" style={{ color: 'var(--custom-text)' }}>Proje bulunamadı</h5>
          <p className="small">
            {search ? `"${search}" için sonuç yok.` : 'Henüz keşfedilecek başka proje yok. İlk projeyi sen oluştur!'}
          </p>
        </div>
      )}

      {/* Drawer */}
      {selectedId && (
        <ProjectDrawer
          projectId={selectedId}
          currentUserId={user?.id}
          onClose={() => setSelectedId(null)}
          onJoined={() => {
            window.dispatchEvent(new Event('projects-changed'));
            fetchProjects(search);
          }}
        />
      )}
    </div>
  );
};

export default DiscoverPage;
