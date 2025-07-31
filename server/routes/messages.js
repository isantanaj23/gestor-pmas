// server/routes/messages.js - REEMPLAZAR COMPLETAMENTE

const express = require('express');
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const router = express.Router();

router.use(protect);

// GET /api/messages/channel/:channelId - OBTENER MENSAJES
router.get('/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    console.log('📡 CHAT API: Obteniendo mensajes del canal:', channelId);
    console.log('👤 CHAT API: Usuario:', req.user.id);
    
    const messages = await Message.find({ channel: channelId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    console.log('✅ CHAT API: Mensajes encontrados:', messages.length);
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse() // Más recientes al final
    });
    
  } catch (error) {
    console.error('❌ CHAT API: Error obteniendo mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mensajes',
      error: error.message
    });
  }
});

// POST /api/messages - ENVIAR MENSAJE (MEJORADO)
router.post('/', async (req, res) => {
  try {
    const { content, channelId } = req.body;
    
    console.log('📝 CHAT API: Enviando mensaje:', { 
      channelId, 
      content: content?.substring(0, 50) + '...',
      sender: req.user.id 
    });
    
    if (!content || !channelId) {
      return res.status(400).json({
        success: false,
        message: 'Contenido y canal son requeridos'
      });
    }
    
    // 🔥 OBTENER INFORMACIÓN DEL CANAL PARA NOTIFICACIONES
    const channel = await Channel.findById(channelId)
      .populate('project', 'name')
      .select('name project');
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }
    
    console.log('📁 CHAT API: Canal encontrado:', channel.name, 'proyecto:', channel.project?._id);
    
    // Crear mensaje
    const message = new Message({
      content: content.trim(),
      sender: req.user.id,
      channel: channelId,
      type: 'text'
    });
    
    console.log('💾 CHAT API: Guardando mensaje en BD...');
    const savedMessage = await message.save();
    
    console.log('✅ CHAT API: Mensaje guardado con ID:', savedMessage._id);
    
    // Popular datos para respuesta
    await savedMessage.populate('sender', 'name email avatar');
    
    // 🔥 EMITIR A SOCKET.IO CON INFORMACIÓN COMPLETA
    if (global.socketHandler) {
      console.log('📡 CHAT API: Emitiendo mensaje via Socket.io...');
      console.log('🎯 CHAT API: Canal destino:', channelId, 'nombre:', channel.name);
      console.log('🏠 CHAT API: Proyecto:', channel.project?._id);
      console.log('👤 CHAT API: Remitente:', savedMessage.sender.name);
      
      // Agregar información del proyecto al mensaje
      const messageWithProject = {
        ...savedMessage.toObject(),
        project: channel.project?._id
      };
      
      // Emitir con nombre del canal
      global.socketHandler.emitNewMessage(
        channelId, 
        messageWithProject, 
        channel.name  // 🔥 NOMBRE DEL CANAL PARA NOTIFICACIONES
      );
      
      console.log('✅ CHAT API: Mensaje emitido via Socket.io con nombre del canal');
    } else {
      console.log('⚠️ CHAT API: Socket.io handler no disponible');
    }
    
    res.status(201).json({
      success: true,
      message: 'Mensaje enviado',
      data: savedMessage
    });
    
  } catch (error) {
    console.error('❌ CHAT API: Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando mensaje',
      error: error.message
    });
  }
});

