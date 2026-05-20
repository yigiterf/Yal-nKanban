const pool = require('../config/db');

const ActivityLog = {
  // Aktivite logu oluştur
  create: async (projectId, userId, action, targetType, targetId, details = null) => {
    const [result] = await pool.execute(
      'INSERT INTO ActivityLogs (project_id, user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [projectId, userId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
    return result;
  },

  // Projenin aktivite geçmişini getir (sayfalama ile)
  findByProject: async (projectId, limit = 20, offset = 0) => {
    const [rows] = await pool.execute(
      `SELECT a.id, a.action, a.target_type, a.target_id, a.details, a.created_at,
              u.username, u.email
       FROM ActivityLogs a
       JOIN Users u ON a.user_id = u.id
       WHERE a.project_id = ?
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [projectId, limit, offset]
    );
    return rows;
  },

  // Projenin toplam aktivite sayısı
  countByProject: async (projectId) => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM ActivityLogs WHERE project_id = ?',
      [projectId]
    );
    return rows[0].count;
  },
};

module.exports = ActivityLog;
