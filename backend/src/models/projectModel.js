const pool = require('../config/db');

const Project = {
  // Yeni proje oluştur
  create: async (name, description, userId) => {
    const [result] = await pool.execute(
      'INSERT INTO Projects (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, userId]
    );
    return result;
  },

  // Kullanıcının üyesi olduğu tüm projeleri getir (kendi oluşturduğu + eklendiği)
  findAllByUser: async (userId) => {
    const [rows] = await pool.execute(
      `SELECT p.*, pm.role,
              (SELECT COUNT(*) FROM Tasks t WHERE t.project_id = p.id) AS task_count
       FROM Projects p
       INNER JOIN ProjectMembers pm ON p.id = pm.project_id
       WHERE pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return rows;
  },

  // Tek projeyi ID ile getir
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM Projects WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Projeyi güncelle (sadece sahibi güncelleyebilir)
  update: async (id, name, description, userId) => {
    const [result] = await pool.execute(
      'UPDATE Projects SET name = ?, description = ? WHERE id = ? AND created_by = ?',
      [name, description, id, userId]
    );
    return result;
  },

  // Projeyi sil (sadece sahibi silebilir)
  delete: async (id, userId) => {
    const [result] = await pool.execute(
      'DELETE FROM Projects WHERE id = ? AND created_by = ?',
      [id, userId]
    );
    return result;
  },
};

module.exports = Project;
