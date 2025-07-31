const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(protect);

// =================================================================
// RUTAS BÁSICAS QUE FUNCIONAN - SIN IMPORTAR CONTROLADORES EXTERNOS
// =================================================================

// 🔥 GET /api/projects - Obtener todos los proyectos
router.get('/', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    // Usar el método estático que sabemos que existe
    const projects = await Project.getProjectsByUser(req.user.id);
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener proyectos'
    });
  }
});

// 🔥 GET /api/projects/:id - Obtener un proyecto específico
router.get('/:id', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('team.user', 'name email avatar role');

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
    console.error('Error obteniendo proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener proyecto'
    });
  }
});

// 🔥 GET /api/projects/:id/tasks - Obtener tareas de un proyecto
router.get('/:id/tasks', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Task = require('../models/Task');
    
    // Verificar que el proyecto existe
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
        message: 'No tienes permisos para ver las tareas de este proyecto'
      });
    }

    // Obtener tareas usando el método estático
    const tasks = await Task.getTasksByProject(req.params.id);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener tareas'
    });
  }
});

// 🔥 POST /api/projects - Crear nuevo proyecto
router.post('/', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
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
    console.error('Error creando proyecto:', error);
    
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
});

// 🔥 POST /api/projects/:id/team - Agregar miembro al equipo (ruta existente)
router.post('/:id/team', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const User = require('../models/User');
    
    const { userId, role = 'developer' } = req.body;
    
    console.log('👥 Agregando miembro al proyecto:', {
      projectId: req.params.id,
      userId: userId,
      role: role,
      requestUser: req.user.id
    });
    
    // Validar que se envió userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del usuario es requerido'
      });
    }
    
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
        message: 'No tienes permisos para agregar miembros a este proyecto'
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

    // Verificar que el usuario no está ya en el equipo
    const existingMember = project.team.find(member => member.user.toString() === userId);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es miembro de este proyecto'
      });
    }

    // 🔥 AGREGAR MIEMBRO DIRECTAMENTE (sin usar método del modelo)
    project.team.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });

    await project.save();

    // Poblar datos del equipo actualizado
    await project.populate('owner', 'name email avatar');
    await project.populate('team.user', 'name email avatar');

    // 🆕 Notificar via Socket.IO si está disponible
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.emitToUser(userId, 'added_to_project', {
        projectId: project._id,
        projectName: project.name,
        addedBy: req.user.name,
        role: role
      });

      socketHandler.emitToProject(project._id, 'member_added', {
        projectId: project._id,
        newMember: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: role
        },
        addedBy: {
          _id: req.user.id,
          name: req.user.name
        }
      });
    }

    console.log('✅ Miembro agregado exitosamente');

    res.status(200).json({
      success: true,
      message: 'Miembro agregado al equipo exitosamente',
      data: project
    });
  } catch (error) {
    console.error('❌ Error al agregar miembro al equipo:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar miembro al equipo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔥 PATCH /api/projects/:id/progress - Actualizar progreso
router.patch('/:id/progress', async (req, res) => {
  try {
    const Project = require('../models/Project');
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

    // Usar el método del modelo
    await project.updateProgress(progress);

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar progreso'
    });
  }
});

