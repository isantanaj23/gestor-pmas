const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =================================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =================================================================
const protect = async (req, res, next) => {
  let token;
  
  try {
    // 1. Verificar si existe token en headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // 2. Verificar que existe token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No tienes autorización para acceder a esta ruta'
      });
    }
    
    // 3. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Buscar usuario actual
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // 5. Verificar que el usuario esté activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }
    
    // 6. Agregar usuario a request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// =================================================================
// MIDDLEWARE DE AUTORIZACIÓN POR ROLES
// =================================================================
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rol ${req.user.role} no tiene autorización para acceder a esta ruta`
      });
    }
    
    next();
  };
};

// =================================================================
// HELPER PARA GENERAR JWT
// =================================================================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// =================================================================
// HELPER PARA ENVIAR TOKEN EN RESPUESTA
// =================================================================
const sendTokenResponse = (user, statusCode, res, message = 'Operación exitosa') => {
  // Generar token
  const token = generateToken(user._id);
  
  // Opciones de cookie
  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };
  
  // Remover password de respuesta
  const userResponse = { ...user.toObject() };
  delete userResponse.password;
  
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      user: userResponse
    });
};

module.exports = {
  protect,
  authorize,
  generateToken,
  sendTokenResponse
};