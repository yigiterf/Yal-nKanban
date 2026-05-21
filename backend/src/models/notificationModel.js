const pool = require('../config/db');

const Notification = {
  // Bildirim oluştur
  create: async (userId, type, message, link = null, relatedId = null) => {
    const [result] = await pool.execute(
      'INSERT INTO Notifications (user_id, type, message, link, related_id) VALUES (?, ?, ?, ?, ?)',
      [userId, type, message, link, relatedId]
    );
    return result;
  },

  // Kullanıcının bildirimlerini getir
  // NOT: safeLimit ve safeOffset'i doğrudan query içine yerleştiriyoruz,
  // çünkü mysql2 LIMIT ? OFFSET ? ifadesini string olarak ('15' gibi tırnaklı) formatlıyor
  // ve bu MySQL tarafında syntax hatasına sebep oluyor.
  // safeLimit ve safeOffset parseInt ile sanitize edildiğinden SQL Injection riski yoktur.
  findByUser: async (userId, limit = 20, offset = 0) => {
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 20, 50));
    const safeOffset = Math.max(0, parseInt(offset) || 0);
    const safeUserId = parseInt(userId);

    const [rows] = await pool.query(
      `SELECT * FROM Notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [safeUserId]
    );
    return rows;
  },

  // Okunmamış bildirim sayısı
  getUnreadCount: async (userId) => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM Notifications WHERE user_id = ? AND is_read = FALSE',
      [parseInt(userId)]
    );
    return parseInt(rows[0].count);
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

  // Tek bildirimi sil (sadece kendi bildirimi)
  delete: async (id, userId) => {
    const [result] = await pool.execute(
      'DELETE FROM Notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result;
  },
};

// Removed debug script to prevent nodemon restart loop

module.exports = Notification;
