const express = require('express');
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const router = express.Router();

router.use(protect);

// GET /api/messages/channel/:channelId - OBTENER MENSAJES
router.get('/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    console.log('📡 CHAT: Obteniendo mensajes del canal:', channelId);
    
    const messages = await Message.find({ channel: channelId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    console.log('✅ CHAT: Mensajes encontrados:', messages.length);
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse() // Más recientes al final
    });
    
  } catch (error) {
    console.error('❌ CHAT: Error obteniendo mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mensajes',
      error: error.message
    });
  }
});

// POST /api/messages - ENVIAR MENSAJE
router.post('/', async (req, res) => {
  try {
    const { content, channelId } = req.body;
    
    console.log('📝 CHAT: Enviando mensaje:', { channelId, content: content?.substring(0, 50) });
    
    if (!content || !channelId) {
      return res.status(400).json({
        success: false,
        message: 'Contenido y canal son requeridos'
      });
    }
    
    const message = new Message({
      content: content.trim(),
      sender: req.user.id,
      channel: channelId,
      type: 'text'
    });
    
    const savedMessage = await message.save();
    
    // Popular datos para respuesta
    await savedMessage.populate('sender', 'name email avatar');
    
    console.log('✅ CHAT: Mensaje guardado:', savedMessage._id);
    
    // Emitir a Socket.io si está disponible
    if (req.io) {
      req.io.to(`channel_${channelId}`).emit('new_message', {
        channelId,
        message: savedMessage
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Mensaje enviado',
      data: savedMessage
    });
    
  } catch (error) {
    console.error('❌ CHAT: Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando mensaje',
      error: error.message
    });
  }
});

module.exports = router;