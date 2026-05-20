const Notification = require('../models/notificationModel');

// GET /api/notifications — Kullanıcının bildirimlerini listele
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      Notification.findByUser(userId, limit, offset),
      Notification.getUnreadCount(userId),
    ]);

    res.json({ notifications, unreadCount, page, limit });
  } catch (error) {
    console.error('getNotifications hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/notifications/unread-count — Okunmamış bildirim sayısı
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('getUnreadCount hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/notifications/:id/read — Bildirimi okundu yap
const markAsRead = async (req, res) => {
  try {
    const result = await Notification.markAsRead(req.params.id, req.user.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bildirim bulunamadı.' });
    }
    res.json({ message: 'Bildirim okundu olarak işaretlendi.' });
  } catch (error) {
    console.error('markAsRead hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/notifications/read-all — Tüm bildirimleri okundu yap
const markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);
    res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi.' });
  } catch (error) {
    console.error('markAllAsRead hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
