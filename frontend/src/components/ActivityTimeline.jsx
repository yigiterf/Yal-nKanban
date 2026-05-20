import React, { useState, useEffect } from 'react';
import api from '../services/api';

const actionMessages = {
  task_created: (act) => (
    <>
      <strong>{act.username}</strong> yeni bir görev oluşturdu:{' '}
      <span className="text-primary">"{act.details?.taskTitle || act.target_id}"</span>
    </>
  ),
  status_changed: (act) => {
    const statusLabels = { todo: 'Yapılacak', in_progress: 'Devam Ediyor', done: 'Tamamlandı' };
    const oldLbl = statusLabels[act.details?.oldStatus] || act.details?.oldStatus;
    const newLbl = statusLabels[act.details?.newStatus] || act.details?.newStatus;
    return (
      <>
        <strong>{act.username}</strong>{' '}
        <span className="text-secondary">"{act.details?.taskTitle}"</span> görevinin durumunu değiştirdi:{' '}
        <span className="badge bg-light text-dark border">{oldLbl}</span> ➔{' '}
        <span className="badge bg-primary text-white">{newLbl}</span>
      </>
    );
  },
  task_assigned: (act) => (
    <>
      <strong>{act.username}</strong>{' '}
      <span className="text-secondary">"{act.details?.taskTitle}"</span> görevini atadı.
    </>
  ),
  task_deleted: (act) => (
    <>
      <strong>{act.username}</strong>{' '}
      <span className="text-danger">"{act.details?.taskTitle || 'Bilinmeyen Görev'}"</span> görevini sildi.
    </>
  ),
  comment_added: (act) => (
    <>
      <strong>{act.username}</strong>{' '}
      <span className="text-secondary">"{act.details?.taskTitle}"</span> görevine yorum ekledi.
    </>
  ),
  member_added: (act) => (
    <>
      <strong>{act.username}</strong> projeye yeni bir üye ekledi.
    </>
  ),
};

const actionIcons = {
  task_created: '➕',
  status_changed: '🔄',
  task_assigned: '👤',
  task_deleted: '🗑️',
  comment_added: '💬',
  member_added: '👥',
};

const ActivityTimeline = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = async (pageNum = 1, append = false) => {
    try {
      const res = await api.get(`/projects/${projectId}/activity?page=${pageNum}&limit=15`);
      const newActs = res.data.activities;
      
      // Parse details if string
      const parsedActs = newActs.map(act => {
        let details = act.details;
        if (typeof details === 'string') {
          try {
            details = JSON.parse(details);
          } catch (e) {
            details = null;
          }
        }
        return { ...act, details };
      });

      if (append) {
        setActivities((prev) => [...prev, ...parsedActs]);
      } else {
        setActivities(parsedActs);
      }

      if (parsedActs.length < 15) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error('Aktiviteler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      setActivities([]);
      setPage(1);
      setLoading(true);
      fetchActivities(1, false);
    }
  }, [projectId]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, true);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="d-flex flex-column h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0 text-dark">📋 Aktivite Geçmişi</h6>
        <button
          className="btn btn-sm btn-light py-1 px-2 border-0"
          style={{ fontSize: '11px' }}
          onClick={() => fetchActivities(1, false)}
          title="Yenile"
        >
          🔄 Yenile
        </button>
      </div>

      {loading && page === 1 ? (
        <div className="text-center py-5">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-5 text-muted small">
          Henüz bir aktivite gerçekleşmedi.
        </div>
      ) : (
        <div className="flex-grow-1 overflow-y-auto pe-1" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <div className="position-relative ps-3 border-start ms-2" style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}>
            {activities.map((act) => {
              const renderMsg = actionMessages[act.action] || ((a) => `İşlem gerçekleştirildi: ${a.action}`);
              const icon = actionIcons[act.action] || '📌';

              return (
                <div key={act.id} className="position-relative mb-4">
                  {/* Timeline Icon Node */}
                  <span
                    className="position-absolute d-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm border"
                    style={{
                      left: '-26px',
                      top: '0px',
                      width: '22px',
                      height: '22px',
                      fontSize: '11px',
                      zIndex: 2,
                    }}
                  >
                    {icon}
                  </span>

                  <div className="ms-2">
                    <p className="mb-1 text-dark" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                      {renderMsg(act)}
                    </p>
                    <span className="text-muted small d-block" style={{ fontSize: '10px' }}>
                      🕒 {formatDate(act.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button
              className="btn btn-sm btn-light w-100 fw-semibold py-2 mt-2"
              onClick={loadMore}
              disabled={loading}
              style={{ fontSize: '12px', borderRadius: '8px' }}
            >
              {loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
