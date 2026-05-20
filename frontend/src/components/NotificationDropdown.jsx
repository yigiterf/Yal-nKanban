import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Okunmamış sayısını periyodik olarak kontrol et
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Bildirim sayısı alınamadı:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=10');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30 saniyede bir kontrol
    return () => clearInterval(interval);
  }, []);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
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

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) handleMarkAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const typeIcons = {
    task_assigned: '📋',
    comment_added: '💬',
    due_date_warning: '⏰',
    member_added: '👥',
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
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

      {isOpen && (
        <div
          className="position-absolute shadow-lg border-0 rounded-3 bg-white"
          style={{
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1060,
            animation: 'modalPop 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="fw-bold mb-0" style={{ fontSize: '14px', color: 'var(--custom-text)' }}>
              Bildirimler
            </h6>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-light rounded-pill px-2 py-1"
                style={{ fontSize: '11px' }}
                onClick={handleMarkAllAsRead}
              >
                Tümünü oku
              </button>
            )}
          </div>

          {/* Bildirim Listesi */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-muted" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4">
              <div style={{ fontSize: '32px', opacity: 0.3 }}>🔔</div>
              <p className="text-muted small mb-0">Bildirim yok</p>
            </div>
          ) : (
            <div className="d-flex flex-column">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="d-flex align-items-start gap-2 p-3 border-bottom"
                  style={{
                    backgroundColor: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.04)',
                    cursor: n.link ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease',
                  }}
                  onClick={() => handleNotificationClick(n)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.04)'; }}
                >
                  <span style={{ fontSize: '18px' }}>
                    {typeIcons[n.type] || '📌'}
                  </span>
                  <div className="flex-grow-1 min-w-0">
                    <p
                      className="mb-1"
                      style={{
                        fontSize: '13px',
                        color: 'var(--custom-text)',
                        fontWeight: n.is_read ? 400 : 600,
                        lineHeight: '1.4',
                      }}
                    >
                      {n.message}
                    </p>
                    <span className="text-muted" style={{ fontSize: '11px' }}>
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                  {!n.is_read && (
                    <div
                      className="rounded-circle flex-shrink-0 mt-1"
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: 'var(--custom-primary)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
