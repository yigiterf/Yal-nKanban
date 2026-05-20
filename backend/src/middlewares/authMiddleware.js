const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Yetkilendirme reddedildi. Token gerekli.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret123');
    req.user = decoded; // controller'larda req.user olarak erişilebilir
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token geçersiz veya süresi dolmuş.' });
  }
};

module.exports = authMiddleware;
