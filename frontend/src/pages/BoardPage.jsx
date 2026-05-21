import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActivityTimeline from '../components/ActivityTimeline';

const PROJECT_COLORS = ['#6366F1', '#10B981', '#EC4899', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];
const PROJECT_EMOJIS = ['📁', '🚀', '💻', '🎨', '📚', '🎯', '🛠️', '📊', '⚡', '🌟', '🧩', '📈'];

const BoardPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Üye ekleme state
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState(null);

  // Silme onay dialogu
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);

  // Proje düzenleme state
  const [showProjectEdit, setShowProjectEdit] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [editProjectColor, setEditProjectColor] = useState('#6366F1');
  const [editProjectEmoji, setEditProjectEmoji] = useState('📁');
  const [editProjectError, setEditProjectError] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);

  // Filtreler ve aktivite paneli state'leri
  const [showActivity, setShowActivity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes, membersRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/members`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);

      if (projRes.data.created_by === user?.id) {
        try {
          const reqsRes = await api.get(`/projects/${projectId}/join-requests`);
          setJoinRequests(reqsRes.data);
        } catch (reqsErr) {
          console.error('Katılım talepleri yüklenemedi:', reqsErr);
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Proje bulunamadı.');
      } else {
        setError('Veriler yüklenirken bir hata oluştu.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Görev CRUD İşlemleri (Optimistic UI) ---

  const handleTaskSubmit = async ({ title, description, assignedTo, dueDate, priority, tags, estimatePoints }) => {
    try {
      if (editingTask) {
        // Optimistic: UI'da hemen güncelle
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id
              ? {
                  ...t,
                  title,
                  description,
                  due_date: dueDate || null,
                  assigned_to: assignedTo,
                  assigned_username:
                    members.find((m) => m.user_id == assignedTo)?.username || null,
                  priority: priority || 'medium',
                  tags: tags || '',
                  estimate_points: estimatePoints,
                }
              : t
          )
        );
        setShowModal(false);
        setEditingTask(null);

        // Tek PATCH çağrısıyla tüm alanları güncelle
        await api.patch(`/tasks/${editingTask.id}`, {
          title,
          description,
          dueDate,
          assignedTo,
          priority,
          tags,
          estimatePoints,
        });
        showToast('Görev güncellendi.');
      } else {
        const tempId = Date.now();
        const newTask = {
          id: tempId,
          title,
          description,
          status: 'todo',
          due_date: dueDate || null,
          assigned_to: assignedTo,
          assigned_username:
            members.find((m) => m.user_id == assignedTo)?.username || null,
          priority: priority || 'medium',
          tags: tags || '',
          estimate_points: estimatePoints,
        };
        setTasks((prev) => [newTask, ...prev]);
        setShowModal(false);

        // Görev oluştur
        const res = await api.post(`/projects/${projectId}/tasks`, {
          title,
          description,
          assignedTo,
          dueDate,
          priority,
          tags,
          estimatePoints,
        });
        const realId = res.data.taskId;

        // Gerçek ID ile güncelle
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t))
        );
        showToast('Görev oluşturuldu.');
      }
    } catch (err) {
      fetchData();
      showToast('İşlem başarısız oldu.', 'danger');
    }
  };

  // Statü güncelle (Kanban sürükle-bırak)
  const handleStatusChange = async (taskId, newStatus) => {
    const oldTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      showToast('Durum güncellendi.');
    } catch (err) {
      setTasks(oldTasks);
      showToast('Durum güncellenemedi.', 'danger');
    }
  };

  // Görev sil (onay sonrası)
  const handleDeleteTask = async (taskId) => {
    const oldTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setConfirmDeleteTask(null);

    try {
      await api.delete(`/tasks/${taskId}`);
      showToast('Görev silindi.');
    } catch (err) {
      setTasks(oldTasks);
      showToast('Görev silinemedi.', 'danger');
    }
  };

  // Görev silme isteği (önce onay dialogu aç)
  const requestDeleteTask = (taskId) => {
    setConfirmDeleteTask(taskId);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  // --- Proje Düzenleme ---
  const handleStartProjectEdit = () => {
    setEditProjectName(project?.name || '');
    setEditProjectDesc(project?.description || '');
    setEditProjectColor(project?.color || PROJECT_COLORS[0]);
    setEditProjectEmoji(project?.emoji || PROJECT_EMOJIS[0]);
    setEditProjectError(null);
    setShowProjectEdit(true);
  };

  const handleSaveProjectEdit = async (e) => {
    e.preventDefault();
    setEditProjectError(null);

    if (!editProjectName.trim()) {
      setEditProjectError('Proje adı boş bırakılamaz.');
      return;
    }

    try {
      await api.patch(`/projects/${projectId}`, {
        name: editProjectName.trim(),
        description: editProjectDesc.trim(),
        color: editProjectColor,
        emoji: editProjectEmoji,
      });
      setProject((prev) => ({
        ...prev,
        name: editProjectName.trim(),
        description: editProjectDesc.trim(),
        color: editProjectColor,
        emoji: editProjectEmoji,
      }));
      setShowProjectEdit(false);
      showToast('Proje güncellendi!');
      
      // Sidebar'ı güncelle
      window.dispatchEvent(new Event('projects-changed'));
    } catch (err) {
      setEditProjectError(err.response?.data?.message || 'Proje güncellenemedi.');
    }
  };

  // --- Üye Ekleme ---
  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError(null);

    if (!memberEmail.trim()) {
      setMemberError('E-posta adresi gerekli.');
      return;
    }

    try {
      await api.post(`/projects/${projectId}/members`, { email: memberEmail.trim() });
      setMemberEmail('');
      setShowMemberForm(false);
      showToast('Üye eklendi!');
      // Üye listesini yenile
      const res = await api.get(`/projects/${projectId}/members`);
      setMembers(res.data);
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Üye eklenemedi.');
    }
  };

  // Üye çıkar
  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      showToast('Üye çıkarıldı.');
    } catch (err) {
      showToast(err.response?.data?.message || 'İşlem başarısız.', 'danger');
    }
  };

  // Katılım talebini onayla
  const handleApproveRequest = async (requestId) => {
    try {
      await api.post(`/projects/${projectId}/join-requests/${requestId}/approve`);
      showToast('Katılım talebi onaylandı! 🎉');
      const [membersRes, reqsRes] = await Promise.all([
        api.get(`/projects/${projectId}/members`),
        api.get(`/projects/${projectId}/join-requests`),
      ]);
      setMembers(membersRes.data);
      setJoinRequests(reqsRes.data);
      window.dispatchEvent(new Event('projects-changed'));
    } catch (err) {
      showToast(err.response?.data?.message || 'İşlem başarısız oldu.', 'danger');
    }
  };

  // Katılım talebini reddet
  const handleRejectRequest = async (requestId) => {
    try {
      await api.post(`/projects/${projectId}/join-requests/${requestId}/reject`);
      showToast('Katılım talebi reddedildi.');
      const reqsRes = await api.get(`/projects/${projectId}/join-requests`);
      setJoinRequests(reqsRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'İşlem başarısız oldu.', 'danger');
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="container-fluid px-0 h-100 d-flex flex-column gap-4">
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="skeleton rounded-circle" style={{ width: '36px', height: '36px' }}></div>
            <div className="d-flex flex-column gap-2">
              <div className="skeleton" style={{ width: '200px', height: '24px' }}></div>
              <div className="skeleton" style={{ width: '150px', height: '14px' }}></div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <div className="skeleton rounded-circle" style={{ width: '32px', height: '32px' }}></div>
            <div className="skeleton rounded-circle" style={{ width: '32px', height: '32px' }}></div>
            <div className="skeleton" style={{ width: '100px', height: '32px', borderRadius: '8px' }}></div>
          </div>
        </div>
        <div className="row g-4 flex-grow-1">
          {[1, 2, 3].map((n) => (
            <div key={n} className="col-md-4">
              <div className="card h-100 border-0 bg-light p-3">
                <div className="skeleton mb-3" style={{ width: '40%', height: '24px' }}></div>
                <div className="skeleton mb-2" style={{ width: '100%', height: '100px', borderRadius: '8px' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '100px', borderRadius: '8px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger d-inline-block">{error}</div>
        <div className="mt-3">
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Dashboard'a Dön
          </button>
        </div>
      </div>
    );
  }

  const isOwner = project?.created_by === user?.id;

  // Görevleri filtrele
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    const matchesAssignee =
      assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned' && !task.assigned_to) ||
      task.assigned_to == assigneeFilter;

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  return (
    <div className="container-fluid px-0 h-100 d-flex flex-column">
      {/* Toast Bildirimi */}
      {toast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div
            className={`alert alert-${toast.type} alert-dismissible shadow-lg border-0 fade show`}
            role="alert"
            style={{ borderRadius: '12px', fontSize: '14px', minWidth: '280px' }}
          >
            {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
          </div>
        </div>
      )}

      {/* Görev Silme Onay Dialogu */}
      <ConfirmDialog
        show={!!confirmDeleteTask}
        title="Görevi Sil"
        message="Bu görevi kalıcı olarak silmek istediğinize emin misiniz?"
        confirmText="Evet, Sil"
        onConfirm={() => handleDeleteTask(confirmDeleteTask)}
        onCancel={() => setConfirmDeleteTask(null)}
      />

      {/* Proje Düzenleme Modalı */}
      {showProjectEdit && (
        <>
          <div
            className="modal-backdrop show"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowProjectEdit(false)}
          />
          <div className="modal d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--custom-primary), var(--custom-secondary))' }} />
                <div className="modal-header border-0 pb-0 px-4 pt-4">
                  <h5 className="modal-title fw-bold" style={{ color: 'var(--custom-text)' }}>✏️ Projeyi Düzenle</h5>
                  <button type="button" className="btn-close" onClick={() => setShowProjectEdit(false)} />
                </div>
                <form onSubmit={handleSaveProjectEdit}>
                  <div className="modal-body px-4 py-3">
                    {editProjectError && (
                      <div className="alert alert-danger py-2" style={{ fontSize: '13px', borderRadius: '8px' }}>
                        ⚠️ {editProjectError}
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
                    <button type="button" className="btn btn-light fw-medium" onClick={() => setShowProjectEdit(false)}>İptal</button>
                    <button type="submit" className="btn btn-primary fw-medium">Kaydet</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sayfa Başlığı */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-3 mb-3 mb-md-0">
          <button
            className="btn btn-light btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center"
            style={{ width: 36, height: 36 }}
            onClick={() => navigate('/dashboard')}
            title="Geri Dön"
          >
            ←
          </button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '1.8rem' }}>{project?.emoji || '📁'}</span>
              <h3 className="fw-bold mb-0" style={{ color: project?.color || 'var(--custom-text)', letterSpacing: '-0.5px' }}>
                {project?.name}
              </h3>
              {isOwner && (
                <button
                  className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 28, height: 28, fontSize: '12px' }}
                  onClick={handleStartProjectEdit}
                  title="Projeyi Düzenle"
                >
                  ✏️
                </button>
              )}
            </div>
            {project?.description && (
              <small className="text-muted">{project.description}</small>
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Üye Avatarları */}
          <div className="d-flex align-items-center">
            {members.slice(0, 4).map((m, i) => (
              <div
                key={m.user_id}
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold border border-2 border-white"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: ['#6366F1', '#A5B4FC', '#FCA5A5', '#10B981'][i % 4],
                  color: 'white',
                  fontSize: '11px',
                  marginLeft: i > 0 ? '-8px' : '0',
                  zIndex: 4 - i,
                  position: 'relative',
                }}
                title={`${m.username} (${m.role === 'owner' ? 'Sahip' : 'Üye'})`}
              >
                {m.username.substring(0, 2).toUpperCase()}
              </div>
            ))}
            {members.length > 4 && (
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold border border-2 border-white bg-light text-muted"
                style={{ width: 32, height: 32, fontSize: '11px', marginLeft: '-8px', zIndex: 0, position: 'relative' }}
              >
                +{members.length - 4}
              </div>
            )}
          </div>

          {isOwner && (
            <button
              className="btn btn-light btn-sm fw-medium shadow-sm"
              onClick={() => setShowMemberForm(!showMemberForm)}
            >
              👥 Üye {showMemberForm ? '✕' : 'Ekle'}
            </button>
          )}

          {/* Aktivite Butonu */}
          <button
            className={`btn btn-sm fw-medium shadow-sm ${showActivity ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setShowActivity(!showActivity)}
          >
            📋 Aktivite {showActivity ? 'Gizle' : 'Göster'}
          </button>

          {/* Yeni görev butonu — sadece proje sahibi oluşturabilir */}
          {isOwner && (
            <button
              className="btn btn-primary fw-medium shadow-sm"
              onClick={() => {
                setEditingTask(null);
                setShowModal(true);
              }}
            >
              ➕ Yeni Görev
            </button>
          )}
        </div>
      </div>

      {/* Üye Ekleme Formu */}
      {showMemberForm && (
        <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: '12px' }}>
          <form onSubmit={handleAddMember} className="d-flex flex-column flex-md-row gap-2 align-items-md-end">
            <div className="flex-grow-1">
              <label className="form-label small fw-medium mb-1">E-posta ile Üye Ekle</label>
              <input
                type="email"
                className="form-control form-control-sm"
                placeholder="ornek@eposta.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm fw-medium">
              Ekle
            </button>
          </form>
          {memberError && (
            <div className="text-danger small mt-2">⚠️ {memberError}</div>
          )}

          {/* Mevcut üye listesi */}
          {members.length > 0 && (
            <div className="mt-3 pt-2 border-top">
              <small className="text-muted fw-medium d-block mb-2">Proje Üyeleri ({members.length})</small>
              <div className="d-flex flex-wrap gap-2">
                {members.map((m) => (
                  <span
                    key={m.user_id}
                    className="badge bg-light text-dark border d-flex align-items-center gap-1"
                    style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px' }}
                  >
                    {m.username}
                    <small className="text-muted">
                      ({m.role === 'owner' ? 'Sahip' : 'Üye'})
                    </small>
                    {m.role !== 'owner' && isOwner && (
                      <button
                        className="btn btn-sm p-0 ms-1 border-0 text-danger"
                        style={{ fontSize: '10px', lineHeight: 1 }}
                        onClick={() => handleRemoveMember(m.user_id)}
                        title="Üyeyi Çıkar"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bekleyen Katılım Talepleri */}
          {isOwner && joinRequests.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <small className="text-warning fw-semibold d-block mb-2">⏳ Bekleyen Katılım Talepleri ({joinRequests.length})</small>
              <div className="d-flex flex-column gap-2">
                {joinRequests.map((req) => (
                  <div key={req.id} className="d-flex align-items-center justify-content-between p-2 rounded bg-light border" style={{ fontSize: '13px' }}>
                    <div>
                      <strong>{req.username}</strong> <span className="text-muted">({req.email})</span>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-xs btn-success py-1 px-2 fw-semibold"
                        onClick={() => handleApproveRequest(req.id)}
                        style={{ fontSize: '11px', borderRadius: '6px' }}
                      >
                        ✓ Onayla
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-danger py-1 px-2 fw-semibold"
                        onClick={() => handleRejectRequest(req.id)}
                        style={{ fontSize: '11px', borderRadius: '6px' }}
                      >
                        ✕ Reddet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Proje İstatistikleri */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card p-3 border-0 shadow-sm d-flex flex-row align-items-center gap-3">
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-primary" style={{ width: '42px', height: '42px', fontSize: '1.2rem' }}>
              📋
            </div>
            <div>
              <span className="text-muted small d-block" style={{ fontSize: '11px' }}>Toplam Görev</span>
              <strong className="fs-5" style={{ color: 'var(--custom-text)' }}>{tasks.length}</strong>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 border-0 shadow-sm d-flex flex-row align-items-center gap-3">
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-warning" style={{ width: '42px', height: '42px', fontSize: '1.2rem' }}>
              ⚡
            </div>
            <div>
              <span className="text-muted small d-block" style={{ fontSize: '11px' }}>Devam Eden</span>
              <strong className="fs-5" style={{ color: 'var(--custom-text)' }}>{tasks.filter(t => t.status === 'in_progress').length}</strong>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 border-0 shadow-sm d-flex flex-row align-items-center gap-3">
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-success" style={{ width: '42px', height: '42px', fontSize: '1.2rem' }}>
              ✅
            </div>
            <div>
              <span className="text-muted small d-block" style={{ fontSize: '11px' }}>Tamamlanan</span>
              <strong className="fs-5" style={{ color: 'var(--custom-text)' }}>{tasks.filter(t => t.status === 'done').length}</strong>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 border-0 shadow-sm d-flex flex-row align-items-center gap-3">
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-info" style={{ width: '42px', height: '42px', fontSize: '1.2rem' }}>
              📈
            </div>
            <div className="flex-grow-1 min-w-0">
              <span className="text-muted small d-block" style={{ fontSize: '11px' }}>Tamamlanma</span>
              <div className="d-flex align-items-center gap-2">
                <strong className="fs-5" style={{ color: 'var(--custom-text)' }}>
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                </strong>
                <div className="progress flex-grow-1" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{
                      width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtreleme ve Arama Barı */}
      <div className="card p-3 border-0 shadow-sm mb-4 premium-filter-card">
        <div className="premium-filter-grid">
          {/* Arama */}
          <div className="premium-filter-search">
            <div className="input-group premium-input-group">
              <span className="input-group-text bg-light border-0">🔍</span>
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-light premium-filter-control"
                placeholder="Görevlerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Öncelik Filtresi */}
          <div className="premium-filter-field">
            <select
              className="form-select form-select-sm border-0 bg-light premium-filter-control"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="low">⬇️ Düşük</option>
              <option value="medium">➡️ Orta</option>
              <option value="high">⬆️ Yüksek</option>
              <option value="urgent">🔴 Acil</option>
            </select>
          </div>

          {/* Atanan Filtresi */}
          <div className="premium-filter-field">
            <select
              className="form-select form-select-sm border-0 bg-light premium-filter-control"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="all">Tüm Atananlar</option>
              <option value="unassigned">👤 Atanmamış</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  👤 {m.username}
                </option>
              ))}
            </select>
          </div>

          {/* Filtreleri Temizle */}
          {(searchQuery || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
            <div className="premium-filter-action text-md-end">
              <button
                className="btn btn-sm btn-link p-0 text-muted premium-clear-button"
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('all');
                  setAssigneeFilter('all');
                }}
                style={{ fontSize: '12px' }}
              >
                Temizle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout (Kanban Board + Activity Feed) */}
      <div className="row g-4 flex-grow-1 align-items-stretch">
        <div className={showActivity ? "col-md-9" : "col-md-12"}>
          {/* Kanban Board */}
          <KanbanBoard
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onEditTask={handleEditTask}
            onDeleteTask={requestDeleteTask}
          />
        </div>

        {/* Activity Timeline */}
        {showActivity && (
          <div className="col-md-3">
            <div className="card p-3 border-0 shadow-sm h-100" style={{ minHeight: '400px' }}>
              <ActivityTimeline projectId={projectId} />
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        editingTask={editingTask}
        members={members}
      />
    </div>
  );
};

export default BoardPage;
