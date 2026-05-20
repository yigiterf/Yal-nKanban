const ActivityLog = require('../models/activityLogModel');
const ProjectMember = require('../models/projectMemberModel');

// GET /api/projects/:projectId/activity — Proje aktivite geçmişi
const getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Üyelik kontrolü
    const isMember = await ProjectMember.isMember(projectId, userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Bu projenin üyesi değilsiniz.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      ActivityLog.findByProject(projectId, limit, offset),
      ActivityLog.countByProject(projectId),
    ]);

    res.json({ activities, total, page, limit });
  } catch (error) {
    console.error('getProjectActivity hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { getProjectActivity };
