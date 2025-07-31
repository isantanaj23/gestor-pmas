const express = require('express');
const { protect } = require('../middleware/auth');
const Channel = require('../models/Channel');
const router = express.Router();

router.use(protect);

// GET /api/channels/project/:projectId - OBTENER CANALES
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log('📡 CHAT: Obteniendo canales del proyecto:', projectId);
    console.log('👤 CHAT: Usuario:', req.user.id);
    
    const channels = await Channel.find({
      project: projectId
    })
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 });
    
    console.log('✅ CHAT: Canales encontrados:', channels.length);
    
    res.status(200).json({
      success: true,
      count: channels.length,
      data: channels
    });
    
  } catch (error) {
    console.error('❌ CHAT: Error obteniendo canales:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo canales',
      error: error.message
    });
  }
});

// POST /api/channels - CREAR CANAL
router.post('/', async (req, res) => {
  try {
    const { name, description = '', projectId, isPrivate = false } = req.body;
    
    console.log('📝 CHAT API: Creando canal:', { name, projectId, isPrivate });
    console.log('👤 CHAT API: Usuario:', req.user.id);
    
    if (!name || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y proyecto son requeridos'
      });
    }
    
    // Verificar si ya existe
    const existingChannel = await Channel.findOne({
      name: name.toLowerCase().trim(),
      project: projectId
    });
    
    if (existingChannel) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un canal con ese nombre'
      });
    }
    
    // Crear canal
    const channel = new Channel({
      name: name.toLowerCase().trim(),
      description,
      project: projectId,
      createdBy: req.user.id,
      isPrivate,
      members: [{
        user: req.user.id,
        role: 'admin',
        joinedAt: new Date()
      }]
    });
    
    console.log('💾 CHAT API: Guardando canal...');
    const savedChannel = await channel.save();
    
    console.log('✅ CHAT API: Canal guardado con ID:', savedChannel._id);
    
    // Popular datos para respuesta
    await savedChannel.populate('createdBy', 'name email');
    await savedChannel.populate('members.user', 'name email');
    
    // 🔥 EMITIR NUEVO CANAL VIA SOCKET.IO
    if (global.socketHandler) {
      console.log('📡 CHAT API: Emitiendo nuevo canal via Socket.io...');
      global.socketHandler.emitChannelCreated(projectId, savedChannel);
    }
    
    res.status(201).json({
      success: true,
      message: 'Canal creado exitosamente',
      data: savedChannel
    });
    
  } catch (error) {
    console.error('❌ CHAT API: Error creando canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando canal',
      error: error.message
    });
  }
});

module.exports = router;