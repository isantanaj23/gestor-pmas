const express = require('express');
const {
  getTask,
  updateTask,
  deleteTask,
  moveTask,
  addComment,
  toggleChecklistItem,
  getMyTasks
} = require('../controllers/taskController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas específicas de tareas
router.get('/my-tasks', getMyTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(authorize('admin', 'manager', 'developer'), deleteTask);

// Rutas para funcionalidad del Kanban
router.patch('/:id/move', moveTask);

// Rutas para comentarios y checklist
router.post('/:id/comments', addComment);
router.patch('/:id/checklist/:itemId', toggleChecklistItem);

module.exports = router;