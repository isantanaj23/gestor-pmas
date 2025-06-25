const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Obtener todas las tareas de un proyecto
// @route   GET /api/projects/:projectId/tasks
// @access  Private
exports.getProjectTasks = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { status } = req.query;



    // 🔍 DEBUG: Logs temporales
    console.log('🔍 ProjectId recibido:', projectId);
    console.log('🔍 Usuario actual:', req.user.id);






    // Verificar que el proyecto existe y el usuario tiene acceso
    const project = await Project.findById(projectId);


      // 🔍 DEBUG: Log del proyecto encontrado
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

    const tasks = await Task.getTasksByProject(projectId, status);

    console.log('✅ Tareas encontradas:', tasks.length);

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
};

// @desc    Obtener una tarea específica
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
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
    console.error('Error al obtener tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener tarea'
    });
  }
};

// @desc    Crear nueva tarea
// @route   POST /api/projects/:projectId/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const projectId = req.params.id;;

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

    res.status(201).json({
      success: true,
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
};

// @desc    Actualizar tarea
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
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

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar tarea'
    });
  }
};

// @desc    Eliminar tarea
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
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
    const canDelete = project.owner.toString() === req.user.id ||
                     task.createdBy.toString() === req.user.id ||
                     req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta tarea'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

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
};

// @desc    Mover tarea entre columnas del Kanban
// @route   PATCH /api/tasks/:id/move
// @access  Private
exports.moveTask = async (req, res) => {
  try {
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
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para mover esta tarea'
      });
    }

    await task.moveToStatus(status, position);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error al mover tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al mover tarea'
    });
  }
};

// @desc    Agregar comentario a tarea
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    await task.addComment(req.user.id, text);
    await task.populate('comments.user', 'name avatar');

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar comentario'
    });
  }
};

// @desc    Actualizar checklist de tarea
// @route   PATCH /api/tasks/:id/checklist/:itemId
// @access  Private
exports.toggleChecklistItem = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    await task.toggleChecklistItem(req.params.itemId, req.user.id);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error al actualizar checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar checklist'
    });
  }
};

// @desc    Obtener tareas del usuario actual
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;
    
    const tasks = await Task.getTasksByUser(req.user.id, status);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error al obtener mis tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener mis tareas'
    });
  }
};