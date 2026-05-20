const { body, param, validationResult } = require('express-validator');

/**
 * Validasyon sonuçlarını kontrol eder.
 * Hata varsa 400 döner, yoksa next() çağırır.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ message: messages[0], errors: messages });
  }
  next();
};

// ─── Auth Validasyonları ───

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Kullanıcı adı 3–50 karakter arasında olmalıdır.'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz.'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır.')
    .matches(/\d/)
    .withMessage('Şifre en az bir rakam içermelidir.'),
  validate,
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz.'),
  body('password')
    .notEmpty()
    .withMessage('Şifre boş bırakılamaz.'),
  validate,
];

// ─── Proje Validasyonları ───

const projectValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Proje adı 2–100 karakter arasında olmalıdır.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Açıklama en fazla 500 karakter olabilir.'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Geçerli bir hex renk kodu giriniz.'),
  body('emoji')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Emoji değeri çok uzun.'),
  validate,
];

// ─── Görev Validasyonları ───

const taskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Görev başlığı 1–150 karakter arasında olmalıdır.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Açıklama en fazla 2000 karakter olabilir.'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Geçersiz öncelik değeri.'),
  body('tags')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Etiketler en fazla 255 karakter olabilir.'),
  body('estimatePoints')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 100 })
    .withMessage('Tahmin puanı 0–100 arasında bir tam sayı olmalıdır.'),
  validate,
];

const taskStatusValidation = [
  body('status')
    .isIn(['todo', 'in_progress', 'done'])
    .withMessage('Geçersiz durum. Geçerli değerler: todo, in_progress, done'),
  validate,
];

// ─── Üye Validasyonları ───

const memberEmailValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz.'),
  validate,
];

// ─── Yorum Validasyonları ───

const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Yorum 1–2000 karakter arasında olmalıdır.'),
  validate,
];

// ─── Şifre Değiştirme Validasyonu ───

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mevcut şifre gereklidir.'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Yeni şifre en az 6 karakter olmalıdır.')
    .matches(/\d/)
    .withMessage('Yeni şifre en az bir rakam içermelidir.'),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  projectValidation,
  taskValidation,
  taskStatusValidation,
  memberEmailValidation,
  commentValidation,
  changePasswordValidation,
};
