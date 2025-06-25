const express = require('express');
const {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  completeActivity,
  rescheduleActivity,
  getUpcomingActivities,
  getOverdueActivities,
  getActivityStats,
  getActivitiesByContact
} = require('../controllers/activityController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas principales
router.route('/')
  .get(getActivities)
  .post(createActivity);

// Rutas específicas (antes que /:id)
router.get('/upcoming', getUpcomingActivities);
router.get('/overdue', getOverdueActivities);
router.get('/stats', getActivityStats);
router.get('/contact/:contactId', getActivitiesByContact);

// Rutas individuales
router.route('/:id')
  .get(getActivity)
  .put(updateActivity)
  .delete(authorize('admin', 'manager'), deleteActivity);

// Rutas de acciones específicas
router.patch('/:id/complete', completeActivity);
router.patch('/:id/reschedule', rescheduleActivity);

module.exports = router;