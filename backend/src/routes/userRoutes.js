const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { changePasswordValidation } = require('../middlewares/validationMiddleware');
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');

// Tüm rotalar JWT ile korunuyor
router.use(authMiddleware);

router.get('/me', getProfile);                             // Profil bilgileri
router.patch('/me', updateProfile);                        // Profil güncelle
router.patch('/me/password', changePasswordValidation, changePassword); // Şifre değiştir

module.exports = router;