// @desc    Actualizar proyecto
// @route   PUT /api/projects/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const {
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      budget,
      settings
    } = req.body;

    console.log('📝 === ACTUALIZANDO PROYECTO ===');
    console.log('📝 Project ID:', projectId);
    console.log('📝 Usuario:', req.user.id);
    console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));

    const Project = require('../models/Project');
    
    // Verificar que el proyecto existe
    const project = await Project.findById(projectId);
    
    if (!project) {
      console.log('❌ Proyecto no encontrado:', projectId);
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    console.log('✅ Proyecto encontrado:', project.name);

    // Verificar permisos (solo owner o admin)
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log('❌ Sin permisos. Owner:', project.owner.toString(), 'User:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este proyecto'
      });
    }

    console.log('✅ Permisos verificados');

    // Actualizar campos básicos
    if (name !== undefined) {
      console.log('📝 Actualizando name:', name);
      project.name = name;
    }
    if (description !== undefined) {
      console.log('📝 Actualizando description:', description);
      project.description = description;
    }
    if (status !== undefined) {
      console.log('📝 Actualizando status:', status);
      project.status = status;
    }
    if (priority !== undefined) {
      console.log('📝 Actualizando priority:', priority);
      project.priority = priority;
    }
    if (startDate !== undefined) {
      console.log('📝 Actualizando startDate:', startDate);
      project.startDate = startDate;
    }
    if (endDate !== undefined) {
      console.log('📝 Actualizando endDate:', endDate);
      project.endDate = endDate;
    }
    
    // Actualizar presupuesto
    if (budget) {
      console.log('📝 Actualizando budget:', budget);
      if (!project.budget) project.budget = {};
      if (budget.allocated !== undefined) project.budget.allocated = budget.allocated;
      if (budget.used !== undefined) project.budget.used = budget.used;
    }
    
    // Actualizar configuraciones
    if (settings) {
      console.log('📝 Actualizando settings:', settings);
      if (!project.settings) project.settings = {};
      
      if (settings.allowTaskCreation !== undefined) {
        project.settings.allowTaskCreation = settings.allowTaskCreation;
      }
      if (settings.requireApproval !== undefined) {
        project.settings.requireApproval = settings.requireApproval;
      }
      if (settings.autoAssignTasks !== undefined) {
        project.settings.autoAssignTasks = settings.autoAssignTasks;
      }
      if (settings.enableNotifications !== undefined) {
        project.settings.enableNotifications = settings.enableNotifications;
      }
      if (settings.publicProject !== undefined) {
        project.settings.publicProject = settings.publicProject;
      }
    }

    // Actualizar fecha de modificación
    project.updatedAt = new Date();

    console.log('💾 Guardando proyecto...');
    
    // Guardar cambios
    await project.save();

    console.log('✅ Proyecto guardado');

    // Poblar datos para la respuesta
    await project.populate('owner', 'name email avatar');
    await project.populate('team.user', 'name email avatar');

    console.log('✅ Proyecto actualizado exitosamente');

    res.status(200).json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: project
    });

  } catch (error) {
    console.error('❌ Error actualizando proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar proyecto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =================================================================
// 🆕 RUTAS PARA GESTIÓN DE MIEMBROS Y USUARIOS EN LÍNEA
// =================================================================

// @desc    Obtener miembros del proyecto
// @route   GET /api/projects/:id/members
// @access  Private (Solo miembros del proyecto)
router.get('/:id/members', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role department')
      .populate('team.user', 'name email avatar role department isActive');

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
        message: 'No tienes permisos para ver los miembros de este proyecto'
      });
    }

    // Construir lista de miembros con roles
    const members = [
      // Owner
      {
        ...project.owner.toObject(),
        projectRole: 'owner',
        isOwner: true,
        canBeRemoved: false,
        joinedAt: project.createdAt
      },
      // Team members
      ...project.team.map(teamMember => ({
        ...teamMember.user.toObject(),
        projectRole: teamMember.role,
        isOwner: false,
        canBeRemoved: project.owner._id.toString() === req.user.id || req.user.role === 'admin',
        joinedAt: teamMember.joinedAt
      }))
    ];

    res.status(200).json({
      success: true,
      count: members.length,
      data: {
        projectId: project._id,
        projectName: project.name,
        members: members
      }
    });

  } catch (error) {
    console.error('Error obteniendo miembros del proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener miembros'
    });
  }
});

