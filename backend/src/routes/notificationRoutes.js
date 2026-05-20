const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

// Tüm rotalar JWT ile korunuyor
router.use(authMiddleware);

router.get('/', getNotifications);              // Bildirimleri listele
router.get('/unread-count', getUnreadCount);     // Okunmamış sayısı
router.patch('/read-all', markAllAsRead);         // Tümünü okundu yap
router.patch('/:id/read', markAsRead);           // Tek bildirimi okundu yap

module.exports = router;
