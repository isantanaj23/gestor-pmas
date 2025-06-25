const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título de la tarea es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  // Estados para el Kanban Board
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'review', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Relación con proyecto
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, 'La tarea debe pertenecer a un proyecto']
  },
  // Usuario asignado
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  // Usuario que creó la tarea
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // Fechas importantes
  dueDate: {
    type: Date
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  // Estimación y tiempo real
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  // Tags y categorías
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  category: {
    type: String,
    enum: ['development', 'design', 'testing', 'documentation', 'meeting', 'research', 'bug', 'feature'],
    default: 'development'
  },
  // Posición para drag & drop en el Kanban
  position: {
    type: Number,
    default: 0
  },
  // Progreso de la tarea (0-100)
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Checklist de subtareas
  checklist: [{
    text: {
      type: String,
      required: true,
      maxlength: 200
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date
    }
  }],
  // Archivos adjuntos
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
  // Comentarios de la tarea
  comments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    editedAt: {
      type: Date
    }
  }],
  // Configuración
  settings: {
    isUrgent: {
      type: Boolean,
      default: false
    },
    notifyAssignee: {
      type: Boolean,
      default: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockReason: {
      type: String,
      maxlength: 200
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar performance
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ position: 1 });

// Virtual para calcular si la tarea está atrasada
TaskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual para calcular días restantes
TaskSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate || this.status === 'completed') {
    return null;
  }
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual para progreso del checklist
TaskSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) {
    return 0;
  }
  const completed = this.checklist.filter(item => item.completed).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Middleware pre-save
TaskSchema.pre('save', function(next) {
  // Auto-actualizar progreso basado en status
  if (this.status === 'completed' && this.progress < 100) {
    this.progress = 100;
    this.completedDate = new Date();
  } else if (this.status === 'in-progress' && this.progress === 0) {
    this.progress = 25;
  } else if (this.status === 'review' && this.progress < 75) {
    this.progress = 75;
  }

  // Auto-completar si progreso llega a 100%
  if (this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedDate = new Date();
  }

  next();
});

// Middleware post-save para actualizar progreso del proyecto
TaskSchema.post('save', async function() {
  await this.constructor.updateProjectProgress(this.project);
});

TaskSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.constructor.updateProjectProgress(doc.project);
  }
});

// Métodos de instancia
TaskSchema.methods.addComment = function(userId, text) {
  this.comments.push({
    user: userId,
    text: text
  });
  return this.save();
};

TaskSchema.methods.addChecklistItem = function(text) {
  this.checklist.push({ text });
  return this.save();
};

TaskSchema.methods.toggleChecklistItem = function(itemId, userId) {
  const item = this.checklist.id(itemId);
  if (item) {
    item.completed = !item.completed;
    if (item.completed) {
      item.completedBy = userId;
      item.completedAt = new Date();
    } else {
      item.completedBy = undefined;
      item.completedAt = undefined;
    }
  }
  return this.save();
};

TaskSchema.methods.moveToStatus = function(newStatus, position = 0) {
  this.status = newStatus;
  this.position = position;
  return this.save();
};

// Métodos estáticos
TaskSchema.statics.getTasksByProject = function(projectId, status = null) {
  const query = { project: projectId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('comments.user', 'name avatar')
    .sort({ position: 1, createdAt: -1 });
};

TaskSchema.statics.getTasksByUser = function(userId, status = null) {
  const query = { assignedTo: userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('project', 'name')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1, priority: -1 });
};

TaskSchema.statics.getOverdueTasks = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $ne: 'completed' }
  }).populate('assignedTo', 'name email')
    .populate('project', 'name')
    .sort({ dueDate: 1 });
};

TaskSchema.statics.updateProjectProgress = async function(projectId) {
  try {
    const Project = mongoose.model('Project');
    
    // Obtener todas las tareas del proyecto
    const tasks = await this.find({ project: projectId });
    
    if (tasks.length === 0) {
      return;
    }
    
    // Calcular progreso promedio
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const averageProgress = Math.round(totalProgress / tasks.length);
    
    // Actualizar progreso del proyecto
    await Project.findByIdAndUpdate(projectId, {
      progress: averageProgress
    });
    
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
};

TaskSchema.statics.reorderTasks = async function(projectId, status, taskIds) {
  try {
    const bulkOps = taskIds.map((taskId, index) => ({
      updateOne: {
        filter: { _id: taskId, project: projectId },
        update: { 
          status: status,
          position: index
        }
      }
    }));
    
    return await this.bulkWrite(bulkOps);
  } catch (error) {
    console.error('Error reordering tasks:', error);
    throw error;
  }
};

module.exports = mongoose.model('Task', TaskSchema);