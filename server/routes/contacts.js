const express = require('express');
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  moveToStage,
  addNote,
  scheduleFollowUp,
  getPipelineStats,
  getContactsByStage,
  getOverdueFollowUps
} = require('../controllers/contactController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas principales
router.route('/')
  .get(getContacts)
  .post(createContact);

// Rutas específicas (deben ir antes que /:id)
router.get('/pipeline-stats', getPipelineStats);
router.get('/by-stage/:stage', getContactsByStage);
router.get('/overdue-followups', getOverdueFollowUps);

// Rutas individuales
router.route('/:id')
  .get(getContact)
  .put(updateContact)
  .delete(authorize('admin', 'manager'), deleteContact);

// Rutas de acciones específicas
router.patch('/:id/stage', moveToStage);
router.post('/:id/notes', addNote);
router.post('/:id/follow-up', scheduleFollowUp);

module.exports = router;