// POST /api/messages/channel/:channelId/mark-all-read - MARCAR TODOS COMO LEÍDOS
router.post('/channel/:channelId/mark-all-read', async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    
    console.log('📖 CHAT API: Marcando mensajes como leídos:', { channelId, userId });
    
    // Buscar mensajes no leídos por este usuario en este canal
    const unreadMessages = await Message.find({
      channel: channelId,
      sender: { $ne: userId }, // No incluir mensajes propios
      'readBy.user': { $ne: userId } // Que no hayan sido leídos por este usuario
    });
    
    console.log('📊 CHAT API: Mensajes no leídos encontrados:', unreadMessages.length);
    
    let markedCount = 0;
    
    // Marcar cada mensaje como leído
    for (const message of unreadMessages) {
      // Verificar que no esté ya marcado (por si acaso)
      const alreadyRead = message.readBy.some(read => 
        read.user.toString() === userId.toString()
      );
      
      if (!alreadyRead) {
        message.readBy.push({
          user: userId,
          readAt: new Date()
        });
        await message.save();
        markedCount++;
      }
    }
    
    console.log('✅ CHAT API: Mensajes marcados como leídos:', markedCount);
    
    res.status(200).json({
      success: true,
      message: `${markedCount} mensajes marcados como leídos`,
      data: {
        channelId,
        userId,
        markedCount,
        totalUnread: unreadMessages.length
      }
    });
    
  } catch (error) {
    console.error('❌ CHAT API: Error marcando mensajes como leídos:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando mensajes como leídos',
      error: error.message
    });
  }
});

// GET /api/messages/channel/:channelId/unread-count - OBTENER CANTIDAD NO LEÍDOS
router.get('/channel/:channelId/unread-count', async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    
    console.log('📊 CHAT API: Obteniendo count no leídos:', { channelId, userId });
    
    const unreadCount = await Message.countDocuments({
      channel: channelId,
      sender: { $ne: userId }, // No incluir mensajes propios
      'readBy.user': { $ne: userId } // Que no hayan sido leídos por este usuario
    });
    
    console.log('✅ CHAT API: Count no leídos:', unreadCount);
    
    res.status(200).json({
      success: true,
      data: {
        channelId,
        userId,
        unreadCount
      }
    });
    
  } catch (error) {
    console.error('❌ CHAT API: Error obteniendo count no leídos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mensajes no leídos',
      error: error.message
    });
  }
});

// 🆕 GET /api/messages/project/:projectId/unread-counts - OBTENER TODOS LOS NO LEÍDOS DEL PROYECTO
router.get('/project/:projectId/unread-counts', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    console.log('📊 CHAT API: Obteniendo counts no leídos del proyecto:', { projectId, userId });
    
    // Obtener todos los canales del proyecto
    const channels = await Channel.find({ project: projectId }).select('_id name');
    
    console.log('📁 CHAT API: Canales del proyecto:', channels.length);
    
    // Calcular no leídos para cada canal
    const unreadCounts = {};
    
    for (const channel of channels) {
      const unreadCount = await Message.countDocuments({
        channel: channel._id,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      });
      
      if (unreadCount > 0) {
        unreadCounts[channel._id] = {
          count: unreadCount,
          channelName: channel.name
        };
      }
    }
    
    console.log('✅ CHAT API: Counts no leídos calculados:', Object.keys(unreadCounts).length, 'canales con mensajes');
    
    res.status(200).json({
      success: true,
      data: {
        projectId,
        userId,
        unreadCounts,
        totalChannelsWithUnread: Object.keys(unreadCounts).length
      }
    });
    
  } catch (error) {
    console.error('❌ CHAT API: Error obteniendo counts del proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mensajes no leídos del proyecto',
      error: error.message
    });
  }
});

// POST /api/messages/test-emit/:channelId - RUTA DE TEST
router.post('/test-emit/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const testData = req.body || { test: 'Mensaje de prueba' };
    
    console.log('🧪 CHAT API: Test emit para canal:', channelId);
    
    if (global.socketHandler) {
      global.socketHandler.testEmit(channelId, testData);
      
      res.status(200).json({
        success: true,
        message: 'Test emit enviado',
        channelId,
        testData
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Socket.io handler no disponible'
      });
    }
    
  } catch (error) {
    console.error('❌ CHAT API: Error en test emit:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test emit',
      error: error.message
    });
  }
});

// GET /api/messages/stats - ESTADÍSTICAS DE SOCKET.IO
router.get('/stats', async (req, res) => {
  try {
    const stats = global.socketHandler ? global.socketHandler.getStats() : null;
    
    res.status(200).json({
      success: true,
      data: {
        socketHandler: !!global.socketHandler,
        stats
      }
    });
    
  } catch (error) {
    console.error('❌ CHAT API: Error obteniendo stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

module.exports = router;