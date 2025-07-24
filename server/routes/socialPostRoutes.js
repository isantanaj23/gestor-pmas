// server/routes/socialPostRoutes.js
const express = require('express');
const router = express.Router();
const {
  createSocialPost,
  getProjectSocialPosts,
  getSocialPost,
  updateSocialPost,
  deleteSocialPost,
  updatePostStatus,
  getSocialPostStats
} = require('../controllers/socialPostController');

const { protect } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// @route   POST /api/social-posts
// @desc    Crear nueva publicación social
// @access  Private
router.post('/', createSocialPost);

// @route   GET /api/social-posts/project/:projectId
// @desc    Obtener publicaciones de un proyecto
// @access  Private
router.get('/project/:projectId', getProjectSocialPosts);

// @route   GET /api/social-posts/stats/:projectId
// @desc    Obtener estadísticas de publicaciones de un proyecto
// @access  Private
router.get('/stats/:projectId', getSocialPostStats);

// @route   GET /api/social-posts/:id
// @desc    Obtener una publicación específica
// @access  Private
router.get('/:id', getSocialPost);

// @route   PUT /api/social-posts/:id
// @desc    Actualizar publicación social
// @access  Private
router.put('/:id', updateSocialPost);

// @route   PATCH /api/social-posts/:id/status
// @desc    Cambiar estado de publicación
// @access  Private
router.patch('/:id/status', updatePostStatus);

// @route   DELETE /api/social-posts/:id
// @desc    Eliminar publicación social
// @access  Private
router.delete('/:id', deleteSocialPost);

module.exports = router;