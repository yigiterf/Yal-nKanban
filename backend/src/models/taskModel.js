const pool = require('../config/db');

const Task = {
  // Projeye yeni görev ekle (due_date dahil)
  create: async (projectId, title, description, assignedTo, dueDate) => {
    const [result] = await pool.execute(
      'INSERT INTO Tasks (project_id, title, description, assigned_to, due_date) VALUES (?, ?, ?, ?, ?)',
      [projectId, title, description, assignedTo || null, dueDate || null]
    );
    return result;
  },

  // Projeye ait tüm görevleri getir (atanan kişi adıyla birlikte)
  findByProject: async (projectId) => {
    const [rows] = await pool.execute(
      `SELECT 
        t.id, t.title, t.description, t.status, t.assigned_to, t.due_date, t.created_at,
        u.username AS assigned_username
       FROM Tasks t
       LEFT JOIN Users u ON t.assigned_to = u.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [projectId]
    );
    return rows;
  },

  // Tek görevi ID ile getir
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM Tasks WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Görev durumunu güncelle (Kanban statü değişimi)
  updateStatus: async (id, status) => {
    const [result] = await pool.execute(
      'UPDATE Tasks SET status = ? WHERE id = ?',
      [status, id]
    );
    return result;
  },

  // Görevi kullanıcıya ata
  updateAssignee: async (id, userId) => {
    const [result] = await pool.execute(
      'UPDATE Tasks SET assigned_to = ? WHERE id = ?',
      [userId, id]
    );
    return result;
  },

  // Görev başlığı, açıklaması ve son tarihini güncelle
  update: async (id, title, description, dueDate) => {
    const [result] = await pool.execute(
      'UPDATE Tasks SET title = ?, description = ?, due_date = ? WHERE id = ?',
      [title, description, dueDate || null, id]
    );
    return result;
  },

  // Görevi sil
  delete: async (id) => {
    const [result] = await pool.execute(
      'DELETE FROM Tasks WHERE id = ?',
      [id]
    );
    return result;
  },

  // Kullanıcıya atanmış ve son tarihi yaklaşan görevleri getir (önümüzdeki 7 gün)
  findUpcomingByUser: async (userId) => {
    const [rows] = await pool.execute(
      `SELECT 
        t.id, t.title, t.description, t.status, t.due_date, t.project_id,
        p.name AS project_name,
        u.username AS assigned_username
       FROM Tasks t
       JOIN Projects p ON t.project_id = p.id
       LEFT JOIN Users u ON t.assigned_to = u.id
       WHERE t.assigned_to = ?
         AND t.status != 'done'
         AND t.due_date IS NOT NULL
         AND t.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY t.due_date ASC
       LIMIT 20`,
      [userId]
    );
    return rows;
  },
};

module.exports = Task;
