import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [requestStatuses, setRequestStatuses] = useState({});
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // ─── İkon & Renk Haritası (tüm tipler) ───
  const typeConfig = {
    task_assigned:      { icon: '📋', color: '#6366f1', label: 'Görev Ataması' },
    task_claimed:       { icon: '✅', color: '#22c55e', label: 'Görev Üstlendi' },
    task_claimed_owner: { icon: '🙋', color: '#3b82f6', label: 'Görev Üstlenildi' },
    comment_added:      { icon: '💬', color: '#f59e0b', label: 'Yeni Yorum' },
    due_date_warning:   { icon: '⏰', color: '#ef4444', label: 'Son Tarih Uyarısı' },
    member_added:       { icon: '📨', color: '#8b5cf6', label: 'Proje Daveti' },
    member_joined:      { icon: '🎉', color: '#10b981', label: 'Yeni Üye' },
    member_removed:     { icon: '🚪', color: '#ef4444', label: 'Üyelik Sona Erdi' },
    project_joined:     { icon: '🚀', color: '#6366f1', label: 'Projeye Katıldınız' },
  };

  const getConfig = (type) => typeConfig[type] || { icon: '📌', color: '#64748b', label: 'Bildirim' };

  // ─── API Çağrıları ───
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      // sessiz hata — token yoksa 401 alınır, ignore
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await api.get('/notifications?limit=15');
      const list = Array.isArray(res.data.notifications) ? res.data.notifications : [];
      setNotifications(list);
      setUnreadCount(parseInt(res.data.unreadCount) || 0);
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  // 30 sn'de bir okunmamış sayısını güncelle
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── İşlem Fonksiyonları ───
  const handleToggle = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Bildirim okundu yapılamadı:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Bildirimler okundu yapılamadı:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Bildirim silinemedi:', err);
    }
  };

  const resolveRequestId = async (n) => {
    if (n.related_id) return n.related_id;
    const projectId = n.link ? n.link.split('/').pop() : null;
    if (!projectId) return null;
    try {
      const res = await api.get(`/projects/${projectId}/join-requests`);
      const username = n.message.split(',')[0].trim();
      const list = Array.isArray(res.data) ? res.data : (res.data.requests || []);
      const pending = list.find(r => r.username === username && r.status === 'pending');
      return pending ? pending.id : null;
    } catch (err) {
      console.error('resolveRequestId hatası:', err);
      return null;
    }
  };

  const handleApproveRequestDirectly = async (n) => {
    const projectId = n.link ? n.link.split('/').pop() : null;
    if (!projectId) return;
    const reqId = await resolveRequestId(n);
    if (!reqId) return alert('İlgili katılım talebi bulunamadı veya zaten işlenmiş.');
    
    try {
      await api.post(`/projects/${projectId}/join-requests/${reqId}/approve`);
      setRequestStatuses((prev) => ({ ...prev, [n.id]: 'approved' }));
      // Mark as read
      await api.patch(`/notifications/${n.id}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('projects-changed'));
    } catch (err) {
      alert(err.response?.data?.message || 'Katılım talebi onaylanırken bir hata oluştu.');
    }
  };

  const handleRejectRequestDirectly = async (n) => {
    const projectId = n.link ? n.link.split('/').pop() : null;
    if (!projectId) return;
    const reqId = await resolveRequestId(n);
    if (!reqId) return alert('İlgili katılım talebi bulunamadı veya zaten işlenmiş.');
    
    try {
      await api.post(`/projects/${projectId}/join-requests/${reqId}/reject`);
      setRequestStatuses((prev) => ({ ...prev, [n.id]: 'rejected' }));
      // Mark as read
      await api.patch(`/notifications/${n.id}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.response?.data?.message || 'Katılım talebi reddedilirken bir hata oluştu.');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) handleMarkAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  // ─── Zaman Formatı ───
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1)  return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays < 7)  return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* ─── Bildirim Butonu ─── */}
      <button
        id="notification-bell-btn"
        className="btn btn-light w-100 fw-medium d-flex align-items-center justify-content-center gap-2 position-relative"
        style={{ fontSize: '14px' }}
        onClick={handleToggle}
      >
        <span>🔔</span>
        <span>Bildirimler</span>
        {unreadCount > 0 && (
          <span
            className="position-absolute badge rounded-pill bg-danger"
            style={{
              top: '4px',
              right: '8px',
              fontSize: '10px',
              padding: '3px 6px',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ─── Dropdown Panel ─── */}
      {isOpen && (
        <div
          className="position-absolute shadow-lg border-0 rounded-4"
          style={{
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: '8px',
            maxHeight: '420px',
            overflowY: 'auto',
            zIndex: 1060,
            animation: 'modalPop 0.2s ease-out',
            backgroundColor: 'var(--surface-card, #fff)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div
            className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom"
            style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface-card, #fff)', zIndex: 1 }}
          >
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '14px' }}>🔔</span>
              <h6 className="fw-bold mb-0" style={{ fontSize: '13px', color: 'var(--custom-text)' }}>
                Bildirimler
              </h6>
              {unreadCount > 0 && (
                <span className="badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                className="btn btn-sm rounded-pill px-2 py-1"
                style={{ fontSize: '11px', backgroundColor: 'rgba(99,102,241,0.08)', color: 'var(--custom-primary)' }}
                onClick={handleMarkAllAsRead}
              >
                Tümünü oku
              </button>
            )}
          </div>

          {/* İçerik */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-muted" />
            </div>
          ) : fetchError ? (
            <div className="text-center py-4 px-3">
              <div style={{ fontSize: '28px', opacity: 0.4 }}>⚠️</div>
              <p className="text-muted small mb-2 mt-1">Bildirimler yüklenemedi</p>
              <button
                className="btn btn-sm btn-light rounded-pill px-3"
                style={{ fontSize: '12px' }}
                onClick={fetchNotifications}
              >
                🔄 Tekrar dene
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '36px', opacity: 0.2 }}>🔔</div>
              <p className="text-muted small mb-0 mt-2">Henüz bildirim yok</p>
            </div>
          ) : (
            <div className="d-flex flex-column">
              {notifications.map((n) => {
                const cfg = getConfig(n.type);
                return (
                  <div
                    key={n.id}
                    className="d-flex align-items-start gap-2 px-3 py-2 border-bottom notification-item"
                    style={{
                      backgroundColor: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.04)',
                      cursor: n.link ? 'pointer' : 'default',
                      transition: 'background-color 0.15s ease',
                    }}
                    onClick={() => handleNotificationClick(n)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.04)'; }}
                  >
                    {/* İkon */}
                    <div
                      className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-3 mt-1"
                      style={{
                        width: 34,
                        height: 34,
                        backgroundColor: cfg.color + '15',
                        fontSize: '16px',
                      }}
                    >
                      {cfg.icon}
                    </div>

                    {/* Metin */}
                    <div className="flex-grow-1 min-w-0">
                      <p
                        className="mb-0"
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--custom-text)',
                          fontWeight: n.is_read ? 400 : 600,
                          lineHeight: '1.45',
                        }}
                      >
                        {n.message}
                      </p>
                       <div className="d-flex align-items-center gap-2 mt-1">
                        <span
                          className="rounded-pill px-2 py-0"
                          style={{
                            fontSize: '10px',
                            backgroundColor: cfg.color + '15',
                            color: cfg.color,
                            fontWeight: 500,
                          }}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-muted" style={{ fontSize: '10.5px' }}>
                          {formatDate(n.created_at)}
                        </span>
                      </div>
                      
                      {n.type === 'member_added' && (
                        <div className="d-flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          {requestStatuses[n.id] ? (
                            <span 
                              className={`badge ${requestStatuses[n.id] === 'approved' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} border px-2 py-1`}
                              style={{ fontSize: '11px', borderRadius: '6px' }}
                            >
                              {requestStatuses[n.id] === 'approved' ? '✓ Onaylandı' : '✕ Reddedildi'}
                            </span>
                          ) : (
                            <>
                              <button
                                className="btn btn-xs btn-success px-2 py-1 fw-semibold d-flex align-items-center gap-1"
                                style={{ fontSize: '11px', borderRadius: '6px', border: 'none' }}
                                onClick={() => handleApproveRequestDirectly(n)}
                              >
                                ✓ Onayla
                              </button>
                              <button
                                className="btn btn-xs btn-outline-danger px-2 py-1 fw-semibold d-flex align-items-center gap-1"
                                style={{ fontSize: '11px', borderRadius: '6px' }}
                                onClick={() => handleRejectRequestDirectly(n)}

                              >
                                ✕ Reddet
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sağ taraf: okunmadı noktası + sil butonu */}
                    <div className="d-flex flex-column align-items-center gap-1 flex-shrink-0">
                      {!n.is_read && (
                        <div
                          className="rounded-circle"
                          style={{ width: 7, height: 7, backgroundColor: 'var(--custom-primary)', marginTop: '6px' }}
                        />
                      )}
                      <button
                        className="btn p-0 border-0 text-muted notification-delete-btn"
                        style={{ fontSize: '13px', lineHeight: 1, opacity: 0.4, transition: 'opacity 0.15s' }}
                        title="Bildirimi sil"
                        onClick={(e) => handleDelete(n.id, e)}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
