const pool = require('../config/db');
const ProjectMember = require('../models/projectMemberModel');

// GET /api/discover/projects — Kullanıcının üyesi OLMADIGI projeleri listele
const getDiscoverProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.search ? `%${req.query.search}%` : '%';

    const [rows] = await pool.execute(
      `SELECT 
         p.id, p.name, p.description, p.color, p.emoji, p.created_at,
         u.username AS owner_name,
         COUNT(DISTINCT pm2.user_id) AS member_count,
         COUNT(DISTINCT t.id) AS task_count,
         SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done_count,
         SUM(CASE WHEN t.assigned_to IS NULL AND t.status != 'done' THEN 1 ELSE 0 END) AS open_task_count
       FROM Projects p
       INNER JOIN Users u ON p.created_by = u.id
       LEFT JOIN ProjectMembers pm2 ON pm2.project_id = p.id
       LEFT JOIN Tasks t ON t.project_id = p.id
       WHERE p.id NOT IN (
         SELECT project_id FROM ProjectMembers WHERE user_id = ?
       )
       AND (p.name LIKE ? OR p.description LIKE ? OR u.username LIKE ?)
       GROUP BY p.id, p.name, p.description, p.color, p.emoji, p.created_at, u.username
       ORDER BY open_task_count DESC, p.created_at DESC
       LIMIT 30`,
      [userId, search, search, search]
    );

    res.json(rows);
  } catch (error) {
    console.error('getDiscoverProjects hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/discover/projects/:id — Keşfedilen projenin detaylarını getir (sadece okuma)
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

    res.json({ project, tasks, members, isMember });
  } catch (error) {
    console.error('getDiscoverProjectDetail hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/discover/projects/:id/join — Projeye katıl (kendini üye ekle)
const joinProject = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;

    // Zaten üye mi?
    const isMember = await ProjectMember.isMember(projectId, userId);
    if (isMember) {
      return res.status(400).json({ message: 'Zaten bu projenin üyesisiniz.' });
    }

    await pool.execute(
      'INSERT INTO ProjectMembers (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, userId, 'member']
    );

    res.status(201).json({ message: 'Projeye başarıyla katıldınız.' });
  } catch (error) {
    console.error('joinProject hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/discover/tasks/:taskId/claim — Görevi üstlen (kendine ata)
const claimTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Görev var mı ve hangi projeye ait?
    const [tasks] = await pool.execute(
      'SELECT id, project_id, assigned_to, status FROM Tasks WHERE id = ?',
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }

    const task = tasks[0];

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

    // Projeye otomatik üye yap (eğer değilse)
    const isMember = await ProjectMember.isMember(task.project_id, userId);
    if (!isMember) {
      await pool.execute(
        'INSERT INTO ProjectMembers (project_id, user_id, role) VALUES (?, ?, ?)',
        [task.project_id, userId, 'member']
      );
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
