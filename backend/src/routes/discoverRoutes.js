const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getDiscoverProjects,
  getDiscoverProjectDetail,
  joinProject,
  claimTask,
} = require('../controllers/discoverController');

router.get('/projects', authMiddleware, getDiscoverProjects);
router.get('/projects/:id', authMiddleware, getDiscoverProjectDetail);
router.post('/projects/:id/join', authMiddleware, joinProject);
router.post('/tasks/:taskId/claim', authMiddleware, claimTask);

module.exports = router;
