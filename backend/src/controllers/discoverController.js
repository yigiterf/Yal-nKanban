const pool = require('../config/db');
const ProjectMember = require('../models/projectMemberModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const JoinRequest = require('../models/joinRequestModel');

// GET /api/discover/projects — Kendi projelerim hariç HERKESİN projesini listele
// is_member: kullanıcı zaten üye mi (ama projeyi gizleme!)
// is_full: max_members doldu mu
const getDiscoverProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.search ? `%${req.query.search}%` : '%';

    // Mock veri kontrolü ve ekleme (Keşfet sayfasının boş kalmaması için)
    try {
      const [existingMock] = await pool.query("SELECT id FROM Users WHERE username = 'Deneme1'");
      let mockUserId;
      if (existingMock.length === 0) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('password123', 10);
        const [userResult] = await pool.query(
          "INSERT INTO Users (username, email, password_hash) VALUES ('Deneme1', 'deneme1@gmail.com', ?)",
          [hash]
        );
        mockUserId = userResult.insertId;
      } else {
        mockUserId = existingMock[0].id;
      }

      // Deneme1 kullanıcısı adına mock projeler oluştur (eğer yoksa)
      const [mockProjects] = await pool.query("SELECT id FROM Projects WHERE created_by = ?", [mockUserId]);
      if (mockProjects.length === 0) {
        // Proje 1
        const [p1] = await pool.query(
          "INSERT INTO Projects (name, description, created_by, color, emoji, max_members) VALUES ('Mobil Uygulama Geliştirme', 'Harika bir mobil uygulama arayüzü tasarımı ve kodlama projesi.', ?, '#8B5CF6', '📱', 5)",
          [mockUserId]
        );
        // Projeye Deneme1'i owner olarak ekle
        await pool.query(
          "INSERT INTO ProjectMembers (project_id, user_id, role) VALUES (?, ?, 'owner')",
          [p1.insertId, mockUserId]
        );

        // Proje 2
        const [p2] = await pool.query(
          "INSERT INTO Projects (name, description, created_by, color, emoji, max_members) VALUES ('Yapay Zeka Destekli Sohbet Robotu', 'LLM modelleri entegrasyonu ve sohbet arayüzü geliştirme çalışması.', ?, '#10B981', '🤖', 3)",
          [mockUserId]
        );
        await pool.query(
          "INSERT INTO ProjectMembers (project_id, user_id, role) VALUES (?, ?, 'owner')",
          [p2.insertId, mockUserId]
        );
      }
    } catch (mockErr) {
      console.error('Mock veri ekleme hatası:', mockErr);
    }

    // NOT: safe SQL query for OFFSET/LIMIT
    const [rows] = await pool.query(
      `SELECT 
         p.id, p.name, p.description, p.color, p.emoji, p.created_at,
         p.max_members,
         u.username AS owner_name,
         COUNT(DISTINCT pm2.user_id) AS member_count,
         COUNT(DISTINCT t.id) AS task_count,
         COALESCE(SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END), 0) AS done_count,
         COALESCE(SUM(CASE WHEN t.assigned_to IS NULL AND t.status != 'done' THEN 1 ELSE 0 END), 0) AS open_task_count,
         MAX(CASE WHEN pm_me.user_id = ? THEN 1 ELSE 0 END) AS is_member,
         MAX(jr_me.status) AS join_request_status
       FROM Projects p
       INNER JOIN Users u ON p.created_by = u.id
       LEFT JOIN ProjectMembers pm2 ON pm2.project_id = p.id
       LEFT JOIN ProjectMembers pm_me ON pm_me.project_id = p.id AND pm_me.user_id = ?
       LEFT JOIN JoinRequests jr_me ON jr_me.project_id = p.id AND jr_me.user_id = ?
       LEFT JOIN Tasks t ON t.project_id = p.id
       WHERE p.created_by != ?
         AND (p.name LIKE ? OR p.description LIKE ? OR u.username LIKE ?)
       GROUP BY p.id, p.name, p.description, p.color, p.emoji, p.created_at, p.max_members, u.username
       ORDER BY open_task_count DESC, p.created_at DESC
       LIMIT 30`,
      [userId, userId, userId, userId, search, search, search]
    );

    // is_full hesapla
    const result = rows.map(p => ({
      ...p,
      is_member: !!p.is_member,
      is_full: p.max_members !== null && p.member_count >= p.max_members,
      join_request_status: p.join_request_status || null,
    }));

    res.json(result);
  } catch (error) {
    console.error('getDiscoverProjects hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/discover/projects/:id — Proje detayı (okuma amaçlı)
const getDiscoverProjectDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [projects] = await pool.execute(
      `SELECT p.*, u.username AS owner_name
       FROM Projects p
       INNER JOIN Users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }

    const project = projects[0];

    // Görevleri getir
    const [tasks] = await pool.execute(
      `SELECT t.*, u.username AS assigned_username
       FROM Tasks t
       LEFT JOIN Users u ON t.assigned_to = u.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [id]
    );

    // Üyeleri getir
    const members = await ProjectMember.findByProject(id);

    // Kullanıcı zaten üye mi?
    const isMember = await ProjectMember.isMember(id, userId);

    // Katılım talebi durumu var mı?
    const joinRequestStatus = await JoinRequest.getUserRequestStatus(id, userId);

    // Kapasite dolu mu?
    const isFull = project.max_members !== null && members.length >= project.max_members;

    res.json({ project, tasks: isMember ? tasks : [], members, isMember, isFull, joinRequestStatus });
  } catch (error) {
    console.error('getDiscoverProjectDetail hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/discover/projects/:id/join — Projeye katılma isteği gönder
const joinProject = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;

    // Zaten üye mi?
    const isMember = await ProjectMember.isMember(projectId, userId);
    if (isMember) {
      return res.status(400).json({ message: 'Zaten bu projenin üyesisiniz.' });
    }

    // Kapasite kontrolü
    const [projects] = await pool.execute(
      'SELECT name, max_members, created_by FROM Projects WHERE id = ?',
      [projectId]
    );
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }
    const project = projects[0];

    if (project.max_members !== null) {
      const members = await ProjectMember.findByProject(projectId);
      if (members.length >= project.max_members) {
        return res.status(400).json({ message: 'Bu projenin kontenjanı dolmuştur. Proje sahibinin kontenjanı artırmasını bekleyin.' });
      }
    }

    // Bekleyen veya reddedilen talepleri kontrol et
    const existingRequest = await JoinRequest.findExisting(projectId, userId);
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'Zaten bekleyen bir katılım talebiniz bulunuyor.' });
      } else if (existingRequest.status === 'rejected') {
        // Reddedilmişse eski kaydı silerek yeniden talep oluşturabilmesini sağlayalım
        await JoinRequest.deleteRejected(projectId, userId);
      }
    }

    const joiningUser = await User.findById(userId);

    // Yeni talep oluştur
    const insertRes = await JoinRequest.create(projectId, userId);
    const requestId = insertRes.insertId;

    // Proje sahibine bildirim gönder (kendisi değilse)
    if (project.created_by !== userId) {
      await Notification.create(
        project.created_by,
        'member_added',
        `${joiningUser.username}, "${project.name}" projesine katılmak istiyor.`,
        `/board/${projectId}`,
        requestId
      );
    }

    res.status(201).json({ message: 'Katılım talebiniz proje sahibine iletildi.' });
  } catch (error) {
    console.error('joinProject hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/discover/tasks/:taskId/claim — Görevi üstlen
const claimTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const [tasks] = await pool.execute(
      'SELECT id, project_id, assigned_to, status FROM Tasks WHERE id = ?',
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }

    const task = tasks[0];

    // Üyelik kontrolü - sadece projenin üyeleri görev üstlenebilir
    const isMember = await ProjectMember.isMember(task.project_id, userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projenin üyesi değilsiniz. Görevi üstlenmek için önce projeye katılmalısınız.' });
    }

    if (task.status === 'done') {
      return res.status(400).json({ message: 'Tamamlanmış görev üstlenilemez.' });
    }

    if (task.assigned_to === userId) {
      return res.status(400).json({ message: 'Bu görev zaten size atanmış.' });
    }

    // Görevi kullanıcıya ata
    await pool.execute(
      'UPDATE Tasks SET assigned_to = ? WHERE id = ?',
      [userId, taskId]
    );

    // Otomatik üyelik mantığı kaldırıldı (artık sadece üyeler görev üstlenebilir)

    // Görevi üstlenen kullanıcıya onay bildirimi
    const [taskRows] = await pool.execute(
      'SELECT t.title, p.name AS project_name, p.created_by FROM Tasks t JOIN Projects p ON t.project_id = p.id WHERE t.id = ?',
      [taskId]
    );
    if (taskRows.length > 0) {
      const taskInfo = taskRows[0];
      const claimingUser = await User.findById(userId);

      await Notification.create(
        userId,
        'task_claimed',
        `"${taskInfo.title}" görevini başarıyla üstlendiniz.`,
        `/board/${task.project_id}`
      );

      // Proje sahibine bildirim gönder (kendisi değilse)
      if (taskInfo.created_by !== userId) {
        await Notification.create(
          taskInfo.created_by,
          'task_claimed_owner',
          `${claimingUser.username} "${taskInfo.title}" görevini üstlendi.`,
          `/board/${task.project_id}`
        );
      }
    }

    res.json({ message: 'Görev başarıyla üstlenildi.' });
  } catch (error) {
    console.error('claimTask hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  getDiscoverProjects,
  getDiscoverProjectDetail,
  joinProject,
  claimTask,
};
