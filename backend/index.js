const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./src/config/db');
const { errorHandler } = require('./src/middlewares/errorHandler');

// Rotaların içe aktarılması
const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/standaloneTaskRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// ─── Güvenlik Middleware'leri ───

// HTTP güvenlik header'ları
app.use(helmet());

// CORS — sadece frontend origin'ine izin ver
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request body boyut limiti
app.use(express.json({ limit: '1mb' }));

// Auth endpoint'leri için rate limiting (brute-force koruması)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 20, // Pencere başına maks istek
  message: { message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Genel API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 100, // Dakikada 100 istek
  message: { message: 'İstek limiti aşıldı. Lütfen biraz bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// ─── API Rotaları ───
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Proje kapsamlı görev rotaları: /api/projects/:projectId/tasks
const projectTaskRoutes = require('./src/routes/taskRoutes');
app.use('/api/projects/:projectId/tasks', projectTaskRoutes);

// ─── Merkezi Hata Yakalama ───
app.use(errorHandler);

// ─── Veritabanı Bağlantısı ve Migrasyonlar ───
const runMigrations = async (connection) => {
  console.log('Veritabanı migrasyonları kontrol ediliyor...');
  
  // Projects tablosu için yeni kolonlar
  try {
    await connection.query("ALTER TABLE Projects ADD COLUMN color VARCHAR(50) DEFAULT '#6366F1'");
    console.log('Projelere color kolonu eklendi.');
  } catch (err) {
    if (err.errno !== 1060) console.error('Projects color migrasyon hatası:', err);
  }

  try {
    await connection.query("ALTER TABLE Projects ADD COLUMN emoji VARCHAR(50) DEFAULT '📁'");
    console.log('Projelere emoji kolonu eklendi.');
  } catch (err) {
    if (err.errno !== 1060) console.error('Projects emoji migrasyon hatası:', err);
  }

  // Tasks tablosu için yeni kolonlar
  try {
    await connection.query("ALTER TABLE Tasks ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium'");
    console.log('Görevlere priority kolonu eklendi.');
  } catch (err) {
    if (err.errno !== 1060) console.error('Tasks priority migrasyon hatası:', err);
  }

  try {
    await connection.query("ALTER TABLE Tasks ADD COLUMN tags VARCHAR(255) DEFAULT ''");
    console.log('Görevlere tags kolonu eklendi.');
  } catch (err) {
    if (err.errno !== 1060) console.error('Tasks tags migrasyon hatası:', err);
  }

  try {
    await connection.query("ALTER TABLE Tasks ADD COLUMN estimate_points INT DEFAULT NULL");
    console.log('Görevlere estimate_points kolonu eklendi.');
  } catch (err) {
    if (err.errno !== 1060) console.error('Tasks estimate_points migrasyon hatası:', err);
  }

  // ─── Faz 2: Yeni Tablolar ───

  // Comments tablosu
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log('Comments tablosu hazır.');
  } catch (err) {
    console.error('Comments tablosu oluşturma hatası:', err);
  }

  // ActivityLogs tablosu
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ActivityLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        target_id INT,
        details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log('ActivityLogs tablosu hazır.');
  } catch (err) {
    console.error('ActivityLogs tablosu oluşturma hatası:', err);
  }

  // Notifications tablosu
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log('Notifications tablosu hazır.');
  } catch (err) {
    console.error('Notifications tablosu oluşturma hatası:', err);
  }

  // ─── İndeksler ───
  const indexes = [
    { sql: 'CREATE INDEX idx_tasks_project_id ON Tasks(project_id)', name: 'idx_tasks_project_id' },
    { sql: 'CREATE INDEX idx_tasks_assigned_to ON Tasks(assigned_to)', name: 'idx_tasks_assigned_to' },
    { sql: 'CREATE INDEX idx_tasks_status ON Tasks(status)', name: 'idx_tasks_status' },
    { sql: 'CREATE INDEX idx_pm_project_id ON ProjectMembers(project_id)', name: 'idx_pm_project_id' },
    { sql: 'CREATE INDEX idx_pm_user_id ON ProjectMembers(user_id)', name: 'idx_pm_user_id' },
    { sql: 'CREATE INDEX idx_comments_task_id ON Comments(task_id)', name: 'idx_comments_task_id' },
    { sql: 'CREATE INDEX idx_activity_project_id ON ActivityLogs(project_id)', name: 'idx_activity_project_id' },
    { sql: 'CREATE INDEX idx_notifications_user_id ON Notifications(user_id)', name: 'idx_notifications_user_id' },
  ];
  for (const idx of indexes) {
    try {
      await connection.query(idx.sql);
      console.log(`İndeks eklendi: ${idx.name}`);
    } catch (err) {
      // 1061 = Duplicate key name (indeks zaten var)
      if (err.errno !== 1061) console.error(`İndeks hatası (${idx.name}):`, err.message);
    }
  }

  console.log('Veritabanı migrasyonları tamamlandı.');
};

pool.getConnection()
  .then(async (connection) => {
    console.log('MySQL veritabanına başarıyla bağlanıldı.');
    await runMigrations(connection);
    connection.release();
    console.log('Veritabanı hazır.');
  })
  .catch((err) => {
    console.error('MySQL bağlantı hatası:', err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});