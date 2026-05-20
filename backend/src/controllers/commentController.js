const Comment = require('../models/commentModel');
const Task = require('../models/taskModel');
const ProjectMember = require('../models/projectMemberModel');
const Notification = require('../models/notificationModel');
const ActivityLog = require('../models/activityLogModel');

// POST /api/tasks/:taskId/comments — Yorum ekle
const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Görevin var olup olmadığını kontrol et
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }

    // Kullanıcının projeye üye olup olmadığını kontrol et
    const isMember = await ProjectMember.isMember(task.project_id, userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projenin üyesi değilsiniz.' });
    }

    const result = await Comment.create(taskId, userId, content);

    // Aktivite logu
    await ActivityLog.create(
      task.project_id,
      userId,
      'comment_added',
      'task',
      parseInt(taskId),
      { taskTitle: task.title }
    );

    // Görev sahibine bildirim gönder (yorum yapan kişi değilse)
    if (task.assigned_to && task.assigned_to !== userId) {
      await Notification.create(
        task.assigned_to,
        'comment_added',
        `${req.user.username} "${task.title}" görevine yorum ekledi.`,
        `/board/${task.project_id}`
      );
    }

    res.status(201).json({
      message: 'Yorum eklendi.',
      commentId: result.insertId,
    });
  } catch (error) {
    console.error('createComment hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/tasks/:taskId/comments — Görevin yorumlarını listele
const getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }

    // Üyelik kontrolü
    const isMember = await ProjectMember.isMember(task.project_id, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projenin üyesi değilsiniz.' });
    }

    const comments = await Comment.findByTask(taskId);
    res.json(comments);
  } catch (error) {
    console.error('getCommentsByTask hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/comments/:id — Yorum sil (sadece yazan kişi)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı.' });
    }

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Sadece kendi yorumunuzu silebilirsiniz.' });
    }

    await Comment.delete(req.params.id);
    res.json({ message: 'Yorum silindi.' });
  } catch (error) {
    console.error('deleteComment hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { createComment, getCommentsByTask, deleteComment };
