// ===== ARCHIVO: server/routes/users.js =====
const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Obtener todos los usuarios (para agregar al equipo)
// @route   GET /api/users
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, department, limit = 50 } = req.query;
    
    let query = { isActive: true };
    
    // Filtrar por búsqueda
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filtrar por departamento
    if (department) {
      query.department = department;
    }
    
    const users = await User.find(query)
      .select('name email avatar department role')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    console.log(`👥 Usuarios obtenidos: ${users.length}`);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener usuarios'
    });
  }
});

// @desc    Obtener usuario específico
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email avatar department role createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener usuario'
    });
  }
});

module.exports = router;