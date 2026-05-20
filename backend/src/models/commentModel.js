const pool = require('../config/db');

const Comment = {
  // Yeni yorum oluştur
  create: async (taskId, userId, content) => {
    const [result] = await pool.execute(
      'INSERT INTO Comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskId, userId, content]
    );
    return result;
  },

  // Göreve ait tüm yorumları getir (yazar bilgisiyle)
  findByTask: async (taskId) => {
    const [rows] = await pool.execute(
      `SELECT c.id, c.content, c.created_at, c.user_id,
              u.username, u.email
       FROM Comments c
       JOIN Users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    return rows;
  },

  // Tek yorumu getir
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM Comments WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Yorum sil
  delete: async (id) => {
    const [result] = await pool.execute(
      'DELETE FROM Comments WHERE id = ?',
      [id]
    );
    return result;
  },

  // Görevin yorum sayısını getir
  countByTask: async (taskId) => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM Comments WHERE task_id = ?',
      [taskId]
    );
    return rows[0].count;
  },
};

module.exports = Comment;