// @desc    Agregar miembro al proyecto (nueva versión más completa)
// @route   POST /api/projects/:id/members
// @access  Private (Solo owner y admins)
router.post('/:id/members', async (req, res) => {
  try {
    const { userId, role = 'developer' } = req.body;
    const Project = require('../models/Project');
    const User = require('../models/User');

    console.log('👥 Agregando miembro al proyecto (nueva ruta):', { projectId: req.params.id, userId, role });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario es requerido'
      });
    }

    // Verificar que el proyecto existe
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos (solo owner puede agregar miembros)
    const isOwner = project.owner.toString() === req.user.id;

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para agregar miembros a este proyecto'
      });
    }

    // Verificar que el usuario a agregar existe
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el usuario no sea ya owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es el propietario de este proyecto'
      });
    }

    // Verificar que el usuario no sea ya miembro del team
    const isAlreadyMember = project.team.some(member => member.user.toString() === userId);

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es miembro de este proyecto'
      });
    }

    // Agregar miembro al team
    project.team.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });

    await project.save();

    console.log('✅ Miembro agregado exitosamente');

    // Poblar datos para respuesta
    await project.populate('owner', 'name email avatar');
    await project.populate('team.user', 'name email avatar');

    // Notificar via Socket.IO si está disponible
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.emitToUser(userId, 'added_to_project', {
        projectId: project._id,
        projectName: project.name,
        addedBy: req.user.name,
        role: role
      });

      socketHandler.emitToProject(project._id, 'member_added', {
        projectId: project._id,
        newMember: {
          _id: userToAdd._id,
          name: userToAdd.name,
          email: userToAdd.email,
          role: role
        },
        addedBy: {
          _id: req.user.id,
          name: req.user.name
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `${userToAdd.name} fue agregado como ${role} al proyecto`,
      data: {
        project: project,
        addedMember: {
          _id: userToAdd._id,
          name: userToAdd.name,
          email: userToAdd.email,
          role: role
        }
      }
    });

  } catch (error) {
    console.error('Error agregando miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar miembro'
    });
  }
});

// @desc    Remover miembro del proyecto
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private (Solo owner)
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { reason } = req.body;
    const Project = require('../models/Project');
    const User = require('../models/User');

    console.log('🚫 Removiendo miembro del proyecto:', { 
      projectId: req.params.id, 
      memberId, 
      removedBy: req.user.id,
      reason 
    });

    // Verificar que el proyecto existe
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos (solo owner puede remover miembros)
    const isOwner = project.owner.toString() === req.user.id;

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para remover miembros de este proyecto'
      });
    }

    // No se puede remover al owner
    if (project.owner.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'No se puede remover al propietario del proyecto'
      });
    }

    // Obtener información del usuario a remover
    const userToRemove = await User.findById(memberId).select('name email');
    if (!userToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Buscar y remover del team
    const memberIndex = project.team.findIndex(member => member.user.toString() === memberId);
    
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es miembro de este proyecto'
      });
    }

    // Obtener el rol del miembro antes de removerlo
    const memberRole = project.team[memberIndex].role;

    // Remover del team
    project.team.splice(memberIndex, 1);

    await project.save();

    console.log('✅ Miembro removido exitosamente');

    // Notificar via Socket.IO si está disponible
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      // Notificar al usuario removido
      socketHandler.emitToUser(memberId, 'removed_from_project', {
        projectId: project._id,
        projectName: project.name,
        removedBy: req.user.name,
        reason: reason || 'Sin razón especificada'
      });

      // Notificar a todos los miembros del proyecto
      socketHandler.emitToProject(project._id, 'member_removed', {
        projectId: project._id,
        removedMemberId: memberId,
        removedMemberName: userToRemove.name,
        removedBy: {
          _id: req.user.id,
          name: req.user.name
        },
        reason: reason || 'Sin razón especificada',
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: `${userToRemove.name} fue removido del proyecto`,
      data: {
        removedMember: {
          _id: userToRemove._id,
          name: userToRemove.name,
          email: userToRemove.email,
          role: memberRole
        },
        removedBy: {
          _id: req.user.id,
          name: req.user.name
        },
        reason: reason || 'Sin razón especificada',
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error removiendo miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al remover miembro'
    });
  }
});

