const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} = require('../controllers/projectController');

// Tüm proje rotaları JWT ile korunuyor
router.use(authMiddleware);

router.post('/', createProject);                        // Proje oluştur
router.get('/', getProjects);                           // Projeleri listele
router.get('/:id', getProjectById);                     // Tek proje getir
router.patch('/:id', updateProject);                    // Proje güncelle
router.delete('/:id', deleteProject);                   // Proje sil

// Üye yönetimi
router.get('/:id/members', getProjectMembers);          // Üyeleri listele
router.post('/:id/members', addProjectMember);          // Üye ekle
router.delete('/:id/members/:userId', removeProjectMember); // Üye çıkar

module.exports = router;
