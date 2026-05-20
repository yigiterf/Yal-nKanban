const Project = require('../models/projectModel');
const ProjectMember = require('../models/projectMemberModel');

// POST /api/projects — Yeni proje oluştur
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Proje adı boş bırakılamaz.' });
    }

    const result = await Project.create(name.trim(), description || '', userId);

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

// GET /api/projects/:id — Tek projeyi getir
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
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
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Proje adı boş bırakılamaz.' });
    }

    const result = await Project.update(req.params.id, name.trim(), description || '', userId);

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

    res.json({ message: 'Üye başarıyla çıkarıldı.' });
  } catch (error) {
    console.error('removeProjectMember hatası:', error);
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
};
