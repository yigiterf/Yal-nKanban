import React from 'react';

const statusConfig = {
  todo:        { label: 'Yapılacak',     bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  in_progress: { label: 'Devam Ediyor',  bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
  done:        { label: 'Tamamlandı',    bg: '#f0fdf4', color: '#22c55e', border: '#bbf7d0' },
};

const priorityConfig = {
  low:    { label: 'Düşük', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: '⬇️' },
  medium: { label: 'Orta', color: '#ca8a04', bg: '#fefce8', border: '#fef08a', icon: '➡️' },
  high:   { label: 'Yüksek', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', icon: '⬆️' },
  urgent: { label: 'Acil', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🔴' },
};

// Son tarihe göre renk/durum hesapla
const getDueDateStatus = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Geçti', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '🔴' };
  if (diffDays === 0) return { label: 'Bugün!', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', icon: '🟠' };
  if (diffDays <= 3) return { label: `${diffDays}g kaldı`, color: '#eab308', bg: '#fefce8', border: '#fef08a', icon: '🟡' };
  return { label: `${diffDays}g kaldı`, color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', icon: '🟢' };
};

const TaskCard = ({ task, onStatusChange, onEdit, onDelete, isPulsing }) => {
  const cfg = statusConfig[task.status] || statusConfig.todo;
  const dueDateStatus = getDueDateStatus(task.due_date);
  const prCfg = priorityConfig[task.priority] || priorityConfig.medium;
  const taskTags = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div
      className={`card mb-2 border-0 shadow-sm task-card-modern task-card-enter ${isPulsing ? 'done-pulse-highlight' : ''}`}
      style={{
        borderRadius: '12px',
        borderLeft: `4px solid ${cfg.color}`,
        cursor: 'grab',
      }}
    >
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="fw-semibold mb-0 d-flex align-items-center gap-1 text-wrap" style={{ color: 'var(--custom-text)', fontSize: '14px', flex: 1, marginRight: '8px' }}>
            {task.status === 'done' && (
              <span className="text-success checkmark-pop me-1" style={{ fontSize: '15px', fontWeight: 'bold' }}>
                ✓
              </span>
            )}
            <span style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.6 : 1 }}>
              {task.title}
            </span>
          </h6>
          {/* Aksiyon butonları */}
          <div className="dropdown">
            <button
              className="btn btn-sm p-0 border-0 bg-transparent"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ lineHeight: 1 }}
            >
              ⋮
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ fontSize: '13px' }}>
              <li>
                <button className="dropdown-item" onClick={() => onEdit && onEdit(task)}>
                  ✏️ Düzenle
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger" onClick={() => onDelete && onDelete(task.id)}>
                  🗑️ Sil
                </button>
              </li>
            </ul>
          </div>
        </div>

        {task.description && (
          <p className="text-muted mb-2" style={{ fontSize: '12px', lineHeight: '1.5' }}>
            {task.description.length > 80 ? task.description.substring(0, 80) + '...' : task.description}
          </p>
        )}

        {/* Öncelik rozeti */}
        {task.priority && task.priority !== 'medium' && (
          <span
            className="d-inline-flex align-items-center gap-1 mb-2 px-2 py-1 rounded-pill me-1"
            style={{
              backgroundColor: prCfg.bg,
              color: prCfg.color,
              border: `1px solid ${prCfg.border}`,
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            {prCfg.icon} {prCfg.label}
          </span>
        )}

        {/* Story Points */}
        {task.estimate_points != null && (
          <span
            className="d-inline-flex align-items-center gap-1 mb-2 px-2 py-1 rounded-pill me-1"
            style={{
              backgroundColor: '#f0f9ff',
              color: '#0284c7',
              border: '1px solid #bae6fd',
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            ⚡ {task.estimate_points} SP
          </span>
        )}

        {/* Etiketler */}
        {taskTags.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-2">
            {taskTags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="badge rounded-pill bg-light text-muted border"
                style={{ fontSize: '9px', padding: '3px 8px' }}
              >
                🏷️ {tag}
              </span>
            ))}
            {taskTags.length > 3 && (
              <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: '9px', padding: '3px 8px' }}>
                +{taskTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Son tarih göstergesi */}
        {dueDateStatus && (
          <div
            className="d-inline-flex align-items-center gap-1 mb-2 px-2 py-1 rounded-pill"
            style={{
              backgroundColor: dueDateStatus.bg,
              color: dueDateStatus.color,
              border: `1px solid ${dueDateStatus.border}`,
              fontSize: '11px',
              fontWeight: 500,
            }}
          >
            📅 {dueDateStatus.label}
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center">
          {/* Statü rozeti */}
          <span
            className="badge rounded-pill fw-medium"
            style={{
              backgroundColor: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              fontSize: '11px',
              padding: '4px 10px',
            }}
          >
            {cfg.label}
          </span>

          {/* Atanan kişi */}
          {task.assigned_username && (
            <span className="text-muted" style={{ fontSize: '11px' }}>
              👤 {task.assigned_username}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
