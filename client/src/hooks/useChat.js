import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import useSocket from './useSocket';

const useChat = (projectId = null) => {
  const { user } = useAuth();
  const { 
    socket, 
    connected, 
    joinChannel, 
    leaveChannel, 
    startTyping, 
    stopTyping, 
    markMessagesAsRead 
  } = useSocket();

  // Estados principales
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para funcionalidades del chat
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // =================================================================
  // FUNCIONES PARA CARGAR DATOS
  // =================================================================

  // Cargar canales de un proyecto
  const loadChannels = useCallback(async (projectIdToLoad = projectId) => {
    if (!projectIdToLoad) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Cargando canales del proyecto:', projectIdToLoad);
      
      const response = await chatService.getChannelsByProject(projectIdToLoad);
      
      if (response.success) {
        const formattedChannels = chatService.formatChannelsForUI(response.data);
        setChannels(formattedChannels);
        
        // Seleccionar canal general por defecto
        const generalChannel = formattedChannels.find(ch => ch.name.includes('general'));
        if (generalChannel && !activeChannel) {
          setActiveChannel(generalChannel);
          await loadMessages(generalChannel.id);
        }
        
        console.log('✅ Canales cargados:', formattedChannels.length);
      } else {
        setError(response.message);
        console.error('❌ Error cargando canales:', response.message);
      }
    } catch (error) {
      setError('Error cargando canales');
      console.error('❌ Error cargando canales:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, activeChannel]);

  // Cargar mensajes directos
  const loadDirectMessages = useCallback(async () => {
    try {
      const response = await chatService.getDirectMessages();
      
      if (response.success) {
        const formattedDMs = chatService.formatChannelsForUI(response.data);
        setDirectMessages(formattedDMs);
        console.log('✅ Mensajes directos cargados:', formattedDMs.length);
      } else {
        console.error('❌ Error cargando mensajes directos:', response.message);
      }
    } catch (error) {
      console.error('❌ Error cargando mensajes directos:', error);
    }
  }, []);

  // Cargar mensajes de un canal
  const loadMessages = useCallback(async (channelId, page = 1, append = false) => {
    if (!channelId) return;

    try {
      setIsLoadingMessages(true);
      
      console.log('📡 Cargando mensajes del canal:', channelId, 'página:', page);
      
      const response = await chatService.getMessagesByChannel(channelId, page, 50);
      
      if (response.success) {
        const formattedMessages = chatService.formatMessagesForUI(response.data);
        
        // Marcar mensajes propios
        const messagesWithOwnership = formattedMessages.map(msg => ({
          ...msg,
          isOwn: msg.senderId === user?.id
        }));
        
        if (append) {
          setMessages(prev => [...messagesWithOwnership, ...prev]);
        } else {
          setMessages(messagesWithOwnership);
        }
        
        setHasMoreMessages(response.pagination.hasNextPage);
        setCurrentPage(page);
        
        // Unirse al canal en Socket.io
        if (connected) {
          joinChannel(channelId);
        }
        
        // Marcar mensajes como leídos
        if (connected) {
          markMessagesAsRead(channelId);
        }
        
        console.log('✅ Mensajes cargados:', messagesWithOwnership.length);
      } else {
        setError(response.message);
        console.error('❌ Error cargando mensajes:', response.message);
      }
    } catch (error) {
      setError('Error cargando mensajes');
      console.error('❌ Error cargando mensajes:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user, connected, joinChannel, markMessagesAsRead]);

  // =================================================================
  // FUNCIONES PARA ACCIONES DEL CHAT
  // =================================================================

  // Cambiar canal activo
  const switchChannel = useCallback(async (channel) => {
    if (activeChannel?.id === channel.id) return;

    // Salir del canal anterior
    if (activeChannel && connected) {
      leaveChannel(activeChannel.id);
    }

    setActiveChannel(channel);
    setMessages([]);
    setCurrentPage(1);
    setHasMoreMessages(true);
    
    await loadMessages(channel.id);
  }, [activeChannel, connected, leaveChannel, loadMessages]);

  // Enviar mensaje
  const sendMessage = useCallback(async (content, channelId = activeChannel?.id) => {
    if (!content?.trim() || !channelId) return { success: false, message: 'Datos inválidos' };

    const messageData = {
      content: content.trim(),
      channelId,
      type: 'text'
    };

    // Validar datos
    const validation = chatService.validateMessageData(messageData);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(', ') };
    }

    try {
      console.log('📤 Enviando mensaje:', messageData);
      
      const response = await chatService.sendMessage(messageData);
      
      if (response.success) {
        // El mensaje se agregará automáticamente a través de Socket.io
        console.log('✅ Mensaje enviado exitosamente');
        
        // Detener indicador de escritura
        if (connected) {
          stopTyping(channelId);
        }
        
        return { success: true, data: response.data };
      } else {
        console.error('❌ Error enviando mensaje:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      return { success: false, message: 'Error enviando mensaje' };
    }
  }, [activeChannel, connected, stopTyping]);

  // Crear nuevo canal
  const createChannel = useCallback(async (channelData) => {
    if (!projectId) return { success: false, message: 'No hay proyecto seleccionado' };

    const newChannelData = {
      ...channelData,
      projectId
    };

    // Validar datos
    const validation = chatService.validateChannelData(newChannelData);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(', ') };
    }

    try {
      console.log('📤 Creando canal:', newChannelData);
      
      const response = await chatService.createChannel(newChannelData);
      
      if (response.success) {
        // Recargar canales para mostrar el nuevo
        await loadChannels();
        
        console.log('✅ Canal creado exitosamente');
        return { success: true, data: response.data };
      } else {
        console.error('❌ Error creando canal:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('❌ Error creando canal:', error);
      return { success: false, message: 'Error creando canal' };
    }
  }, [projectId, loadChannels]);

  // Cargar más mensajes (paginación)
  const loadMoreMessages = useCallback(async () => {
    if (!activeChannel?.id || !hasMoreMessages || isLoadingMessages) return;

    await loadMessages(activeChannel.id, currentPage + 1, true);
  }, [activeChannel, hasMoreMessages, isLoadingMessages, currentPage, loadMessages]);

  // =================================================================
  // FUNCIONES DE ESCRITURA (TYPING)
  // =================================================================

  const handleTypingStart = useCallback((channelId = activeChannel?.id) => {
    if (!channelId || !connected) return;
    
    startTyping(channelId);
  }, [activeChannel, connected, startTyping]);

  const handleTypingStop = useCallback((channelId = activeChannel?.id) => {
    if (!channelId || !connected) return;
    
    stopTyping(channelId);
  }, [activeChannel, connected, stopTyping]);

  // =================================================================
  // EFECTOS PARA EVENTOS DE SOCKET.IO
  // =================================================================

  useEffect(() => {
    if (!connected) return;

    const handleNewMessage = (event) => {
      const { channelId, message } = event.detail;
      
      if (channelId === activeChannel?.id) {
        const formattedMessage = chatService.formatMessagesForUI([message])[0];
        formattedMessage.isOwn = message.sender._id === user?.id;
        
        setMessages(prev => [...prev, formattedMessage]);
      }
      
      // Actualizar último mensaje en la lista de canales
      setChannels(prev => prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, lastMessage: message.content, time: 'Ahora' }
          : channel
      ));
    };

    const handleMessageUpdated = (event) => {
      const { channelId, message } = event.detail;
      
      if (channelId === activeChannel?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === message._id 
            ? { ...msg, message: message.content, isEdited: true }
            : msg
        ));
      }
    };

    const handleMessageDeleted = (event) => {
      const { channelId, messageId } = event.detail;
      
      if (channelId === activeChannel?.id) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    };

    const handleTypingStart = (event) => {
      const { channelId, userId, userName } = event.detail;
      
      if (channelId === activeChannel?.id && userId !== user?.id) {
        setTypingUsers(prev => new Set([...prev, userName]));
      }
    };

    const handleTypingStop = (event) => {
      const { channelId, userId } = event.detail;
      
      if (channelId === activeChannel?.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          // Buscar por userId y eliminar el nombre correspondiente
          // (esto es una simplificación, en producción sería mejor manejar un Map)
          prev.forEach(name => {
            if (name !== user?.name) { // Simplificado
              newSet.delete(name);
            }
          });
          return newSet;
        });
      }
    };

    const handleChannelCreated = (event) => {
      const { projectId: eventProjectId, channel } = event.detail;
      
      if (eventProjectId === projectId) {
        loadChannels();
      }
    };

    // Agregar event listeners
    window.addEventListener('newMessage', handleNewMessage);
    window.addEventListener('messageUpdated', handleMessageUpdated);
    window.addEventListener('messageDeleted', handleMessageDeleted);
    window.addEventListener('typingStart', handleTypingStart);
    window.addEventListener('typingStop', handleTypingStop);
    window.addEventListener('channelCreated', handleChannelCreated);

    // Cleanup
    return () => {
      window.removeEventListener('newMessage', handleNewMessage);
      window.removeEventListener('messageUpdated', handleMessageUpdated);
      window.removeEventListener('messageDeleted', handleMessageDeleted);
      window.removeEventListener('typingStart', handleTypingStart);
      window.removeEventListener('typingStop', handleTypingStop);
      window.removeEventListener('channelCreated', handleChannelCreated);
    };
  }, [connected, activeChannel, user, projectId, loadChannels]);

  // =================================================================
  // EFECTOS DE INICIALIZACIÓN
  // =================================================================

  // Cargar datos iniciales
  useEffect(() => {
    if (projectId) {
      loadChannels();
    }
    loadDirectMessages();
  }, [projectId, loadChannels, loadDirectMessages]);

  // Limpiar al cambiar de proyecto
  useEffect(() => {
    setChannels([]);
    setMessages([]);
    setActiveChannel(null);
    setError(null);
    setTypingUsers(new Set());
    setUnreadCounts(new Map());
  }, [projectId]);

  // =================================================================
  // DATOS CALCULADOS
  // =================================================================

  const allConversations = [...channels, ...directMessages];
  const typingUsersArray = Array.from(typingUsers);
  const hasTypingUsers = typingUsersArray.length > 0;

  // =================================================================
  // RETORNO DEL HOOK
  // =================================================================

  return {
    // Estados principales
    channels,
    directMessages,
    allConversations,
    activeChannel,
    messages,
    loading,
    error,
    
    // Estados del socket
    connected,
    
    // Estados de funcionalidades
    typingUsers: typingUsersArray,
    hasTypingUsers,
    unreadCounts,
    isLoadingMessages,
    hasMoreMessages,
    
    // Funciones principales
    switchChannel,
    sendMessage,
    createChannel,
    loadMoreMessages,
    
    // Funciones de escritura
    handleTypingStart,
    handleTypingStop,
    
    // Funciones de utilidad
    loadChannels,
    loadDirectMessages,
    loadMessages
  };
};

export default useChat;