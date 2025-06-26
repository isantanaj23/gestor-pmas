// ===== ARCHIVO: server/routes/tasks.js =====
const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Obtener tareas del proyecto (para el Kanban)
// @route   GET /api/projects/:projectId/tasks
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verificar que el proyecto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar acceso al proyecto
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las tareas de este proyecto'
      });
    }

    // Obtener tareas del proyecto
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ position: 1, createdAt: -1 });

    console.log(`📋 Tareas obtenidas para proyecto ${projectId}: ${tasks.length}`);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener tareas'
    });
  }
});

// @desc    Crear nueva tarea
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres'),
  body('project')
    .notEmpty()
    .withMessage('El proyecto es requerido'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Prioridad inválida'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'review', 'completed'])
    .withMessage('Estado inválido')
], async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { project: projectId } = req.body;

    // Verificar que el proyecto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos para crear tareas
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => 
                       member.user.toString() === req.user._id.toString() && 
                       member.permissions.canCreateTasks
                     ) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear tareas en este proyecto'
      });
    }

    // Agregar datos del usuario
    req.body.createdBy = req.user._id;

    // Si no se especifica assignedTo, asignar al creador
    if (!req.body.assignedTo) {
      req.body.assignedTo = req.user._id;
    }

    const task = await Task.create(req.body);

    // Poblar los datos
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'name' }
    ]);

    console.log(`✅ Tarea creada: ${task.title} en proyecto ${project.name}`);

    // Actualizar progreso del proyecto
    await project.calculateProgress();

    // Emit notificación en tiempo real
    const io = req.app.get('io');
    io.to(`project-${projectId}`).emit('task-created', {
      task: task,
      user: req.user.getPublicProfile(),
      project: { _id: project._id, name: project.name }
    });

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: task
    });

  } catch (error) {
    console.error('Error al crear tarea:', error);
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear tarea'
    });
  }
});

// @desc    Actualizar tarea
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar acceso a través del proyecto
    const project = await Project.findById(task.project);
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => 
                       member.user.toString() === req.user._id.toString() && 
                       member.permissions.canEditTasks
                     ) ||
                     task.assignedTo.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar esta tarea'
      });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'name' }
    ]);

    console.log(`✅ Tarea actualizada: ${task.title}`);

    // Actualizar progreso del proyecto si cambió el estado
    if (req.body.status) {
      await project.calculateProgress();
    }

    // Emit notificación en tiempo real
    const io = req.app.get('io');
    io.to(`project-${task.project._id}`).emit('task-updated', {
      task: task,
      user: req.user.getPublicProfile(),
      action: 'updated'
    });

    res.status(200).json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      data: task
    });

  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar tarea'
    });
  }
});

// @desc    Mover tarea entre columnas del Kanban
// @route   PATCH /api/tasks/:id/move
// @access  Private
router.patch('/:id/move', protect, [
  body('status')
    .isIn(['pending', 'in-progress', 'review', 'completed'])
    .withMessage('Estado inválido'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La posición debe ser un número positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { status, position } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar acceso
    const project = await Project.findById(task.project);
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => 
                       member.user.toString() === req.user._id.toString() && 
                       member.permissions.canEditTasks
                     ) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para mover esta tarea'
      });
    }

    await task.moveToStatus(status, position);

    // Poblar datos actualizados
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'name' }
    ]);

    console.log(`🔄 Tarea movida: ${task.title} -> ${status}`);

    // Emit notificación en tiempo real
    const io = req.app.get('io');
    io.to(`project-${task.project._id}`).emit('task-moved', {
      task: task,
      user: req.user.getPublicProfile(),
      oldStatus: task.status,
      newStatus: status
    });

    res.status(200).json({
      success: true,
      message: 'Tarea movida exitosamente',
      data: task
    });

  } catch (error) {
    console.error('Error al mover tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al mover tarea'
    });
  }
});

// @desc    Eliminar tarea
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar permisos
    const project = await Project.findById(task.project);
    const canDelete = project.owner.toString() === req.user._id.toString() ||
                     task.createdBy.toString() === req.user._id.toString() ||
                     project.team.some(member => 
                       member.user.toString() === req.user._id.toString() && 
                       member.permissions.canDeleteTasks
                     ) ||
                     req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta tarea'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Tarea eliminada: ${task.title}`);

    // Actualizar progreso del proyecto
    await project.calculateProgress();

    // Emit notificación en tiempo real
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task-deleted', {
      taskId: task._id,
      user: req.user.getPublicProfile(),
      project: { _id: project._id, name: project.name }
    });

    res.status(200).json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar tarea'
    });
  }
});

// @desc    Agregar comentario a tarea
// @route   POST /api/tasks/:id/comments
// @access  Private
router.post('/:id/comments', protect, [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('El comentario debe tener entre 1 y 500 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { text } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar acceso
    const project = await Project.findById(task.project);
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para comentar en esta tarea'
      });
    }

    await task.addComment(req.user._id, text);
    
    // Poblar datos actualizados
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'comments.user', select: 'name email avatar' }
    ]);

    console.log(`💬 Comentario agregado a tarea: ${task.title}`);

    // Emit notificación en tiempo real
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task-commented', {
      task: task,
      comment: task.comments[task.comments.length - 1],
      user: req.user.getPublicProfile()
    });

    res.status(200).json({
      success: true,
      message: 'Comentario agregado exitosamente',
      data: task
    });

  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar comentario'
    });
  }
});

// @desc    Obtener mis tareas asignadas
// @route   GET /api/tasks/my-tasks
// @access  Private
router.get('/my-tasks', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name')
      .populate('createdBy', 'name email avatar')
      .sort({ dueDate: 1, createdAt: -1 });

    console.log(`📋 Mis tareas obtenidas para ${req.user.email}: ${tasks.length}`);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Error al obtener mis tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener tareas'
    });
  }
});

module.exports = router;