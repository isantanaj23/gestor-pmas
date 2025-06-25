const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  // Información básica
  firstName: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true,
    maxlength: [50, 'El apellido no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingresa un email válido'
    ]
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'El teléfono no puede exceder 20 caracteres']
  },
  
  // Información profesional
  company: {
    type: String,
    required: [true, 'La empresa es obligatoria'],
    trim: true,
    maxlength: [100, 'La empresa no puede exceder 100 caracteres']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'El cargo no puede exceder 100 caracteres']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'El departamento no puede exceder 50 caracteres']
  },
  
  // Pipeline CRM
  stage: {
    type: String,
    enum: ['lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
    default: 'lead'
  },
  source: {
    type: String,
    enum: ['website', 'social-media', 'referral', 'cold-call', 'event', 'advertisement', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Valor y potencial
  estimatedValue: {
    type: Number,
    min: 0,
    default: 0
  },
  actualValue: {
    type: Number,
    min: 0,
    default: 0
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  // Información adicional
  notes: {
    type: String,
    maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  
  // Fechas importantes
  lastContactDate: {
    type: Date
  },
  nextFollowUpDate: {
    type: Date
  },
  convertedDate: {
    type: Date
  },
  
  // Relación con usuario (owner del contacto)
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Información de seguimiento
  isActive: {
    type: Boolean,
    default: true
  },
  isQualified: {
    type: Boolean,
    default: false
  },
  
  // Social media y contacto adicional
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    website: String
  },
  
  // Dirección
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar performance
ContactSchema.index({ email: 1 });
ContactSchema.index({ owner: 1, stage: 1 });
ContactSchema.index({ company: 1 });
ContactSchema.index({ lastContactDate: 1 });
ContactSchema.index({ nextFollowUpDate: 1 });

// Virtual para nombre completo
ContactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual para días desde último contacto
ContactSchema.virtual('daysSinceLastContact').get(function() {
  if (!this.lastContactDate) return null;
  
  const today = new Date();
  const lastContact = new Date(this.lastContactDate);
  const diffTime = Math.abs(today - lastContact);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual para verificar si necesita seguimiento
ContactSchema.virtual('needsFollowUp').get(function() {
  if (!this.nextFollowUpDate) return false;
  return new Date() >= new Date(this.nextFollowUpDate);
});

// Middleware pre-save
ContactSchema.pre('save', function(next) {
  // Auto-actualizar fecha de conversión
  if (this.isModified('stage') && (this.stage === 'closed-won')) {
    this.convertedDate = new Date();
    this.isQualified = true;
  }
  
  // Auto-actualizar fecha de último contacto cuando cambia el stage
  if (this.isModified('stage') && this.stage !== 'lead') {
    this.lastContactDate = new Date();
  }
  
  next();
});

// Métodos de instancia
ContactSchema.methods.moveToStage = function(newStage) {
  const previousStage = this.stage;
  this.stage = newStage;
  
  // Actualizar probabilidad basada en el stage
  const stageProbabilities = {
    'lead': 10,
    'contacted': 25,
    'qualified': 40,
    'proposal': 60,
    'negotiation': 80,
    'closed-won': 100,
    'closed-lost': 0
  };
  
  this.probability = stageProbabilities[newStage] || this.probability;
  
  return this.save();
};

ContactSchema.methods.addNote = function(note) {
  if (this.notes) {
    this.notes += `\n\n[${new Date().toLocaleString()}] ${note}`;
  } else {
    this.notes = `[${new Date().toLocaleString()}] ${note}`;
  }
  return this.save();
};

ContactSchema.methods.scheduleFollowUp = function(date) {
  this.nextFollowUpDate = date;
  return this.save();
};

// Métodos estáticos
ContactSchema.statics.getContactsByStage = function(ownerId, stage) {
  return this.find({ owner: ownerId, stage: stage, isActive: true })
    .sort({ lastContactDate: -1 });
};

ContactSchema.statics.getContactsByOwner = function(ownerId) {
  return this.find({ owner: ownerId, isActive: true })
    .sort({ lastContactDate: -1 });
};

ContactSchema.statics.getOverdueFollowUps = function(ownerId) {
  return this.find({
    owner: ownerId,
    isActive: true,
    nextFollowUpDate: { $lte: new Date() }
  }).sort({ nextFollowUpDate: 1 });
};

ContactSchema.statics.getPipelineStats = function(ownerId) {
  return this.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(ownerId), isActive: true } },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalValue: { $sum: '$estimatedValue' },
        avgProbability: { $avg: '$probability' }
      }
    }
  ]);
};

module.exports = mongoose.model('Contact', ContactSchema);