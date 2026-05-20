const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db');

// Rotaların içe aktarılması
const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/standaloneTaskRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Proje kapsamlı görev rotaları: /api/projects/:projectId/tasks
const projectTaskRoutes = require('./src/routes/taskRoutes');
app.use('/api/projects/:projectId/tasks', projectTaskRoutes);

// Test veritabanı bağlantısı ve otomatik migrasyonlar
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