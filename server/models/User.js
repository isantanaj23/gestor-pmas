const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Información básica
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingresa un email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir en queries por defecto
  },
  
  // Información del perfil
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'developer', 'designer', 'client'],
    default: 'developer'
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'El cargo no puede tener más de 100 caracteres']
  },
  department: {
    type: String,
    enum: ['development', 'design', 'marketing', 'sales', 'management'],
    default: 'development'
  },
  
  // Configuración y estado
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Configuraciones de usuario
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      desktop: { type: Boolean, default: false }
    }
  },
  
  // Tokens para reset de password
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// =================================================================
// MIDDLEWARE PRE-SAVE - Encriptar contraseña
// =================================================================
userSchema.pre('save', async function(next) {
  // Solo hashear la contraseña si fue modificada
  if (!this.isModified('password')) {
    next();
  }
  
  // Generar salt y hashear contraseña
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// =================================================================
// MÉTODOS DE INSTANCIA
// =================================================================

// Comparar contraseña ingresada con la hasheada
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generar token para reset de contraseña
userSchema.methods.getResetPasswordToken = function() {
  const crypto = require('crypto');
  
  // Generar token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hashear token y guardarlo
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Configurar expiración (10 minutos)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// =================================================================
// MÉTODOS ESTÁTICOS
// =================================================================

// Buscar usuario por email (incluyendo password)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password');
};

// Obtener usuarios activos
userSchema.statics.getActiveUsers = function() {
  return this.find({ isActive: true });
};

// =================================================================
// VIRTUALS
// =================================================================

// Nombre completo virtual (si en el futuro separamos firstName/lastName)
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Información pública del usuario (sin datos sensibles)
userSchema.virtual('publicProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    position: this.position,
    department: this.department,
    isActive: this.isActive
  };
});

// =================================================================
// ÍNDICES
// =================================================================
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);