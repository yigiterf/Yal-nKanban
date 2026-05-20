const pool = require('../config/db');

const ProjectMember = {
  // Proje oluşturulduğunda sahibini otomatik ekle
  addOwner: async (projectId, userId) => {
    const [result] = await pool.execute(
      'INSERT INTO ProjectMembers (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, userId, 'owner']
    );
    return result;
  },

  // Projeye üye ekle (e-posta ile)
  addMemberByEmail: async (projectId, email) => {
    // Kullanıcıyı e-posta ile bul
    const [users] = await pool.execute('SELECT id FROM Users WHERE email = ?', [email]);
    if (users.length === 0) return null;

    const userId = users[0].id;

    // Zaten üye mi kontrol et
    const [existing] = await pool.execute(
      'SELECT id FROM ProjectMembers WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    if (existing.length > 0) return { alreadyMember: true };

    const [result] = await pool.execute(
      'INSERT INTO ProjectMembers (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, userId, 'member']
    );
    return { ...result, userId };
  },

  // Projedeki tüm üyeleri getir
  findByProject: async (projectId) => {
    const [rows] = await pool.execute(
      `SELECT pm.id, pm.user_id, pm.role, pm.joined_at,
              u.username, u.email
       FROM ProjectMembers pm
       JOIN Users u ON pm.user_id = u.id
       WHERE pm.project_id = ?
       ORDER BY pm.role ASC, pm.joined_at ASC`,
      [projectId]
    );
    return rows;
  },

  // Üyeliği sil
  removeMember: async (projectId, userId) => {
    const [result] = await pool.execute(
      'DELETE FROM ProjectMembers WHERE project_id = ? AND user_id = ? AND role != ?',
      [projectId, userId, 'owner']
    );
    return result;
  },

  // Kullanıcının projeye erişimi var mı?
  isMember: async (projectId, userId) => {
    const [rows] = await pool.execute(
      'SELECT id FROM ProjectMembers WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    return rows.length > 0;
  },
};

module.exports = ProjectMember;
