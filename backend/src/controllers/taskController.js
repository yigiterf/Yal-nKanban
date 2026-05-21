const Task = require('../models/taskModel');
const Project = require('../models/projectModel');
const User = require('../models/userModel');
const ProjectMember = require('../models/projectMemberModel');
const ActivityLog = require('../models/activityLogModel');
const Notification = require('../models/notificationModel');

const VALID_STATUSES = ['todo', 'in_progress', 'done'];

// POST /api/projects/:projectId/tasks — Yeni görev oluştur
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, dueDate, priority, tags, estimatePoints } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Görev başlığı boş bırakılamaz.' });
    }

    // Projenin var olup olmadığını kontrol et
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }

    // Sadece proje sahibi görev oluşturabilir
    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Sadece proje yöneticisi görev oluşturabilir.' });
    }

    // Atanacak kullanıcı varsa doğrula
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        return res.status(404).json({ message: 'Atanacak kullanıcı bulunamadı.' });
      }

      const isAssigneeMember = await ProjectMember.isMember(projectId, assignedTo);
      if (!isAssigneeMember) {
        return res.status(400).json({ message: 'Atanacak kullanıcı bu projenin üyesi değil.' });
      }
    }

    const result = await Task.create(
      projectId,
      title.trim(),
      description || '',
      assignedTo || null,
      dueDate || null,
      priority || 'medium',
      tags || '',
      estimatePoints || null
    );

    // Atanan kişiye bildirim gönder (kendisi değilse)
    if (assignedTo && assignedTo !== req.user.id) {
      await Notification.create(
        assignedTo,
        'task_assigned',
        `${req.user.username} sizi "${title.trim()}" görevine atadı.`,
        `/board/${projectId}`
      );
    }

    res.status(201).json({
      message: 'Görev başarıyla oluşturuldu.',
      taskId: result.insertId,
    });
  } catch (error) {
    console.error('createTask hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/projects/:projectId/tasks — Projenin görevlerini listele
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proje bulunamadı.' });
    }

    const isMember = await ProjectMember.isMember(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projeye erişim yetkiniz yok.' });
    }

    const tasks = await Task.findByProject(projectId);
    res.json(tasks);
  } catch (error) {
    console.error('getTasksByProject hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/tasks/upcoming — Kullanıcıya atanmış yaklaşan görevler
const getUpcomingTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.findUpcomingByUser(userId);
    res.json(tasks);
  } catch (error) {
    console.error('getUpcomingTasks hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/tasks/:id/status — Görev durumunu güncelle (Kanban)
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Geçersiz durum. Geçerli değerler: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }

    // Üyelik kontrolü
    const isMember = await ProjectMember.isMember(task.project_id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projenin üyesi değilsiniz.' });
    }

    const oldStatus = task.status;
    await Task.updateStatus(req.params.id, status);

    // Aktivite logu
    await ActivityLog.create(
      task.project_id,
      req.user.id,
      'status_changed',
      'task',
      task.id,
      { taskTitle: task.title, oldStatus, newStatus: status }
    );

    res.json({ message: 'Görev durumu güncellendi.', status });
  } catch (error) {
    console.error('updateTaskStatus hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/tasks/:id/assign — Görevi kullanıcıya ata
const assignTask = async (req, res) => {
  try {
    const { userId } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }

    // Üyelik kontrolü
    const isMember = await ProjectMember.isMember(task.project_id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projenin üyesi değilsiniz.' });
    }

    // Atanacak kullanıcının var olduğunu doğrula
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Atanacak kullanıcı bulunamadı.' });
      }

      const isAssigneeMember = await ProjectMember.isMember(task.project_id, userId);
      if (!isAssigneeMember) {
        return res.status(400).json({ message: 'Atanacak kullanıcı bu projenin üyesi değil.' });
      }

      // Atanan kişiye bildirim gönder
      if (userId !== req.user.id) {
        await Notification.create(
          userId,
          'task_assigned',
          `${req.user.username} sizi "${task.title}" görevine atadı.`,
          `/board/${task.project_id}`
        );
      }
    }

    await Task.updateAssignee(req.params.id, userId || null);

    // Aktivite logu
    await ActivityLog.create(
      task.project_id,
      req.user.id,
      'task_assigned',
      'task',
      task.id,
      { taskTitle: task.title, assignedTo: userId }
    );

    res.json({ message: 'Görev atama güncellendi.' });
  } catch (error) {
    console.error('assignTask hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/tasks/:id — Görev başlık/açıklama/due_date güncelle
const updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, assignedTo, priority, tags, estimatePoints } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Görev başlığı boş bırakılamaz.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }

    // Üyelik kontrolü
    const isMember = await ProjectMember.isMember(task.project_id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projenin üyesi değilsiniz.' });
    }

    // Proje sahibi kontrolü — sadece sahip görev detaylarını düzenleyebilir
    const project = await Project.findById(task.project_id);
    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Sadece proje yöneticisi görevi düzenleyebilir.' });
    }

    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        return res.status(404).json({ message: 'Atanacak kullanıcı bulunamadı.' });
      }

      const isAssigneeMember = await ProjectMember.isMember(task.project_id, assignedTo);
      if (!isAssigneeMember) {
        return res.status(400).json({ message: 'Atanacak kullanıcı bu projenin üyesi değil.' });
      }
    }

    await Task.update(
      req.params.id,
      title.trim(),
      description || '',
      dueDate || null,
      priority || 'medium',
      tags || '',
      estimatePoints || null
    );

    // Atama değiştiyse ayrıca güncelle ve bildirim gönder
    if (assignedTo !== undefined && assignedTo != task.assigned_to) {
      await Task.updateAssignee(req.params.id, assignedTo || null);

      // Yeni atanan kişiye bildirim gönder (kendisi değilse)
      if (assignedTo && assignedTo !== req.user.id) {
        await Notification.create(
          assignedTo,
          'task_assigned',
          `${req.user.username} sizi "${title.trim()}" görevine atadı.`,
          `/board/${task.project_id}`
        );
      }
    }

    res.json({ message: 'Görev güncellendi.' });
  } catch (error) {
    console.error('updateTask hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/tasks/assigned — Kullanıcıya atanmış tüm görevleri listele
const getMyAssignedTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.findAllAssignedByUser(userId);
    res.json(tasks);
  } catch (error) {
    console.error('getMyAssignedTasks hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/tasks/:id — Görevi sil
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }

    // Üyelik kontrolü
    const isMember = await ProjectMember.isMember(task.project_id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projenin üyesi değilsiniz.' });
    }

    // Proje sahibi kontrolü — sadece sahip silebilir
    const project = await Project.findById(task.project_id);
    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Sadece proje yöneticisi görev silebilir.' });
    }

    await Task.delete(req.params.id);

    // Aktivite logu
    await ActivityLog.create(
      task.project_id,
      req.user.id,
      'task_deleted',
      'task',
      task.id,
      { taskTitle: task.title }
    );

    res.json({ message: 'Görev başarıyla silindi.' });
  } catch (error) {
    console.error('deleteTask hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  getUpcomingTasks,
  getMyAssignedTasks,
  updateTaskStatus,
  assignTask,
  updateTask,
  deleteTask,
};
