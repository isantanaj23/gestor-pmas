const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// 🔥 PATCH /api/tasks/:id/move - Mover tarea (lo más importante)
router.patch('/:id/move', async (req, res) => {
  try {
    const Task = require('../models/Task');
    const { status, position } = req.body;
    
    console.log('🔄 Moviendo tarea:', req.params.id, 'a estado:', status);
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Actualizar estado
    task.status = status;
    if (position !== undefined) {
      task.position = position;
    }
    
    await task.save();

    console.log('✅ Tarea movida exitosamente');

    res.status(200).json({
      success: true,
      message: 'Tarea movida exitosamente',
      data: task
    });
  } catch (error) {
    console.error('❌ Error moviendo tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al mover tarea'
    });
  }
});

// 🔥 POST /api/tasks - Crear tarea
router.post('/', async (req, res) => {
  try {
    const Task = require('../models/Task');
    
    console.log('📝 Creando tarea:', req.body);

    // Agregar datos del usuario
    req.body.createdBy = req.user.id;
    if (!req.body.assignedTo) {
      req.body.assignedTo = req.user.id;
    }

    const task = await Task.create(req.body);
    
    console.log('✅ Tarea creada:', task.title);

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: task
    });

  } catch (error) {
    console.error('❌ Error creando tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear tarea'
    });
  }
});

// 🔥 GET /api/tasks/my-tasks - Mis tareas
router.get('/my-tasks', async (req, res) => {
  try {
    const Task = require('../models/Task');
    
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('❌ Error obteniendo mis tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

module.exports = router;