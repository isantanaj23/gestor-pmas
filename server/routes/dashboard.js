const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getDashboardStats,
    getRecentActivity,
    getWeeklyMetrics
} = require('../controllers/dashboardController');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Obtener estadísticas generales del dashboard
 * @access  Private
 */
router.get('/stats', protect, getDashboardStats);

/**
 * @route   GET /api/dashboard/recent-activity
 * @desc    Obtener actividad reciente del usuario
 * @access  Private
 * @query   limit - Número de actividades a devolver (default: 10)
 */
router.get('/recent-activity', protect, getRecentActivity);

/**
 * @route   GET /api/dashboard/weekly-metrics
 * @desc    Obtener métricas de productividad semanal
 * @access  Private
 */
router.get('/weekly-metrics', protect, getWeeklyMetrics);

module.exports = router;