const pool = require('../config/db');

const Notification = {
  // Bildirim oluştur
  create: async (userId, type, message, link = null) => {
    const [result] = await pool.execute(
      'INSERT INTO Notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)',
      [userId, type, message, link]
    );
    return result;
  },

  // Kullanıcının bildirimlerini getir
  findByUser: async (userId, limit = 20, offset = 0) => {
    const [rows] = await pool.execute(
      `SELECT * FROM Notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  },

  // Okunmamış bildirim sayısı
  getUnreadCount: async (userId) => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM Notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0].count;
  },

  // Tek bildirimi okundu yap
  markAsRead: async (id, userId) => {
    const [result] = await pool.execute(
      'UPDATE Notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result;
  },

  // Tüm bildirimleri okundu yap
  markAllAsRead: async (userId) => {
    const [result] = await pool.execute(
      'UPDATE Notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result;
  },
};

module.exports = Notification;