// @desc    Cambiar rol de miembro
// @route   PATCH /api/projects/:id/members/:memberId/role
// @access  Private (Solo owner)
router.patch('/:id/members/:memberId/role', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { newRole } = req.body;
    const Project = require('../models/Project');
    const User = require('../models/User');

    const validRoles = ['developer', 'designer', 'manager', 'tester', 'admin'];
    
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: `Rol inválido. Use uno de: ${validRoles.join(', ')}`
      });
    }

    // Verificar que el proyecto existe
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Solo el owner puede cambiar roles
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede cambiar roles de miembros'
      });
    }

    // No se puede cambiar el rol del owner
    if (project.owner.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el rol del propietario'
      });
    }

    const userToUpdate = await User.findById(memberId).select('name email');
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Buscar el miembro en el team
    const memberIndex = project.team.findIndex(member => member.user.toString() === memberId);
    
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es miembro de este proyecto'
      });
    }

    // Actualizar el rol
    const oldRole = project.team[memberIndex].role;
    project.team[memberIndex].role = newRole;

    await project.save();

    // Notificar via Socket.IO
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.emitToUser(memberId, 'role_changed', {
        projectId: project._id,
        projectName: project.name,
        oldRole: oldRole,
        newRole: newRole,
        changedBy: req.user.name
      });

      socketHandler.emitToProject(project._id, 'member_role_changed', {
        projectId: project._id,
        memberId: memberId,
        memberName: userToUpdate.name,
        oldRole: oldRole,
        newRole: newRole,
        changedBy: {
          _id: req.user.id,
          name: req.user.name
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Rol de ${userToUpdate.name} cambiado de ${oldRole} a ${newRole}`,
      data: {
        member: {
          _id: userToUpdate._id,
          name: userToUpdate.name,
          email: userToUpdate.email,
          oldRole: oldRole,
          newRole: newRole
        }
      }
    });

  } catch (error) {
    console.error('Error cambiando rol de miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al cambiar rol'
    });
  }
});

// =================================================================
// RUTAS DE DEBUG Y PRUEBAS (mantener las existentes)
// =================================================================

// 🔥 RUTA TEMPORAL PARA DEBUG - Ver todos los proyectos con sus IDs reales
router.get('/debug/list', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    const projects = await Project.find({})
      .populate('owner', 'name email')
      .select('_id name description status progress');

    res.status(200).json({
      success: true,
      message: 'Lista de proyectos para debug',
      count: projects.length,
      data: projects.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        progress: p.progress,
        owner: p.owner?.name || 'No owner'
      }))
    });
  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({
      success: false,
      message: 'Error en debug',
      error: error.message
    });
  }
});

// 🔥 RUTA TEMPORAL PARA CREAR PROYECTOS DE PRUEBA
router.post('/debug/create-samples', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const User = require('../models/User');
    
    // Buscar un usuario existente para ser el owner
    const user = await User.findOne({});
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No hay usuarios en la base de datos. Crea un usuario primero.'
      });
    }

    // Proyectos de prueba
    const sampleProjects = [
      {
        name: 'Proyecto Alpha',
        description: 'Sistema de gestión empresarial con módulos de CRM y facturación',
        status: 'active',
        priority: 'high',
        progress: 75,
        owner: user._id,
        budget: {
          allocated: 50000,
          used: 35000
        }
      },
      {
        name: 'E-commerce Beta',
        description: 'Plataforma de comercio electrónico con sistema de pagos integrado',
        status: 'active',
        priority: 'medium',
        progress: 45,
        owner: user._id,
        budget: {
          allocated: 30000,
          used: 15000
        }
      },
      {
        name: 'App Móvil',
        description: 'Aplicación móvil multiplataforma con React Native',
        status: 'active',
        priority: 'high',
        progress: 95,
        owner: user._id,
        budget: {
          allocated: 25000,
          used: 23000
        }
      },
      {
        name: 'Marketing Q3',
        description: 'Campaña de marketing digital para el tercer trimestre',
        status: 'active',
        priority: 'low',
        progress: 25,
        owner: user._id,
        budget: {
          allocated: 15000,
          used: 3000
        }
      }
    ];

    // Eliminar proyectos existentes del usuario (opcional)
    await Project.deleteMany({ owner: user._id });

    // Crear proyectos de prueba
    const createdProjects = await Project.create(sampleProjects);

    // Poblar los datos
    const populatedProjects = await Project.find({ owner: user._id })
      .populate('owner', 'name email');

    res.status(201).json({
      success: true,
      message: 'Proyectos de prueba creados exitosamente',
      count: createdProjects.length,
      data: populatedProjects.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        progress: p.progress,
        owner: p.owner
      }))
    });

  } catch (error) {
    console.error('Error creando proyectos de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando proyectos de prueba',
      error: error.message
    });
  }
});

// 🔥 RUTA TEMPORAL PARA CREAR USUARIOS DE PRUEBA
router.post('/debug/create-test-users', async (req, res) => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcrypt');
    
    // Usuarios de prueba
    const testUsers = [
      {
        name: 'Ana García',
        email: 'ana.garcia@empresa.com',
        password: await bcrypt.hash('123456', 10),
        role: 'developer',
        position: 'Frontend Developer',
        department: 'development',
        isActive: true
      },
      {
        name: 'Carlos López',
        email: 'carlos.lopez@empresa.com',
        password: await bcrypt.hash('123456', 10),
        role: 'developer',
        position: 'Backend Developer',
        department: 'development',
        isActive: true
      },
      {
        name: 'María Sánchez',
        email: 'maria.sanchez@empresa.com',
        password: await bcrypt.hash('123456', 10),
        role: 'designer',
        position: 'UI/UX Designer',
        department: 'design',
        isActive: true
      },
      {
        name: 'Diego Ruiz',
        email: 'diego.ruiz@empresa.com',
        password: await bcrypt.hash('123456', 10),
        role: 'manager',
        position: 'Project Manager',
        department: 'management',
        isActive: true
      }
    ];

    // Crear solo usuarios que no existan
    const createdUsers = [];
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = await User.create(userData);
        createdUsers.push(user);
      }
    }

    // Obtener todos los usuarios para devolver
    const allUsers = await User.find({}, 'name email role position department isActive');

    res.status(201).json({
      success: true,
      message: `${createdUsers.length} usuarios de prueba creados`,
      created: createdUsers.length,
      total: allUsers.length,
      data: allUsers
    });

  } catch (error) {
    console.error('Error creando usuarios de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando usuarios de prueba',
      error: error.message
    });
  }
});

// 🔥 RUTA PARA LISTAR USUARIOS (para debug)
router.get('/debug/users', async (req, res) => {
  try {
    const User = require('../models/User');
    
    const users = await User.find({}, 'name email role position department isActive')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error listando usuarios'
    });
  }
});

// 🧪 RUTA TEMPORAL DE DEBUG
router.put('/:id/debug', async (req, res) => {
  try {
    console.log('🧪 === DEBUG ROUTE ===');
    console.log('🧪 Project ID:', req.params.id);
    console.log('🧪 Usuario:', req.user?.id);
    console.log('🧪 Body:', req.body);
    
    res.status(200).json({
      success: true,
      message: 'Debug route funcionando correctamente',
      data: {
        projectId: req.params.id,
        userId: req.user?.id,
        bodyReceived: req.body,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('🧪 Error en debug route:', error);
    res.status(500).json({
      success: false,
      message: 'Error en debug route',
      error: error.message
    });
  }
});

module.exports = router;