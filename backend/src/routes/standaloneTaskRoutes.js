const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  updateTaskStatus,
  assignTask,
  updateTask,
  deleteTask,
  getUpcomingTasks,
  getMyAssignedTasks,
} = require('../controllers/taskController');

// Tüm rotalar JWT ile korunuyor
router.use(authMiddleware);

router.get('/upcoming', getUpcomingTasks);           // Yaklaşan görevler (login kullanıcıya atanmış)
router.get('/assigned', getMyAssignedTasks);         // Tüm atanan görevler
router.patch('/:id/status', updateTaskStatus);       // Durum güncelle (Kanban)
router.patch('/:id/assign', assignTask);             // Atama yap
router.patch('/:id', updateTask);                    // Başlık/açıklama/due_date güncelle
router.delete('/:id', deleteTask);                   // Görevi sil

module.exports = router;
