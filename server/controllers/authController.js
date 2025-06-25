const User = require('../models/User');
const { sendTokenResponse } = require('../middleware/auth');
const crypto = require('crypto');

// =================================================================
// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public
// =================================================================
const register = async (req, res) => {
  try {
    const { name, email, password, role, position, department } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }
    
    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'developer',
      position,
      department: department || 'development'
    });
    
    console.log(`✅ Usuario registrado: ${user.email}`);
    
    // Enviar token de respuesta
    sendTokenResponse(user, 201, res, 'Usuario registrado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors
      });
    }
    
    // Error de email duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// =================================================================
// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
// =================================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona email y contraseña'
      });
    }
    
    // Buscar usuario por email (incluyendo password)
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Verificar contraseña
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Verificar que el usuario esté activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacta al administrador'
      });
    }
    
    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();
    
    console.log(`✅ Login exitoso: ${user.email}`);
    
    // Enviar token de respuesta
    sendTokenResponse(user, 200, res, 'Login exitoso');
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// =================================================================
// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
// =================================================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// =================================================================
// @desc    Cerrar sesión
// @route   POST /api/auth/logout
// @access  Private
// =================================================================
const logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    
    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};