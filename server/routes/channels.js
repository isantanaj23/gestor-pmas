// server/routes/channels.js - RUTAS CORREGIDAS PARA CANALES

const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(protect);

// =================================================================
// RUTAS PARA CANALES
// =================================================================

// @desc    Obtener canales de un proyecto
// @route   GET /api/channels/project/:projectId
// @access  Private
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log('📝 CHAT API: Obteniendo canales del proyecto:', projectId);

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    // Verificar que el proyecto existe y el usuario tiene acceso
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);
    
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
        message: 'No tienes permisos para ver los canales de este proyecto'
      });
    }

    // Obtener canales (simulados por ahora, deberías tener un modelo Channel)
    const channels = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'general',
        description: 'Canal general del proyecto',
        projectId: projectId,
        isPrivate: false,
        members: project.team.concat([{ user: project.owner }]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'diseño',
        description: 'Discusiones de diseño',
        projectId: projectId,
        isPrivate: false,
        members: project.team.filter(m => m.role === 'designer' || m.role === 'manager'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    res.status(200).json({
      success: true,
      count: channels.length,
      data: channels
    });

  } catch (error) {
    console.error('❌ CHAT API: Error obteniendo canales:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener canales'
    });
  }
});

// @desc    Crear nuevo canal
// @route   POST /api/channels
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, projectId, description, isPrivate = false } = req.body;
    
    console.log('📝 CHAT API: Creando canal:', { name, projectId, isPrivate });
    console.log('👤 CHAT API: Usuario:', req.user.id);

    // Validaciones
    if (!name || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y proyecto son requeridos'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    // Verificar que el proyecto existe
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos para crear canal
    const canCreateChannel = project.owner.toString() === req.user.id ||
                            req.user.role === 'admin' ||
                            req.user.role === 'manager';

    if (!canCreateChannel) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear canales en este proyecto'
      });
    }

    // Verificar que no existe un canal con el mismo nombre
    // Por ahora simularemos esto, pero deberías verificar en tu modelo Channel
    const existingChannels = ['general', 'diseño']; // Simular canales existentes
    if (existingChannels.includes(name.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un canal con ese nombre'
      });
    }

    console.log('💾 CHAT API: Guardando canal...');

    // Crear el canal (simulado, deberías usar tu modelo Channel)
    const channel = {
      _id: new mongoose.Types.ObjectId(),
      name: name.toLowerCase(),
      description: description || '',
      projectId: projectId,
      isPrivate: isPrivate,
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: 'admin', joinedAt: new Date() }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('✅ CHAT API: Canal guardado con ID:', channel._id);

    // 📡 Emitir via Socket.io (CORREGIDO)
    console.log('📡 CHAT API: Emitiendo nuevo canal via Socket.io...');
    try {
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler && socketHandler.emitChannelCreated) {
        socketHandler.emitChannelCreated(projectId, channel, req.user);
        console.log('✅ CHAT API: Canal emitido via Socket.io exitosamente');
      } else {
        console.log('⚠️ CHAT API: Socket handler no disponible o método no existe');
      }
    } catch (socketError) {
      console.error('❌ CHAT API: Error emitiendo via Socket.io:', socketError);
      // No fallar la creación del canal por esto
    }

    res.status(201).json({
      success: true,
      message: 'Canal creado exitosamente',
      data: channel
    });

  } catch (error) {
    console.error('❌ CHAT API: Error creando canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear canal'
    });
  }
});

// @desc    Actualizar canal
// @route   PUT /api/channels/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    console.log('📝 CHAT API: Actualizando canal:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de canal inválido'
      });
    }

    // Por ahora simulamos la actualización
    const updatedChannel = {
      _id: id,
      name: name,
      description: description,
      updatedAt: new Date()
    };

    // Emitir actualización via Socket.io
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler && socketHandler.emitChannelUpdated) {
      socketHandler.emitChannelUpdated('project_id', updatedChannel, req.user);
    }

    res.status(200).json({
      success: true,
      message: 'Canal actualizado exitosamente',
      data: updatedChannel
    });

  } catch (error) {
    console.error('❌ CHAT API: Error actualizando canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar canal'
    });
  }
});

// @desc    Eliminar canal
// @route   DELETE /api/channels/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ CHAT API: Eliminando canal:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de canal inválido'
      });
    }

    // Verificar permisos y eliminar (simulado)
    // Por ahora solo simulamos la eliminación

    // Emitir eliminación via Socket.io
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler && socketHandler.emitChannelDeleted) {
      socketHandler.emitChannelDeleted('project_id', id, req.user);
    }

    res.status(200).json({
      success: true,
      message: 'Canal eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ CHAT API: Error eliminando canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar canal'
    });
  }
});

// =================================================================
// RUTAS PARA GESTIÓN DE MIEMBROS DE CANALES
// =================================================================

// @desc    Obtener miembros de un canal
// @route   GET /api/channels/:channelId/members
// @access  Private
router.get('/:channelId/members', async (req, res) => {
  try {
    const { channelId } = req.params;

    console.log('👥 CHAT API: Obteniendo miembros del canal:', channelId);

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de canal inválido'
      });
    }

    // Simular miembros del canal (deberías obtener esto de tu modelo Channel)
    const members = [
      {
        _id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        role: 'admin',
        joinedAt: new Date()
      }
    ];

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });

  } catch (error) {
    console.error('❌ CHAT API: Error obteniendo miembros del canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener miembros del canal'
    });
  }
});

// @desc    Agregar miembro a canal
// @route   POST /api/channels/:channelId/members
// @access  Private
router.post('/:channelId/members', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userId } = req.body;

    console.log('👥 CHAT API: Agregando miembro al canal:', { channelId, userId });

    if (!mongoose.Types.ObjectId.isValid(channelId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de canal o usuario inválido'
      });
    }

    // Verificar que el usuario existe
    const User = require('../models/User');
    const user = await User.findById(userId).select('name email avatar');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Simular agregar miembro (implementa tu lógica aquí)
    
    // Emitir via Socket.io
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler && socketHandler.emitUserJoinedChannel) {
      socketHandler.emitUserJoinedChannel(channelId, user);
    }

    res.status(200).json({
      success: true,
      message: `${user.name} fue agregado al canal`,
      data: user
    });

  } catch (error) {
    console.error('❌ CHAT API: Error agregando miembro al canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar miembro al canal'
    });
  }
});

// @desc    Remover miembro de canal
// @route   DELETE /api/channels/:channelId/members/:userId
// @access  Private
router.delete('/:channelId/members/:userId', async (req, res) => {
  try {
    const { channelId, userId } = req.params;

    console.log('🚫 CHAT API: Removiendo miembro del canal:', { channelId, userId });

    if (!mongoose.Types.ObjectId.isValid(channelId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de canal o usuario inválido'
      });
    }

    // Verificar que el usuario existe
    const User = require('../models/User');
    const user = await User.findById(userId).select('name email avatar');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Simular remover miembro (implementa tu lógica aquí)
    
    // Emitir via Socket.io
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler && socketHandler.emitUserLeftChannel) {
      socketHandler.emitUserLeftChannel(channelId, user, req.user);
    }

    res.status(200).json({
      success: true,
      message: `${user.name} fue removido del canal`
    });

  } catch (error) {
    console.error('❌ CHAT API: Error removiendo miembro del canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al remover miembro del canal'
    });
  }
});

module.exports = router;