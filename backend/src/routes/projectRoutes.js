const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { projectValidation, memberEmailValidation } = require('../middlewares/validationMiddleware');
const {
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
} = require('../controllers/projectController');
const { getProjectActivity } = require('../controllers/activityController');

// Tüm proje rotaları JWT ile korunuyor
router.use(authMiddleware);


router.post('/', projectValidation, createProject);       // Proje oluştur
router.get('/', getProjects);                              // Projeleri listele
router.get('/:id', getProjectById);                        // Tek proje getir
router.patch('/:id', projectValidation, updateProject);    // Proje güncelle
router.delete('/:id', deleteProject);                      // Proje sil

// Üye yönetimi
router.get('/:id/members', getProjectMembers);             // Üyeleri listele
router.post('/:id/members', memberEmailValidation, addProjectMember);  // Üye ekle
router.delete('/:id/members/:userId', removeProjectMember); // Üye çıkar

// Katılım talepleri yönetimi
router.get('/:id/join-requests', getJoinRequests);
router.post('/:id/join-requests/:requestId/approve', approveJoinRequest);
router.post('/:id/join-requests/:requestId/reject', rejectJoinRequest);

// Proje istatistikleri ve aktivite
router.get('/:id/stats', getProjectStats);                 // Proje istatistikleri
router.get('/:id/activity', getProjectActivity);           // Aktivite geçmişi

module.exports = router;

