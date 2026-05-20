const pool = require('../config/db');

// GET /api/dashboard/stats — Dashboard istatistiklerini getir
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Proje Sayısı
    const [projectCountRows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM ProjectMembers WHERE user_id = ?',
      [userId]
    );
    const projectCount = projectCountRows[0].count;

    // 2. Kullanıcıya atanan görev durum dağılımı
    const [statusRows] = await pool.execute(
      `SELECT status, COUNT(*) AS count 
       FROM Tasks 
       WHERE assigned_to = ? 
       GROUP BY status`,
      [userId]
    );
    
    const taskStats = { todo: 0, in_progress: 0, done: 0 };
    statusRows.forEach(row => {
      if (taskStats[row.status] !== undefined) {
        taskStats[row.status] = row.count;
      }
    });

    // 3. Toplam ve tamamlanan Story Point analizi
    const [pointsRows] = await pool.execute(
      `SELECT 
        COALESCE(SUM(estimate_points), 0) AS total_points,
        COALESCE(SUM(CASE WHEN status = 'done' THEN estimate_points ELSE 0 END), 0) AS completed_points
       FROM Tasks 
       WHERE assigned_to = ?`,
      [userId]
    );
    const { total_points, completed_points } = pointsRows[0];

    // 4. Son 7 günün günlük Aktivite Grafiği verisi (Oluşturulan vs Tamamlanan)
    // Son 7 günün tarihlerini alalım
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      days.push({
        date: dateString,
        dayName: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
        created: 0,
        completed: 0
      });
    }

    const startDate = days[0].date;

    // Bu kullanıcının dahil olduğu projelerde son 7 günde oluşturulan görevler
    const [createdRows] = await pool.execute(
      `SELECT DATE(t.created_at) AS date, COUNT(*) AS count 
       FROM Tasks t
       INNER JOIN ProjectMembers pm ON t.project_id = pm.project_id
       WHERE pm.user_id = ? 
         AND t.created_at >= ?
       GROUP BY DATE(t.created_at)`,
      [userId, startDate]
    );

    // Bu kullanıcının son 7 günde tamamladığı görevler (ActivityLogs üzerinden)
    const [completedRows] = await pool.execute(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM ActivityLogs
       WHERE user_id = ?
         AND action = 'status_changed'
         AND JSON_UNQUOTE(JSON_EXTRACT(details, '$.newStatus')) = 'done'
         AND created_at >= ?
       GROUP BY DATE(created_at)`,
      [userId, startDate]
    );

    // Günlük verileri eşleyelim
    createdRows.forEach(row => {
      const formattedDate = new Date(row.date).toISOString().split('T')[0];
      const day = days.find(d => d.date === formattedDate);
      if (day) day.created = row.count;
    });

    completedRows.forEach(row => {
      const formattedDate = new Date(row.date).toISOString().split('T')[0];
      const day = days.find(d => d.date === formattedDate);
      if (day) day.completed = row.count;
    });

    // 5. Kritik / Yaklaşan Görevler (Teslim tarihi 3 gün içinde olan ve bitmeyen görevler)
    const [upcomingRows] = await pool.execute(
      `SELECT t.id, t.title, t.due_date, t.priority, t.status, t.project_id,
              p.name AS project_name, p.color AS project_color, p.emoji AS project_emoji
       FROM Tasks t
       INNER JOIN Projects p ON t.project_id = p.id
       WHERE t.assigned_to = ?
         AND t.status != 'done'
         AND t.due_date IS NOT NULL
         AND t.due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
       ORDER BY t.due_date ASC
       LIMIT 5`,
      [userId]
    );

    res.json({
      projectCount,
      taskStats,
      points: {
        total: parseInt(total_points) || 0,
        completed: parseInt(completed_points) || 0
      },
      weeklyActivity: days,
      criticalTasks: upcomingRows
    });
  } catch (error) {
    console.error('getDashboardStats hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  getDashboardStats
};
