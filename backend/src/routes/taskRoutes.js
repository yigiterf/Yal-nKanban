const express = require('express');
const router = express.Router({ mergeParams: true }); // projectId için mergeParams
const authMiddleware = require('../middlewares/authMiddleware');
const {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  assignTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

// Tüm görev rotaları JWT ile korunuyor
router.use(authMiddleware);

// Proje kapsamlı rotalar (projectRoutes içinden mount edilecek)
router.post('/', createTask);           // Görev oluştur
router.get('/', getTasksByProject);     // Görevleri listele

module.exports = router;
