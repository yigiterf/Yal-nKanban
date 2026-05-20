import React from 'react';
import TaskCard from './TaskCard';

const columns = [
  { key: 'todo',        title: 'Yapılacak',     icon: '📋', color: '#64748b' },
  { key: 'in_progress', title: 'Devam Ediyor',  icon: '🔄', color: '#3b82f6' },
  { key: 'done',        title: 'Tamamlandı',    icon: '✅', color: '#22c55e' },
];

const KanbanBoard = ({ tasks, onStatusChange, onEditTask, onDeleteTask }) => {
  return (
    <div className="row g-4">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.key);

        return (
          <div className="col-md-4" key={col.key}>
            <div
              className="rounded-3 p-3 h-100"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px dashed #e2e8f0',
                minHeight: '300px',
              }}
            >
              {/* Kolon Başlığı */}
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <span>{col.icon}</span>
                  <h6 className="fw-semibold mb-0" style={{ color: col.color, fontSize: '14px' }}>
                    {col.title}
                  </h6>
                </div>
                <span
                  className="badge rounded-pill"
                  style={{
                    backgroundColor: col.color + '15',
                    color: col.color,
                    fontSize: '12px',
                  }}
                >
                  {columnTasks.length}
                </span>
              </div>

              {/* Görev Kartları */}
              <div
                className="d-flex flex-column gap-2"
                style={{ minHeight: '200px' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('taskId');
                  if (taskId) {
                    onStatusChange(parseInt(taskId), col.key);
                  }
                }}
              >
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('taskId', task.id.toString());
                    }}
                  >
                    <TaskCard
                      task={task}
                      onStatusChange={onStatusChange}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                    />
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center text-muted py-4" style={{ fontSize: '13px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>
                      {col.icon}
                    </div>
                    Bu kolonda görev yok
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
