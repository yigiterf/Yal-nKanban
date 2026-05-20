const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// GET /api/users/me — Kullanıcı profil bilgilerini getir
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Şifre hash'ini döndürme
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('getProfile hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/users/me — Profil güncelle (username)
const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
    }

    await User.updateUsername(req.user.id, username.trim());
    res.json({ message: 'Profil güncellendi.', username: username.trim() });
  } catch (error) {
    console.error('updateProfile hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/users/me/password — Şifre değiştir
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Mevcut şifreyi doğrula
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış.' });
    }

    // Yeni şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await User.updatePassword(req.user.id, newHash);
    res.json({ message: 'Şifre başarıyla değiştirildi.' });
  } catch (error) {
    console.error('changePassword hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
