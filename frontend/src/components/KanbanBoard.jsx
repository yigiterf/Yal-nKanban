import React, { useState } from 'react';
import TaskCard from './TaskCard';

const columns = [
  { key: 'todo',        title: 'Yapılacak',     icon: '📋', color: '#64748b' },
  { key: 'in_progress', title: 'Devam Ediyor',  icon: '🔄', color: '#3b82f6' },
  { key: 'done',        title: 'Tamamlandı',    icon: '✅', color: '#22c55e' },
];

const KanbanBoard = ({ tasks, onStatusChange, onEditTask, onDeleteTask }) => {
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [pulsingTaskId, setPulsingTaskId] = useState(null);

  return (
    <div className="row g-4">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.key);
        const isOver = draggedOverColumn === col.key;

        return (
          <div className="col-md-4" key={col.key}>
            <div
              className={`kanban-column-surface rounded-4 p-3 h-100 transition-all ${isOver ? 'kanban-drop-active' : ''}`}
              style={{
                backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.4))',
                border: isOver ? '1px dashed var(--custom-primary)' : '1px solid rgba(0,0,0,0.03)',
                minHeight: '400px',
                backdropFilter: 'blur(10px)',
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDraggedOverColumn(col.key);
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDragLeave={() => {
                setDraggedOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDraggedOverColumn(null);
                const taskIdStr = e.dataTransfer.getData('taskId');
                if (taskIdStr) {
                  const taskId = parseInt(taskIdStr);
                  onStatusChange(taskId, col.key);
                  if (col.key === 'done') {
                    setPulsingTaskId(taskId);
                    setTimeout(() => setPulsingTaskId(null), 1000);
                  }
                }
              }}
            >
              {/* Kolon Başlığı */}
              <div className="kanban-column-header d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
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
                style={{ minHeight: '300px' }}
              >
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggingTaskId(task.id);
                      e.dataTransfer.setData('taskId', task.id.toString());
                    }}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                    }}
                    className={draggingTaskId === task.id ? 'task-dragging' : ''}
                  >
                    <TaskCard
                      task={task}
                      onStatusChange={onStatusChange}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      isPulsing={pulsingTaskId === task.id}
                    />
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="kanban-empty-state text-center text-muted py-5" style={{ fontSize: '13px' }}>
                    <div className="empty-state-icon" style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.3 }}>
                      {col.icon}
                    </div>
                    <div className="fw-semibold mb-1">Bu kolonda görev yok</div>
                    <div className="small">Görevleri buraya sürükleyebilirsiniz.</div>
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
