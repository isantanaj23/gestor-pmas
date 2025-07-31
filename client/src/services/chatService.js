import API from './api';

/**
 * Servicios para Chat (Canales y Mensajes)
 */
const chatService = {
  // =================================================================
  // SERVICIOS DE CANALES
  // =================================================================

  // Obtener canales de un proyecto
  getChannelsByProject: async (projectId) => {
    try {
      console.log('📡 Obteniendo canales del proyecto:', projectId);
      
      const response = await API.get(`/channels/project/${projectId}`);
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      };
    } catch (error) {
      console.error('Error obteniendo canales:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo canales',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener mensajes directos del usuario
  getDirectMessages: async () => {
    try {
      console.log('📡 Obteniendo mensajes directos...');
      
      const response = await API.get('/channels/direct-messages');
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      };
    } catch (error) {
      console.error('Error obteniendo mensajes directos:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo mensajes directos',
        error: error.response?.data?.error,
      };
    }
  },

  // Crear nuevo canal
  createChannel: async (channelData) => {
    try {
      console.log('📝 Creando canal:', channelData);
      
      const response = await API.post('/channels', channelData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creando canal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error creando canal',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener información de un canal específico
  getChannel: async (channelId) => {
    try {
      const response = await API.get(`/channels/${channelId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo canal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo canal',
        error: error.response?.data?.error,
      };
    }
  },

  // Actualizar canal
  updateChannel: async (channelId, updateData) => {
    try {
      const response = await API.put(`/channels/${channelId}`, updateData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error actualizando canal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando canal',
        error: error.response?.data?.error,
      };
    }
  },

  // Unirse a un canal
  joinChannel: async (channelId) => {
    try {
      const response = await API.post(`/channels/${channelId}/join`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error uniéndose al canal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error uniéndose al canal',
        error: error.response?.data?.error,
      };
    }
  },

  // Salir de un canal
  leaveChannel: async (channelId) => {
    try {
      const response = await API.post(`/channels/${channelId}/leave`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error saliendo del canal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error saliendo del canal',
        error: error.response?.data?.error,
      };
    }
  },

  // Eliminar canal
  deleteChannel: async (channelId) => {
    try {
      const response = await API.delete(`/channels/${channelId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error eliminando canal:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error eliminando canal',
        error: error.response?.data?.error,
      };
    }
  },

  // =================================================================
  // SERVICIOS DE MENSAJES
  // =================================================================

  // Obtener mensajes de un canal
  getMessagesByChannel: async (channelId, page = 1, limit = 50) => {
    try {
      console.log('📡 Obteniendo mensajes del canal:', channelId, 'página:', page);
      
      const response = await API.get(`/messages/channel/${channelId}`, {
        params: { page, limit }
      });
      
      return {
        success: true,
        data: response.data.data,
        pagination: {
          count: response.data.count,
          totalMessages: response.data.totalMessages,
          totalPages: response.data.totalPages,
          currentPage: response.data.currentPage,
          hasNextPage: response.data.hasNextPage,
          hasPrevPage: response.data.hasPrevPage
        }
      };
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo mensajes',
        error: error.response?.data?.error,
      };
    }
  },

  // Enviar mensaje
  sendMessage: async (messageData) => {
    try {
      console.log('📝 Enviando mensaje:', messageData);
      
      const response = await API.post('/messages', messageData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error enviando mensaje',
        error: error.response?.data?.error,
      };
    }
  },

  // Editar mensaje
  editMessage: async (messageId, content) => {
    try {
      const response = await API.put(`/messages/${messageId}`, { content });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error editando mensaje:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error editando mensaje',
        error: error.response?.data?.error,
      };
    }
  },

  // Eliminar mensaje
  deleteMessage: async (messageId) => {
    try {
      const response = await API.delete(`/messages/${messageId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error eliminando mensaje',
        error: error.response?.data?.error,
      };
    }
  },

  // Marcar mensaje como leído
  markMessageAsRead: async (messageId) => {
    try {
      const response = await API.post(`/messages/${messageId}/read`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error marcando mensaje como leído:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error marcando mensaje como leído',
        error: error.response?.data?.error,
      };
    }
  },

  // Marcar todos los mensajes de un canal como leídos
  markAllMessagesAsRead: async (channelId) => {
    try {
      console.log('📖 Marcando todos los mensajes como leídos en canal:', channelId);
      
      const response = await API.post(`/messages/channel/${channelId}/mark-all-read`);
      return {
        success: true,
        message: response.data.message,
        markedCount: response.data.markedCount
      };
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error marcando mensajes como leídos',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener cantidad de mensajes no leídos
  getUnreadCount: async (channelId) => {
    try {
      const response = await API.get(`/messages/channel/${channelId}/unread-count`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo mensajes no leídos:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo mensajes no leídos',
        error: error.response?.data?.error,
      };
    }
  },

  // =================================================================
  // FUNCIONES DE UTILIDAD
  // =================================================================

  // Formatear mensajes para la UI
  formatMessagesForUI: (messages) => {
    return messages.map(message => ({
      id: message._id,
      sender: message.sender?.name || 'Usuario',
      senderId: message.sender?._id,
      message: message.content,
      time: new Date(message.createdAt).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: message.createdAt,
      isOwn: false, // Se determina en el componente comparando con el usuario actual
      type: message.type || 'text',
      isEdited: message.metadata?.edited?.isEdited || false,
      replyTo: message.replyTo
    }));
  },

  // Formatear canales para la UI
  formatChannelsForUI: (channels) => {
    return channels.map(channel => ({
      id: channel._id,
      name: channel.type === 'channel' ? `# ${channel.name}` : channel.name,
      type: channel.type,
      lastMessage: channel.lastMessage?.content || 'Sin mensajes',
      time: channel.lastMessage?.timestamp 
        ? new Date(channel.lastMessage.timestamp).toLocaleDateString('es-ES')
        : 'Nuevo',
      unread: 0, // Se puede implementar después
      isPrivate: channel.isPrivate || false,
      members: channel.members || [],
      participants: channel.participants || []
    }));
  },

  // Validar datos antes de enviar
  validateMessageData: (messageData) => {
    const errors = [];

    if (!messageData.content || messageData.content.trim().length === 0) {
      errors.push('El mensaje no puede estar vacío');
    }

    if (!messageData.channelId) {
      errors.push('Se requiere un canal para enviar el mensaje');
    }

    if (messageData.content && messageData.content.length > 2000) {
      errors.push('El mensaje no puede exceder 2000 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateChannelData: (channelData) => {
    const errors = [];

    if (!channelData.name || channelData.name.trim().length === 0) {
      errors.push('El nombre del canal es requerido');
    }

    if (!channelData.projectId) {
      errors.push('Se requiere un proyecto para crear el canal');
    }

    if (channelData.name && channelData.name.length > 50) {
      errors.push('El nombre del canal no puede exceder 50 caracteres');
    }

    if (channelData.description && channelData.description.length > 200) {
      errors.push('La descripción no puede exceder 200 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default chatService;