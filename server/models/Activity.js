const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  // Información básica
  title: {
    type: String,
    required: [true, 'El título de la actividad es obligatorio'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  description: {
    type: String,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  
  // Tipo de actividad
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'note', 'task', 'demo', 'proposal', 'follow-up'],
    required: [true, 'El tipo de actividad es obligatorio']
  },
  
  // Estado
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  
  // Prioridad
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Fechas y tiempo
  scheduledDate: {
    type: Date,
    required: [true, 'La fecha programada es obligatoria']
  },
  completedDate: {
    type: Date
  },
  duration: {
    type: Number, // en minutos
    min: 0
  },
  
  // Relaciones
  contact: {
    type: mongoose.Schema.ObjectId,
    ref: 'Contact',
    required: [true, 'La actividad debe estar asociada a un contacto']
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  
  // Resultado de la actividad
  outcome: {
    type: String,
    enum: ['successful', 'no-answer', 'not-interested', 'reschedule', 'follow-up-needed', 'converted'],
  },
  outcomeNotes: {
    type: String,
    maxlength: [500, 'Las notas del resultado no pueden exceder 500 caracteres']
  },
  
  // Información adicional para diferentes tipos
  activityData: {
    // Para llamadas
    phoneNumber: String,
    callDuration: Number,
    
    // Para emails
    emailSubject: String,
    emailSent: Boolean,
    emailOpened: Boolean,
    emailReplied: Boolean,
    
    // Para reuniones
    meetingLocation: String,
    meetingLink: String,
    meetingType: {
      type: String,
      enum: ['in-person', 'video-call', 'phone-call']
    },
    
    // Para propuestas
    proposalValue: Number,
    proposalSent: Boolean,
    proposalAccepted: Boolean,
    
    // Para demos
    demoProduct: String,
    demoFeedback: String
  },
  
  // Recordatorios
  reminders: [{
    time: {
      type: Number, // minutos antes de la actividad
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  
  // Archivos adjuntos
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Seguimiento automático
  autoFollowUp: {
    enabled: {
      type: Boolean,
      default: false
    },
    days: {
      type: Number,
      min: 1,
      max: 365
    },
    type: {
      type: String,
      enum: ['call', 'email', 'task']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar performance
ActivitySchema.index({ contact: 1, scheduledDate: 1 });
ActivitySchema.index({ owner: 1, status: 1 });
ActivitySchema.index({ scheduledDate: 1 });
ActivitySchema.index({ type: 1, status: 1 });

// Virtual para verificar si está vencida
ActivitySchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > new Date(this.scheduledDate);
});

// Virtual para tiempo hasta la actividad
ActivitySchema.virtual('timeUntilActivity').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return null;
  }
  
  const now = new Date();
  const scheduled = new Date(this.scheduledDate);
  const diffTime = scheduled - now;
  
  if (diffTime < 0) return 'Vencida';
  
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) return `${diffDays} días`;
  if (diffHours > 0) return `${diffHours} horas`;
  return 'Muy pronto';
});

// Middleware pre-save
ActivitySchema.pre('save', function(next) {
  // Auto-completar fecha cuando se marca como completada
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  
  // Crear seguimiento automático si está habilitado
  if (this.isModified('status') && this.status === 'completed' && this.autoFollowUp.enabled) {
    this.createAutoFollowUp();
  }
  
  next();
});

// Middleware post-save para actualizar último contacto
ActivitySchema.post('save', async function() {
  if (this.status === 'completed') {
    try {
      const Contact = mongoose.model('Contact');
      await Contact.findByIdAndUpdate(this.contact, {
        lastContactDate: this.completedDate || new Date()
      });
    } catch (error) {
      console.error('Error updating contact last contact date:', error);
    }
  }
});

// Métodos de instancia
ActivitySchema.methods.complete = function(outcome, notes) {
  this.status = 'completed';
  this.completedDate = new Date();
  if (outcome) this.outcome = outcome;
  if (notes) this.outcomeNotes = notes;
  
  return this.save();
};

ActivitySchema.methods.reschedule = function(newDate) {
  this.status = 'rescheduled';
  this.scheduledDate = newDate;
  return this.save();
};

ActivitySchema.methods.addReminder = function(minutesBefore) {
  this.reminders.push({
    time: minutesBefore,
    sent: false
  });
  return this.save();
};

ActivitySchema.methods.createAutoFollowUp = async function() {
  if (!this.autoFollowUp.enabled) return;
  
  const followUpDate = new Date(this.completedDate || new Date());
  followUpDate.setDate(followUpDate.getDate() + this.autoFollowUp.days);
  
  const Activity = this.constructor;
  
  const followUpActivity = new Activity({
    title: `Seguimiento automático - ${this.title}`,
    description: `Seguimiento generado automáticamente de: ${this.title}`,
    type: this.autoFollowUp.type,
    scheduledDate: followUpDate,
    contact: this.contact,
    owner: this.owner,
    priority: 'medium'
  });
  
  return followUpActivity.save();
};

// Métodos estáticos
ActivitySchema.statics.getActivitiesByContact = function(contactId) {
  return this.find({ contact: contactId })
    .populate('owner', 'name email')
    .sort({ scheduledDate: -1 });
};

ActivitySchema.statics.getUpcomingActivities = function(ownerId, days = 7) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    owner: ownerId,
    status: 'pending',
    scheduledDate: {
      $gte: new Date(),
      $lte: endDate
    }
  }).populate('contact', 'firstName lastName company')
    .sort({ scheduledDate: 1 });
};

ActivitySchema.statics.getOverdueActivities = function(ownerId) {
  return this.find({
    owner: ownerId,
    status: 'pending',
    scheduledDate: { $lt: new Date() }
  }).populate('contact', 'firstName lastName company')
    .sort({ scheduledDate: 1 });
};

ActivitySchema.statics.getActivityStats = function(ownerId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(ownerId), // ← CORREGIDO
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);
};

module.exports = mongoose.model('Activity', ActivitySchema);