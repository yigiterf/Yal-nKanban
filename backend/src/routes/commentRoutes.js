const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { commentValidation } = require('../middlewares/validationMiddleware');
const { createComment, getCommentsByTask, deleteComment } = require('../controllers/commentController');

// Tüm rotalar JWT ile korunuyor
router.use(authMiddleware);

// Görev kapsamlı yorumlar (standalone: /api/comments)
router.get('/task/:taskId', getCommentsByTask);         // Görevin yorumlarını listele
router.post('/task/:taskId', commentValidation, createComment);  // Yorum ekle
router.delete('/:id', deleteComment);                    // Yorum sil

module.exports = router;
