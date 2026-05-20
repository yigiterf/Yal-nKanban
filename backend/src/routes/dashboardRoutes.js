const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

// Tüm rotalar JWT ile korunuyor
router.use(authMiddleware);

router.get('/stats', getDashboardStats);

module.exports = router;
