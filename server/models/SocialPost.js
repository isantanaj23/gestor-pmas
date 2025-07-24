// server/models/SocialPost.js
const mongoose = require('mongoose');

const SocialPostSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2200 // Límite para LinkedIn
  },
  hashtags: [{
    type: String,
    validate: {
      validator: function(v) {
        return v.startsWith('#');
      },
      message: 'Los hashtags deben comenzar con #'
    }
  }],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    size: Number
  }],
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed', 'cancelled'],
    default: 'draft'
  },
  publishedAt: Date,
  analytics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
  },
  // Para integraciones futuras con APIs de redes sociales
  externalPostId: String,
  publishAttempts: {
    type: Number,
    default: 0
  },
  lastError: String,
  notes: String
}, {
  timestamps: true
});

// Índices para optimizar consultas
SocialPostSchema.index({ project: 1, scheduledDate: 1 });
SocialPostSchema.index({ status: 1, scheduledDate: 1 });
SocialPostSchema.index({ author: 1, createdAt: -1 });

// Método para verificar si la publicación está programada para el futuro
SocialPostSchema.methods.isScheduledForFuture = function() {
  return this.scheduledDate > new Date();
};

// Método para marcar como publicada
SocialPostSchema.methods.markAsPublished = function(analytics = {}) {
  this.status = 'published';
  this.publishedAt = new Date();
  if (analytics) {
    this.analytics = { ...this.analytics, ...analytics };
  }
  return this.save();
};

// Método para marcar como fallida
SocialPostSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.lastError = error;
  this.publishAttempts += 1;
  return this.save();
};

// Método estático para obtener publicaciones de un proyecto
SocialPostSchema.statics.getProjectPosts = function(projectId, startDate, endDate) {
  const query = { project: projectId };
  
  if (startDate || endDate) {
    query.scheduledDate = {};
    if (startDate) query.scheduledDate.$gte = new Date(startDate);
    if (endDate) query.scheduledDate.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('author', 'name email avatar')
    .sort({ scheduledDate: 1 });
};

// Método estático para obtener publicaciones pendientes
SocialPostSchema.statics.getPendingPosts = function() {
  return this.find({
    status: 'scheduled',
    scheduledDate: { $lte: new Date() }
  }).populate('project author');
};

// Middleware pre-save para validaciones adicionales
SocialPostSchema.pre('save', function(next) {
  // Validar que la fecha programada no sea en el pasado (solo para nuevos posts)
  if (this.isNew && this.scheduledDate < new Date()) {
    return next(new Error('No se puede programar una publicación en el pasado'));
  }
  
  // Auto-generar hashtags si no existen
  if (!this.hashtags || this.hashtags.length === 0) {
    const contentWords = this.content.toLowerCase().split(' ');
    const autoHashtags = contentWords
      .filter(word => word.length > 3 && /^[a-zA-Z]+$/.test(word))
      .slice(0, 3)
      .map(word => `#${word}`);
    
    if (autoHashtags.length > 0) {
      this.hashtags = autoHashtags;
    }
  }
  
  next();
});

module.exports = mongoose.model('SocialPost', SocialPostSchema);