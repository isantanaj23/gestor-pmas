const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  updateProgress
} = require('../controllers/projectController');

// IMPORTAR TAMBIÉN LOS CONTROLADORES DE TAREAS ← ESTA LÍNEA ES CLAVE
const { getProjectTasks, createTask } = require('../controllers/taskController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas principales de proyectos
router.route('/')
  .get(getProjects)
  .post(authorize('admin', 'manager', 'developer'), createProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('admin', 'manager'), updateProject)
  .delete(authorize('admin', 'manager'), deleteProject);

// Rutas específicas de proyectos
router.post('/:id/team', authorize('admin', 'manager'), addTeamMember);
router.patch('/:id/progress', updateProgress);

// RUTAS PARA TAREAS DE UN PROYECTO ← AGREGAR ESTAS LÍNEAS
router.route('/:id/tasks')
  .get(getProjectTasks)
  .post(authorize('admin', 'manager', 'developer'), createTask);

module.exports = router;