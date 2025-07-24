// server/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Usuario que recibe la notificación
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Para búsquedas rápidas
  },
  
  // Usuario que generó la notificación (opcional)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Tipo de notificación
  type: {
    type: String,
    required: true,
    enum: [
      'task_assigned',        // Tarea asignada
      'task_completed',       // Tarea completada
      'task_due',            // Tarea vencida
      'comment_added',       // Nuevo comentario
      'project_updated',     // Proyecto actualizado
      'followup_due',        // Seguimiento pendiente
      'system',              // Notificación del sistema
      'social_post_scheduled', // Publicación programada
      'social_post_published'  // Publicación realizada
    ]
  },
  
  // Título de la notificación
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  // Mensaje descriptivo
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Datos adicionales específicos del tipo de notificación
  data: {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialPost' },
    url: String, // URL a la que debe dirigir la notificación
    metadata: mongoose.Schema.Types.Mixed // Datos adicionales flexibles
  },
  
  // Estado de la notificación
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Fecha de lectura
  readAt: {
    type: Date,
    default: null
  },
  
  // Prioridad de la notificación
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Si se envió como push notification
  sentAsPush: {
    type: Boolean,
    default: false
  },
  
  // Si se mostró como toast
  shownAsToast: {
    type: Boolean,
    default: false
  },
  
  // Fecha de expiración (para notificaciones temporales)
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Crea automáticamente createdAt y updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos para consultas eficientes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual para verificar si la notificación es reciente (menos de 1 hora)
notificationSchema.virtual('isRecent').get(function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.createdAt > oneHourAgo;
});

// Método para marcar como leída
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Método estático para crear notificación
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    
    // Emitir evento de Socket.io si está disponible
    const SocketHandler = require('../socket/socketHandler');
    if (global.socketHandler) {
      global.socketHandler.emitNotification(notification.recipient, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creando notificación:', error);
    throw error;
  }
};

// Método estático para obtener notificaciones no leídas
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    recipient: userId, 
    read: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Método estático para obtener notificaciones paginadas
notificationSchema.statics.getNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    read = undefined, // undefined = todas, true = solo leídas, false = solo no leídas
    type = undefined
  } = options;

  const query = { 
    recipient: userId,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (read !== undefined) {
    query.read = read;
  }

  if (type) {
    query.type = type;
  }

  return this.find(query)
    .populate('sender', 'name avatar email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
};

// Middleware para limpiar notificaciones expiradas antes de guardar
notificationSchema.pre('save', function(next) {
  // Si es una notificación de baja prioridad, expirar en 30 días
  if (this.priority === 'low' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);