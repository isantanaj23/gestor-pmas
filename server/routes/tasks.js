const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth'); 
const mongoose = require('mongoose');
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

// Agregar esta ruta a tu archivo server/routes/tasks.js

// @desc    Obtener detalles de una tarea específica
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    console.log('🔍 Buscando tarea con ID:', taskId);

    // Verificar si es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tarea inválido'
      });
    }

    // Buscar la tarea con datos poblados
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name')
      .populate('comments.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar permisos - el usuario debe tener acceso al proyecto
    const project = await Project.findById(task.project._id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto asociado no encontrado'
      });
    }

    // Verificar acceso al proyecto
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta tarea'
      });
    }

    console.log('✅ Tarea encontrada:', task.title);

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('❌ Error al obtener detalles de tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener detalles de tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Actualizar una tarea específica
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    console.log('🔍 Actualizando tarea con ID:', taskId);

    // Verificar si es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tarea inválido'
      });
    }

    // Buscar la tarea
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar permisos - el usuario debe tener acceso al proyecto
    const project = await Project.findById(task.project);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto asociado no encontrado'
      });
    }

    // Verificar acceso al proyecto
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta tarea'
      });
    }

    // Actualizar campos
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;

    // Guardar cambios
    await task.save();

    // Poblar datos para la respuesta
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name');

    console.log('✅ Tarea actualizada:', task.title);

    res.status(200).json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      data: task
    });

  } catch (error) {
    console.error('❌ Error al actualizar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔥 AGREGAR ESTA RUTA AL FINAL DE server/routes/tasks.js (antes de module.exports)

// @desc    Eliminar una tarea
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    console.log('🗑️ Eliminando tarea:', taskId);
    console.log('👤 Usuario:', userId);

    // Verificar que la tarea existe
    const task = await Task.findById(taskId).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar permisos: solo el creador, el asignado, o el owner del proyecto pueden eliminar
    const canDelete = 
      task.createdBy.toString() === userId ||
      task.assignedTo?.toString() === userId ||
      task.project.owner.toString() === userId ||
      req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta tarea'
      });
    }

    // Eliminar la tarea
    await Task.findByIdAndDelete(taskId);

    console.log('✅ Tarea eliminada exitosamente');

    res.status(200).json({
      success: true,
      message: 'Tarea eliminada exitosamente',
      data: { deletedTaskId: taskId }
    });

  } catch (error) {
    console.error('❌ Error eliminando tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar la tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router;