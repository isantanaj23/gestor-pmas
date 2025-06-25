const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del proyecto es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  budget: {
    allocated: {
      type: Number,
      default: 0
    },
    used: {
      type: Number,
      default: 0
    }
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Relación con el usuario que creó el proyecto
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // Miembros del equipo del proyecto
  team: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['manager', 'developer', 'designer', 'tester', 'client'],
      default: 'developer'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Configuración del proyecto
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  // Archivos del proyecto
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Fechas de auditoría
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Mongoose manejará createdAt y updatedAt automáticamente
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para calcular duración del proyecto
ProjectSchema.virtual('duration').get(function() {
  if (this.endDate && this.startDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});

// Virtual para obtener el número de tareas (se conectará después)
ProjectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true
});

// Middleware pre-save para actualizar updatedAt
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Métodos de instancia
ProjectSchema.methods.addTeamMember = function(userId, role = 'developer') {
  const existingMember = this.team.find(member => member.user.toString() === userId);
  
  if (!existingMember) {
    this.team.push({
      user: userId,
      role: role
    });
  }
  
  return this.save();
};

ProjectSchema.methods.removeTeamMember = function(userId) {
  this.team = this.team.filter(member => member.user.toString() !== userId);
  return this.save();
};

ProjectSchema.methods.updateProgress = function(newProgress) {
  this.progress = Math.min(Math.max(newProgress, 0), 100);
  
  // Si llega al 100%, marcar como completado
  if (this.progress === 100) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Métodos estáticos
ProjectSchema.statics.getProjectsByUser = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'team.user': userId }
    ]
  }).populate('owner', 'name email avatar')
    .populate('team.user', 'name email avatar role');
};

ProjectSchema.statics.getActiveProjects = function() {
  return this.find({ status: 'active' })
    .populate('owner', 'name email')
    .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Project', ProjectSchema);