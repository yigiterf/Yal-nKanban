const Project = require('../models/projectModel');
const ProjectMember = require('../models/projectMemberModel');
const Notification = require('../models/notificationModel');
const JoinRequest = require('../models/joinRequestModel');
const pool = require('../config/db');

// POST /api/projects — Yeni proje oluştur
const createProject = async (req, res) => {
  try {
    const { name, description, color, emoji, maxMembers } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Proje adı boş bırakılamaz.' });
    }

    const result = await Project.create(name.trim(), description || '', userId, color, emoji, maxMembers || null);

    // Proje sahibini otomatik olarak üye tablosuna ekle
    await ProjectMember.addOwner(result.insertId, userId);

    res.status(201).json({
      message: 'Proje başarıyla oluşturuldu.',
      projectId: result.insertId,
    });
  } catch (error) {
    console.error('createProject hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/projects — Kullanıcının üyesi olduğu projeleri listele
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.findAllByUser(userId);
    res.json(projects);
  } catch (error) {
    console.error('getProjects hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/projects/:id — Tek projeyi getir (üyelik kontrolü ile)
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }

    // Üyelik kontrolü — sadece proje üyeleri görebilir
    const isMember = await ProjectMember.isMember(req.params.id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projeye erişim yetkiniz yok.' });
    }

    res.json(project);
  } catch (error) {
    console.error('getProjectById hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/projects/:id — Projeyi güncelle (sadece sahibi)
const updateProject = async (req, res) => {
  try {
    const { name, description, color, emoji, maxMembers } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Proje adı boş bırakılamaz.' });
    }

    const result = await Project.update(req.params.id, name.trim(), description || '', color, emoji, maxMembers || null, userId);

    if (result.affectedRows === 0) {
      return res.status(403).json({
        message: 'Bu projeyi düzenleme yetkiniz yok veya proje bulunamadı.',
      });
    }

    res.json({ message: 'Proje başarıyla güncellendi.' });
  } catch (error) {
    console.error('updateProject hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/projects/:id — Projeyi sil (sadece sahibi)
const deleteProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Project.delete(req.params.id, userId);

    if (result.affectedRows === 0) {
      return res.status(403).json({
        message: 'Bu projeyi silme yetkiniz yok veya proje bulunamadı.',
      });
    }

    res.json({ message: 'Proje başarıyla silindi.' });
  } catch (error) {
    console.error('deleteProject hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/projects/:id/members — Proje üyelerini listele
const getProjectMembers = async (req, res) => {
  try {
    const isMember = await ProjectMember.isMember(req.params.id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projeye erişim yetkiniz yok.' });
    }

    const members = await ProjectMember.findByProject(req.params.id);
    res.json(members);
  } catch (error) {
    console.error('getProjectMembers hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/projects/:id/members — Projeye üye ekle (e-posta ile)
const addProjectMember = async (req, res) => {
  try {
    const { email } = req.body;
    const projectId = req.params.id;

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'E-posta adresi gereklidir.' });
    }

    // Proje sahibi mi kontrol et
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }
    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Sadece proje sahibi üye ekleyebilir.' });
    }

    const result = await ProjectMember.addMemberByEmail(projectId, email.trim());

    if (!result) {
      return res.status(404).json({ message: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı. Kullanıcının önce sisteme kayıt olması gerekiyor.' });
    }
    if (result.alreadyMember) {
      return res.status(400).json({ message: 'Bu kullanıcı zaten projenin üyesi.' });
    }

    // Eklenen kullanıcıya bildirim gönder
    await Notification.create(
      result.userId,
      'member_added',
      `${req.user.username} sizi "${project.name}" projesine davet etti.`,
      `/board/${projectId}`
    );

    res.status(201).json({ message: 'Üye başarıyla eklendi.' });
  } catch (error) {
    console.error('addProjectMember hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/projects/:id/members/:userId — Üyeyi çıkar
const removeProjectMember = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }
    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Sadece proje sahibi üye çıkarabilir.' });
    }

    const result = await ProjectMember.removeMember(projectId, userId);
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Üye bulunamadı veya proje sahibi çıkarılamaz.' });
    }

    // Çıkarılan kullanıcıya bildirim gönder
    await Notification.create(
      parseInt(userId),
      'member_removed',
      `"${project.name}" projesinden çıkarıldınız.`,
      null
    );

    res.json({ message: 'Üye başarıyla çıkarıldı.' });
  } catch (error) {
    console.error('removeProjectMember hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/projects/:id/stats — Proje istatistikleri
const getProjectStats = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Üyelik kontrolü
    const isMember = await ProjectMember.isMember(projectId, userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projeye erişim yetkiniz yok.' });
    }

    // Durum bazlı görev sayıları
    const [statusRows] = await pool.execute(
      `SELECT 
         status, 
         COUNT(*) AS count 
       FROM Tasks 
       WHERE project_id = ? 
       GROUP BY status`,
      [projectId]
    );

    // Toplam görev
    const total = statusRows.reduce((sum, r) => sum + r.count, 0);
    const done = statusRows.find((r) => r.status === 'done')?.count || 0;
    const todo = statusRows.find((r) => r.status === 'todo')?.count || 0;
    const inProgress = statusRows.find((r) => r.status === 'in_progress')?.count || 0;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Üye sayısı
    const members = await ProjectMember.findByProject(projectId);

    res.json({
      total,
      todo,
      inProgress,
      done,
      completionRate,
      memberCount: members.length,
    });
  } catch (error) {
    console.error('getProjectStats hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/projects/:id/join-requests — Projenin bekleyen katılım taleplerini listele
const getJoinRequests = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }
    if (project.created_by !== userId) {
      return res.status(403).json({ message: 'Sadece proje sahibi katılım taleplerini görebilir.' });
    }

    const [rows] = await pool.execute(
      `SELECT jr.id, jr.user_id, jr.status, jr.created_at, u.username, u.email
       FROM JoinRequests jr
       JOIN Users u ON jr.user_id = u.id
       WHERE jr.project_id = ? AND jr.status = 'pending'
       ORDER BY jr.created_at DESC`,
      [projectId]
    );

    res.json(rows);
  } catch (error) {
    console.error('getJoinRequests hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/projects/:id/join-requests/:requestId/approve — Katılım talebini onayla
const approveJoinRequest = async (req, res) => {
  try {
    const { id: projectId, requestId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }
    if (project.created_by !== userId) {
      return res.status(403).json({ message: 'Sadece proje sahibi katılım taleplerini onaylayabilir.' });
    }

    const request = await JoinRequest.findById(requestId);
    if (!request || request.project_id != projectId || request.status !== 'pending') {
      return res.status(404).json({ message: 'Geçersiz veya beklemeyen talep.' });
    }

    // Kapasite kontrolü
    if (project.max_members !== null) {
      const members = await ProjectMember.findByProject(projectId);
      if (members.length >= project.max_members) {
        return res.status(400).json({ message: 'Proje kontenjanı dolu. Üye eklenemez.' });
      }
    }

    // 1. Talebi onayla
    await JoinRequest.approve(requestId);

    // 2. Üye ekle
    const alreadyMember = await ProjectMember.isMember(projectId, request.user_id);
    if (!alreadyMember) {
      await pool.execute(
        'INSERT INTO ProjectMembers (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, request.user_id, 'member']
      );
    }

    // 3. Kullanıcıya onay bildirimi gönder
    await Notification.create(
      request.user_id,
      'project_joined',
      `"${project.name}" projesine katılım talebiniz onaylandı!`,
      `/board/${projectId}`
    );

    res.json({ message: 'Katılım talebi onaylandı ve üye projeye eklendi.' });
  } catch (error) {
    console.error('approveJoinRequest hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/projects/:id/join-requests/:requestId/reject — Katılım talebini reddet
const rejectJoinRequest = async (req, res) => {
  try {
    const { id: projectId, requestId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }
    if (project.created_by !== userId) {
      return res.status(403).json({ message: 'Sadece proje sahibi katılım taleplerini reddedebilir.' });
    }

    const request = await JoinRequest.findById(requestId);
    if (!request || request.project_id != projectId || request.status !== 'pending') {
      return res.status(404).json({ message: 'Geçersiz veya beklemeyen talep.' });
    }

    // 1. Talebi reddet
    await JoinRequest.reject(requestId);

    // 2. Kullanıcıya bildirim gönder
    await Notification.create(
      request.user_id,
      'member_removed',
      `"${project.name}" projesine katılım talebiniz reddedildi.`,
      null
    );

    res.json({ message: 'Katılım talebi reddedildi.' });
  } catch (error) {
    console.error('rejectJoinRequest hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getProjectStats,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
};
