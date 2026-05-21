const pool = require('../config/db');

const JoinRequest = {
  // Katılım talebi oluştur
  create: async (projectId, userId) => {
    const [result] = await pool.execute(
      'INSERT INTO JoinRequests (project_id, user_id) VALUES (?, ?)',
      [projectId, userId]
    );
    return result;
  },

  // Bekleyen talep var mı?
  findPending: async (projectId, userId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM JoinRequests WHERE project_id = ? AND user_id = ? AND status = ?',
      [projectId, userId, 'pending']
    );
    return rows[0];
  },

  // Herhangi bir talep (pending/approved/rejected) var mı?
  findExisting: async (projectId, userId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM JoinRequests WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    return rows[0];
  },

  // ID ile talep bul (detaylı bilgi)
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT jr.*, u.username, u.email, p.name AS project_name, p.created_by
       FROM JoinRequests jr
       JOIN Users u ON jr.user_id = u.id
       JOIN Projects p ON jr.project_id = p.id
       WHERE jr.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Proje sahibinin bekleyen taleplerini listele
  findPendingByOwner: async (ownerId) => {
    const [rows] = await pool.execute(
      `SELECT jr.id, jr.project_id, jr.user_id, jr.status, jr.created_at,
              u.username, u.email,
              p.name AS project_name, p.emoji AS project_emoji, p.color AS project_color
       FROM JoinRequests jr
       JOIN Users u ON jr.user_id = u.id
       JOIN Projects p ON jr.project_id = p.id
       WHERE p.created_by = ? AND jr.status = 'pending'
       ORDER BY jr.created_at DESC`,
      [ownerId]
    );
    return rows;
  },

  // Talebi onayla
  approve: async (id) => {
    const [result] = await pool.execute(
      'UPDATE JoinRequests SET status = ?, resolved_at = NOW() WHERE id = ?',
      ['approved', id]
    );
    return result;
  },

  // Talebi reddet
  reject: async (id) => {
    const [result] = await pool.execute(
      'UPDATE JoinRequests SET status = ?, resolved_at = NOW() WHERE id = ?',
      ['rejected', id]
    );
    return result;
  },

  // Eski reddedilen talebi sil (tekrar başvuru yapılabilmesi için)
  deleteRejected: async (projectId, userId) => {
    const [result] = await pool.execute(
      'DELETE FROM JoinRequests WHERE project_id = ? AND user_id = ? AND status = ?',
      [projectId, userId, 'rejected']
    );
    return result;
  },

  // Kullanıcının belirli projedeki talep durumu
  getUserRequestStatus: async (projectId, userId) => {
    const [rows] = await pool.execute(
      'SELECT status FROM JoinRequests WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1',
      [projectId, userId]
    );
    return rows[0]?.status || null;
  },
};

module.exports = JoinRequest;
