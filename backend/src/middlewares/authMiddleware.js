const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Yetkilendirme reddedildi. Token gerekli.' });
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET is not set in environment variables!');
    return res.status(500).json({ message: 'Sunucu yapılandırma hatası.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // controller'larda req.user olarak erişilebilir
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.' });
    }
    res.status(401).json({ message: 'Token geçersiz.' });
  }
};

module.exports = authMiddleware;

