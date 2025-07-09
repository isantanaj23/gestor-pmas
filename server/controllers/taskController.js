// server/controllers/taskController.js
const Task = require('../models/Task');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// @desc    Obtener todas las tareas de un proyecto
// @route   GET /api/projects/:projectId/tasks
// @access  Private
exports.getProjectTasks = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { status } = req.query;

    console.log('🔍 ProjectId recibido:', projectId);
    console.log('🔍 Usuario actual:', req.user.id);

    // Verificar si es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      console.log('❌ ProjectId no es un ObjectId válido:', projectId);
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    // Verificar que el proyecto existe y el usuario tiene acceso
    const project = await Project.findById(projectId);

    console.log('🔍 Proyecto encontrado:', project ? 'SÍ' : 'NO');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar acceso al proyecto
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     req.user.role === 'admin';

    console.log('🔍 Tiene acceso:', hasAccess);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las tareas de este proyecto'
      });
    }

    // Buscar tareas del proyecto directamente (sin método estático que puede fallar)
    let query = { project: projectId };
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .sort({ position: 1, createdAt: -1 });

    console.log('✅ Tareas encontradas:', tasks.length);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('❌ Error completo al obtener tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener tareas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Obtener una tarea específica
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tarea inválido'
      });
    }

    const task = await Task.findById(taskId)
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar acceso a través del proyecto
    const project = await Project.findById(task.project._id);
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta tarea'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Error al obtener tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Crear nueva tarea
// @route   POST /api/projects/:projectId/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const projectId = req.params.id;

    console.log('🔍 Creando tarea en proyecto:', projectId);
    console.log('🔍 Datos recibidos:', req.body);

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    // Verificar que el proyecto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos para crear tareas
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear tareas en este proyecto'
      });
    }

    // Agregar datos del proyecto y usuario
    req.body.project = projectId;
    req.body.createdBy = req.user.id;

    // Si no se especifica assignedTo, asignar al creador
    if (!req.body.assignedTo) {
      req.body.assignedTo = req.user.id;
    }

    const task = await Task.create(req.body);

    // Poblar los datos
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'name' }
    ]);

    console.log('✅ Tarea creada exitosamente:', task.title);

    // 🔔 NOTIFICACIÓN EN TIEMPO REAL: Nueva tarea creada
    if (global.socketHandler) {
      // Notificar a los miembros del proyecto
      global.socketHandler.notifyProjectMembers(projectId, 'task_created', {
        task,
        message: `Nueva tarea creada: ${task.title}`,
        createdBy: req.user.name
      });

      // Si la tarea está asignada a alguien más, notificar
      if (task.assignedTo._id.toString() !== req.user.id) {
        global.socketHandler.notifyTaskAssigned(task.assignedTo._id, task);
      }
    }

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Error al crear tarea:', error);
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Actualizar tarea
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tarea inválido'
      });
    }

    let task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar acceso a través del proyecto
    const project = await Project.findById(task.project);
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     task.assignedTo.toString() === req.user.id ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar esta tarea'
      });
    }

    // Guardar datos anteriores para notificaciones
    const previousData = {
      assignedTo: task.assignedTo.toString(),
      status: task.status
    };

    task = await Task.findByIdAndUpdate(taskId, req.body, {
      new: true,
      runValidators: true
    }).populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'name' }
    ]);

    // 🔔 NOTIFICACIÓN EN TIEMPO REAL: Tarea actualizada
    if (global.socketHandler) {
      global.socketHandler.notifyProjectMembers(project._id, 'task_updated', {
        taskId: task._id,
        update: req.body,
        action: 'updated',
        updatedBy: {
          id: req.user.id,
          name: req.user.name
        }
      });

      // Si se cambió el asignado, notificar al nuevo usuario
      if (req.body.assignedTo && req.body.assignedTo !== previousData.assignedTo) {
        global.socketHandler.notifyTaskAssigned(req.body.assignedTo, task);
      }
    }

    console.log('✅ Tarea actualizada exitosamente:', task.title);

    res.status(200).json({
      success: true,
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
};

// @desc    Eliminar tarea
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tarea inválido'
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar acceso a través del proyecto
    const project = await Project.findById(task.project);
    const hasAccess = project.owner.toString() === req.user.id ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta tarea'
      });
    }

    await Task.findByIdAndDelete(taskId);

    // 🔔 NOTIFICACIÓN EN TIEMPO REAL: Tarea eliminada
    if (global.socketHandler) {
      global.socketHandler.notifyProjectMembers(project._id, 'task_deleted', {
        taskId: taskId,
        taskTitle: task.title,
        deletedBy: {
          id: req.user.id,
          name: req.user.name
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Mover tarea entre estados
// @route   PATCH /api/tasks/:id/move
// @access  Private
exports.moveTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status, position } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tarea inválido'
      });
    }
    
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar acceso
    const project = await Project.findById(task.project);
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     task.assignedTo.toString() === req.user.id ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para mover esta tarea'
      });
    }

    // Actualizar tarea
    task.status = status;
    if (position !== undefined) {
      task.position = position;
    }

    // Si se completa la tarea, marcar fecha de completado
    if (status === 'completed' && task.status !== 'completed') {
      task.completedDate = new Date();
    }

    await task.save();
    
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' }
    ]);

    // 🔔 NOTIFICACIÓN EN TIEMPO REAL: Tarea movida
    if (global.socketHandler) {
      global.socketHandler.notifyProjectMembers(project._id, 'task_moved', {
        taskId: task._id,
        newStatus: status,
        position,
        movedBy: {
          id: req.user.id,
          name: req.user.name
        }
      });
    }

    console.log('✅ Tarea movida exitosamente:', task.title, '->', status);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Error al mover tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al mover tarea',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Agregar comentario a tarea
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tarea inválido'
      });
    }
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El comentario no puede estar vacío'
      });
    }
    
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Agregar comentario
    task.comments.push({
      user: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    });

    await task.save();
    await task.populate('comments.user', 'name avatar');

    // 🔔 NOTIFICACIÓN EN TIEMPO REAL: Nuevo comentario
    if (global.socketHandler) {
      const project = await Project.findById(task.project);
      global.socketHandler.notifyProjectMembers(project._id, 'new_comment', {
        taskId: task._id,
        comment: {
          text: text.trim(),
          user: {
            id: req.user.id,
            name: req.user.name,
            avatar: req.user.avatar
          },
          createdAt: new Date()
        }
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Error al agregar comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar comentario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Obtener tareas del usuario actual
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { assignedTo: req.user.id };
    if (status) {
      query.status = status;
    }
    
    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, priority: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('❌ Error al obtener mis tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener mis tareas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Actualizar checklist de tarea
// @route   PATCH /api/tasks/:id/checklist/:itemId
// @access  Private
exports.toggleChecklistItem = async (req, res) => {
  try {
    const taskId = req.params.id;
    const itemId = req.params.itemId;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de tarea inválido'
      });
    }

    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    const item = task.checklist.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item del checklist no encontrado'
      });
    }

    item.completed = !item.completed;
    item.completedBy = item.completed ? req.user.id : null;
    item.completedAt = item.completed ? new Date() : null;

    await task.save();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Error al actualizar checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar checklist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};