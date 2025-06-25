const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Obtener todos los proyectos del usuario
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.getProjectsByUser(req.user.id);
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener proyectos'
    });
  }
};

// @desc    Obtener un proyecto específico
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('team.user', 'name email avatar role')
      .populate('taskCount');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar que el usuario tiene acceso al proyecto
    const hasAccess = project.owner._id.toString() === req.user.id ||
                     project.team.some(member => member.user._id.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este proyecto'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener proyecto'
    });
  }
};

// @desc    Crear nuevo proyecto
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    // Agregar el owner del proyecto
    req.body.owner = req.user.id;

    const project = await Project.create(req.body);

    // Poblar los datos del owner
    await project.populate('owner', 'name email avatar');

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    
    // Errores de validación
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear proyecto'
    });
  }
};

// @desc    Actualizar proyecto
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos (solo owner o admin)
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este proyecto'
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('owner', 'name email avatar')
      .populate('team.user', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar proyecto'
    });
  }
};

// @desc    Eliminar proyecto
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos (solo owner o admin)
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este proyecto'
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar proyecto'
    });
  }
};

// @desc    Agregar miembro al equipo
// @route   POST /api/projects/:id/team
// @access  Private
exports.addTeamMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para agregar miembros'
      });
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await project.addTeamMember(userId, role);
    await project.populate('team.user', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error al agregar miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar miembro'
    });
  }
};

// @desc    Actualizar progreso del proyecto
// @route   PATCH /api/projects/:id/progress
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    
    const project = await Project.findById(req.params.id);
    
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

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este proyecto'
      });
    }

    await project.updateProgress(progress);

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar progreso'
    });
  }
};