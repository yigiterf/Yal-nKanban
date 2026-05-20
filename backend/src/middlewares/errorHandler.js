/**
 * Özelleştirilmiş hata sınıfı — statusCode ve message ile.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Merkezi hata yakalama middleware'i.
 * Controller'larda next(error) veya throw new AppError() ile kullanılır.
 */
const errorHandler = (err, req, res, next) => {
  // Varsayılan değerler
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Sunucu hatası.';

  // express-validator hataları
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    message = err.array().map((e) => e.msg).join(', ');
  }

  // MySQL duplicate entry hatası
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Bu kayıt zaten mevcut.';
  }

  // JWT hataları
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Geçersiz token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token süresi dolmuş. Lütfen tekrar giriş yapın.';
  }

  // Geliştirme ortamında stack trace logla
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      statusCode,
      message,
      stack: err.stack,
    });
  } else {
    console.error('Error:', message);
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };
