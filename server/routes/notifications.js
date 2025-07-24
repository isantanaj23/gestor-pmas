// server/routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth'); // ✅ CON LLAVES

// 🌐 GET /api/notifications/health - Health check (SIN autenticación)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Rutas de notificaciones funcionando correctamente',
    timestamp: new Date().toISOString(),
    features: ['socket.io', 'real-time notifications', 'push notifications']
  });
});

// 📱 GET /api/notifications - Obtener notificaciones del usuario
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, read, type } = req.query;
    
    const notifications = await Notification.getNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      read: read !== undefined ? read === 'true' : undefined,
      type
    });
    
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: notifications.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener notificaciones'
    });
  }
});

// 🔔 GET /api/notifications/unread-count - Contador de no leídas
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error obteniendo contador:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// ✅ PUT /api/notifications/:id/read - Marcar como leída
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    await notification.markAsRead();
    
    // Emitir actualización del contador via Socket.io
    if (global.socketHandler) {
      const newCount = await Notification.getUnreadCount(req.user.id);
      global.socketHandler.emitToUser(req.user.id, 'notification_count_updated', {
        count: newCount
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marcando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// ✅ PUT /api/notifications/mark-all-read - Marcar todas como leídas
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        recipient: req.user.id, 
        read: false 
      },
      { 
        read: true, 
        readAt: new Date() 
      }
    );
    
    // Emitir actualización del contador
    if (global.socketHandler) {
      global.socketHandler.emitToUser(req.user.id, 'notification_count_updated', {
        count: 0
      });
    }
    
    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marcando todas las notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// 🗑️ DELETE /api/notifications/:id - Eliminar notificación
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    // Emitir actualización del contador
    if (global.socketHandler) {
      const newCount = await Notification.getUnreadCount(req.user.id);
      global.socketHandler.emitToUser(req.user.id, 'notification_count_updated', {
        count: newCount
      });
    }
    
    res.json({
      success: true,
      message: 'Notificación eliminada'
    });
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// 🧹 DELETE /api/notifications/clear-read - Limpiar notificaciones leídas
router.delete('/clear-read', protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user.id,
      read: true
    });
    
    res.json({
      success: true,
      message: `${result.deletedCount} notificaciones eliminadas`
    });
  } catch (error) {
    console.error('Error limpiando notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

// 🔔 POST /api/notifications/test - Crear notificación de prueba (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', protect, async (req, res) => {
    try {
      const { type = 'system', title, message } = req.body;
      
      const notification = await Notification.createNotification({
        recipient: req.user.id,
        type,
        title: title || 'Notificación de prueba',
        message: message || 'Esta es una notificación de prueba del sistema',
        priority: 'normal'
      });
      
      res.json({
        success: true,
        data: notification,
        message: 'Notificación de prueba creada'
      });
    } catch (error) {
      console.error('Error creando notificación de prueba:', error);
      res.status(500).json({
        success: false,
        message: 'Error del servidor'
      });
    }
  });
}

// 📊 GET /api/notifications/stats - Estadísticas de notificaciones
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { recipient: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const totalCount = await Notification.countDocuments({ recipient: req.user.id });
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: {
        byType: stats,
        total: totalCount,
        unread: unreadCount
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

module.exports = router;