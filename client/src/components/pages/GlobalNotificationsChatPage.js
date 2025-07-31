import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { io } from 'socket.io-client';

function GlobalNotificationsChatPage() {
  const { projectId } = useParams();
  const { user, token } = useAuth();
  
  // Estados básicos
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de Socket.io
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketEvents, setSocketEvents] = useState([]);
  
  // Estados para notificaciones globales
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [totalUnread, setTotalUnread] = useState(0);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const [joinedToProject, setJoinedToProject] = useState(false);
  
  // Estados para crear canal
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  
  // Referencias MEJORADAS
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const notificationAudioRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const activeChannelRef = useRef(null);

  // =================================================================
  // 🔥 FUNCIÓN DE SCROLL MEJORADA - LIKE WHATSAPP
  // =================================================================

  const scrollToBottom = (force = false, delay = 0) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!messagesEndRef.current || !messagesContainerRef.current) return;
      
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 150;
      
      if (force || isNearBottom) {
        try {
          // Scroll suave al final
          container.scrollTo({
            top: container.scrollHeight,
            behavior: force ? 'auto' : 'smooth'
          });
          console.log('✅ SCROLL: Ejecutado - altura:', container.scrollHeight);
        } catch (error) {
          console.log('⚠️ SCROLL: Error:', error);
          // Fallback
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }, delay);
  };

  // =================================================================
  // 🔥 SOCKET.IO CORREGIDO - TIEMPO REAL FUNCIONANDO
  // =================================================================

const initializeSocket = () => {
  if (socketRef.current || !token) {
    console.log('⏭️ GLOBAL CHAT: Socket ya existe o no hay token');
    return;
  }

  console.log('🔌 GLOBAL CHAT: Inicializando Socket.io...');
  
  const newSocket = io('http://localhost:3001', {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    forceNew: true,
    timeout: 10000
  });

  // =================================================================
  // EVENT LISTENERS DE CONEXIÓN
  // =================================================================

  newSocket.on('connect', () => {
    console.log('✅ GLOBAL CHAT: Socket conectado:', newSocket.id);
    setSocket(newSocket);
    setSocketConnected(true);
    addSocketEvent('connect', { socketId: newSocket.id });
    
    // UNIRSE AL PROYECTO INMEDIATAMENTE
    if (projectId) {
      console.log('🏠 GLOBAL CHAT: Uniéndose al proyecto:', projectId);
      newSocket.emit('join_project', projectId);
      setJoinedToProject(true);
    }
    
    // Unirse al canal activo si existe
    if (activeChannelRef.current) {
      console.log('💬 GLOBAL CHAT: Uniéndose al canal activo:', activeChannelRef.current._id);
      newSocket.emit('join_channel', activeChannelRef.current._id);
    }
  });

  newSocket.on('disconnect', (reason) => {
    console.log('🔌 GLOBAL CHAT: Socket desconectado:', reason);
    setSocketConnected(false);
    setJoinedToProject(false);
    addSocketEvent('disconnect', { reason });
  });

  // =================================================================
  // 🔥 EVENTO CORREGIDO - MENSAJES EN TIEMPO REAL
  // =================================================================

  newSocket.on('new_message_global', (data) => {
    console.log('📨 GLOBAL CHAT: ===== NUEVO MENSAJE GLOBAL =====');
    console.log('📨 DATOS RECIBIDOS:', data);
    
    addSocketEvent('new_message_global', data);
    
    const { channelId, channelName, message } = data;
    
    // 🔥 USAR LA REFERENCIA EN LUGAR DEL ESTADO DIRECTO
    const currentActiveChannel = activeChannelRef.current;
    
    // 🔥 LOGGING DETALLADO PARA DEBUG
    console.log('🔍 ANÁLISIS DEL MENSAJE:');
    console.log('   - channelId recibido:', channelId, typeof channelId);
    console.log('   - activeChannelRef.current:', currentActiveChannel?._id, typeof currentActiveChannel?._id);
    console.log('   - channelName:', channelName);
    console.log('   - message.sender._id:', message.sender?._id, typeof message.sender?._id);
    console.log('   - user.id:', user?.id, typeof user?.id);
    
    // 🔥 COMPARACIÓN ROBUSTA DE IDs
    const messageChannelId = String(channelId);
    const currentChannelId = String(currentActiveChannel?._id || '');
    const messageSenderId = String(message.sender?._id || '');
    const currentUserId = String(user?.id || '');
    
    const isFromActiveChannel = messageChannelId === currentChannelId;
    const isFromSelf = messageSenderId === currentUserId;
    
    console.log('🔍 COMPARACIONES:');
    console.log('   - isFromActiveChannel:', isFromActiveChannel, `(${messageChannelId} === ${currentChannelId})`);
    console.log('   - isFromSelf:', isFromSelf, `(${messageSenderId} === ${currentUserId})`);
    console.log('   - currentActiveChannel existe:', !!currentActiveChannel);
    
    if (isFromActiveChannel && currentActiveChannel) {
      console.log('✅ GLOBAL CHAT: ¡ES DEL CANAL ACTIVO! Agregando mensaje...');
      
      setMessages(prevMessages => {
        console.log('📊 GLOBAL CHAT: Mensajes actuales:', prevMessages.length);
        
        // Verificar duplicados
        const messageExists = prevMessages.some(msg => {
          const existingId = String(msg._id || '');
          const newId = String(message._id || '');
          const sameId = existingId === newId;
          
          const sameContent = msg.content === message.content;
          const sameSender = String(msg.sender?._id || '') === String(message.sender?._id || '');
          const timeClose = Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 10000;
          
          const isDuplicate = sameId || (sameContent && sameSender && timeClose);
          
          if (isDuplicate) {
            console.log('⚠️ GLOBAL CHAT: Mensaje duplicado detectado');
          }
          
          return isDuplicate;
        });
        
        if (messageExists) {
          console.log('⚠️ GLOBAL CHAT: Mensaje ya existe, no agregando');
          return prevMessages;
        }
        
        // Crear objeto de mensaje completo
        const newMessage = {
          _id: message._id || `temp_${Date.now()}_${Math.random()}`,
          content: message.content || 'Mensaje sin contenido',
          createdAt: message.createdAt || new Date(),
          sender: {
            _id: message.sender?._id || 'unknown',
            name: message.sender?.name || 'Usuario Desconocido',
            email: message.sender?.email || ''
          },
          channel: channelId
        };
        
        console.log('📝 GLOBAL CHAT: Objeto mensaje creado:', newMessage);
        
        const newMessages = [...prevMessages, newMessage];
        
        console.log('✅ GLOBAL CHAT: MENSAJE AGREGADO! Total mensajes:', newMessages.length);
        
        // Scroll inmediato
        setTimeout(() => {
          console.log('🔄 GLOBAL CHAT: Ejecutando scroll...');
          scrollToBottom(false, 100);
        }, 100);
        
        return newMessages;
      });
      
    } else if (!isFromSelf && currentActiveChannel) {
      console.log('🔔 GLOBAL CHAT: Mensaje de otro canal, mostrando notificación');
      updateUnreadCount(channelId, true, 1);
      showNotification(message, channelName || 'Canal');
      playNotificationSound();
    } else {
      console.log('ℹ️ GLOBAL CHAT: Mensaje ignorado. Razones:');
      console.log('   - No es del canal activo:', !isFromActiveChannel);
      console.log('   - No hay canal activo:', !currentActiveChannel);
      console.log('   - Es del mismo usuario:', isFromSelf);
    }
    
    console.log('📨 GLOBAL CHAT: ===== FIN PROCESAMIENTO =====');
  });

  // EVENTO DE CANAL ESPECÍFICO - BACKUP CON DELAY
  newSocket.on('new_message', (data) => {
    console.log('📨 GLOBAL CHAT: Mensaje de canal específico (backup):', data);
    addSocketEvent('new_message', data);
    
    // Solo procesar si NO se procesó por new_message_global después de un delay
    setTimeout(() => {
      const currentActiveChannel = activeChannelRef.current;
      if (String(data.channelId) === String(currentActiveChannel?._id)) {
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => 
            String(msg._id) === String(data.message._id) ||
            (msg.content === data.message.content && 
             String(msg.sender?._id) === String(data.message.sender?._id) &&
             Math.abs(new Date(msg.createdAt) - new Date(data.message.createdAt)) < 5000)
          );
          
          if (!messageExists) {
            console.log('✅ GLOBAL CHAT: Agregando mensaje desde evento backup');
            const newMessages = [...prevMessages, {
              ...data.message,
              _id: data.message._id || `backup_${Date.now()}`,
              createdAt: data.message.createdAt || new Date()
            }];
            setTimeout(() => scrollToBottom(false, 100), 100);
            return newMessages;
          }
          return prevMessages;
        });
      }
    }, 1000); // Delay de 1 segundo para evitar duplicados
  });

  // Confirmaciones de unión
  newSocket.on('project_joined', (data) => {
    console.log('🏠 GLOBAL CHAT: Confirmación proyecto unido:', data);
    setJoinedToProject(true);
  });

  newSocket.on('channel_joined', (data) => {
    console.log('💬 GLOBAL CHAT: Confirmación canal unido:', data);
  });

  // Nuevo canal creado
  newSocket.on('channel_created', (data) => {
    console.log('📢 GLOBAL CHAT: Nuevo canal creado:', data);
    addSocketEvent('channel_created', data);
    
    if (data.projectId === projectId) {
      setChannels(prev => {
        const exists = prev.some(ch => ch._id === data.channel._id);
        if (!exists) {
          return [data.channel, ...prev];
        }
        return prev;
      });
    }
  });

  socketRef.current = newSocket;
};

  const cleanupSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    if (socketRef.current) {
      console.log('🔌 GLOBAL CHAT: Cerrando Socket.io');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setSocketConnected(false);
      setJoinedToProject(false);
    }
  };

  // =================================================================
  // FUNCIONES DE NOTIFICACIONES
  // =================================================================

  const playNotificationSound = () => {
    if (notificationAudioRef.current) {
      notificationAudioRef.current.play().catch(e => {
        console.log('No se pudo reproducir sonido:', e);
      });
    }
  };

  const showNotification = (message, channelName) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Nuevo mensaje en #${channelName}`, {
        body: `${message.sender?.name}: ${message.content}`,
        icon: '/favicon.ico',
        tag: `chat-${message.channel}`,
        silent: false
      });
    }

    setLatestNotification({
      id: Date.now(),
      channelName,
      senderName: message.sender?.name || 'Usuario',
      content: message.content,
      timestamp: new Date().toLocaleTimeString()
    });
    
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 4000);
  };

  const updateUnreadCount = (channelId, increment = true, count = 1) => {
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      
      if (increment) {
        const currentCount = newCounts.get(channelId) || 0;
        newCounts.set(channelId, currentCount + count);
      } else {
        newCounts.delete(channelId);
      }
      
      return newCounts;
    });
  };

  const clearChannelUnread = async (channelId) => {
    updateUnreadCount(channelId, false);
    
    try {
      await API.post(`/messages/channel/${channelId}/mark-all-read`);
    } catch (error) {
      console.log('❌ Error marking as read:', error);
    }
  };

  // =================================================================
  // FUNCIONES DE API
  // =================================================================

  const loadChannels = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await API.get(`/channels/project/${projectId}`);
      
      if (response.data?.success) {
        const channelData = response.data.data || [];
        setChannels(channelData);
        console.log('✅ GLOBAL CHAT: Canales cargados:', channelData.length);
        
        if (channelData.length > 0 && !activeChannel) {
          await switchToChannel(channelData[0]);
        }
      }
      
    } catch (error) {
      console.error('❌ GLOBAL CHAT: Error cargando canales:', error);
      setError(`Error cargando canales: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId) => {
    if (!channelId) return;

    try {
      console.log('📡 GLOBAL CHAT: Cargando mensajes del canal:', channelId);
      
      const response = await API.get(`/messages/channel/${channelId}`);
      
      if (response.data?.success) {
        const messageData = response.data.data || [];
        setMessages(messageData);
        console.log('✅ GLOBAL CHAT: Mensajes cargados:', messageData.length);
        
        // Scroll al final tras cargar
        setTimeout(() => {
          scrollToBottom(true, 300);
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ GLOBAL CHAT: Error cargando mensajes:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChannel) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Limpiar inmediatamente

    try {
      console.log('📝 GLOBAL CHAT: Enviando mensaje:', messageContent);
      
      const response = await API.post('/messages', {
        content: messageContent,
        channelId: activeChannel._id
      });
      
      if (response.data?.success) {
        console.log('✅ GLOBAL CHAT: Mensaje enviado exitosamente');
        // El mensaje aparecerá via Socket.io
      } else {
        throw new Error(response.data?.message || 'Error enviando mensaje');
      }
      
    } catch (error) {
      console.error('❌ GLOBAL CHAT: Error enviando mensaje:', error);
      setNewMessage(messageContent); // Restaurar si hay error
      alert(`Error: ${error.message}`);
    }
  };

  // 🔥 FUNCIÓN switchToChannel CORREGIDA
  const switchToChannel = async (channel) => {
    console.log('🔄 GLOBAL CHAT: Cambiando a canal:', channel.name);
    
    // Salir del canal anterior
    if (activeChannelRef.current && socketRef.current) {
      console.log('👋 GLOBAL CHAT: Saliendo del canal anterior:', activeChannelRef.current._id);
      socketRef.current.emit('leave_channel', activeChannelRef.current._id);
      clearChannelUnread(activeChannelRef.current._id);
    }
    
    // Actualizar estado Y referencia
    setActiveChannel(channel);
    activeChannelRef.current = channel; // 🔥 ACTUALIZAR REFERENCIA INMEDIATAMENTE
    
    setMessages([]);
    await loadMessages(channel._id);
    
    // Unirse al nuevo canal
    if (socketRef.current && socketConnected) {
      console.log('💬 GLOBAL CHAT: Uniéndose al nuevo canal:', channel._id);
      socketRef.current.emit('join_channel', channel._id);
    }
    
    clearChannelUnread(channel._id);
    
    console.log('✅ GLOBAL CHAT: Canal cambiado exitosamente. Nuevo canal:', channel._id);
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !projectId) return;

    try {
      const response = await API.post('/channels', {
        name: newChannelName.trim(),
        description: `Canal ${newChannelName}`,
        projectId,
        isPrivate: false
      });
      
      if (response.data?.success) {
        setNewChannelName('');
        setShowModal(false);
        setTimeout(() => loadChannels(), 1000);
        alert('Canal creado exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error creando canal:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // =================================================================
  // FUNCIONES DE DEBUG
  // =================================================================
  
  const addSocketEvent = (type, data) => {
    const event = {
      id: Date.now(),
      type,
      data: JSON.stringify(data).substring(0, 100),
      timestamp: new Date().toLocaleTimeString()
    };
    
    setSocketEvents(prev => [event, ...prev.slice(0, 4)]);
  };

  // 🔥 FUNCIÓN DE DEBUG MEJORADA
  const debugCurrentState = () => {
    console.log('🔍 ESTADO ACTUAL DEL CHAT:');
    console.log('   - activeChannel (estado):', activeChannel);
    console.log('   - activeChannelRef.current:', activeChannelRef.current);
    console.log('   - messages.length:', messages.length);
    console.log('   - socketConnected:', socketConnected);
    console.log('   - joinedToProject:', joinedToProject);
    console.log('   - user:', user);
    console.log('   - projectId:', projectId);
  };

  // Hacer disponible globalmente para debugging
  window.debugChatState = debugCurrentState;

  // =================================================================
  // EFECTOS MEJORADOS
  // =================================================================

  // 🔥 EFECTO PARA SINCRONIZAR activeChannel CON SU REFERENCIA
  useEffect(() => {
    activeChannelRef.current = activeChannel;
    console.log('🔄 ACTIVE CHANNEL UPDATED:', activeChannel?._id);
  }, [activeChannel]);

  // Efecto principal
  useEffect(() => {
    console.log('🚀 GLOBAL CHAT: Iniciando...');
    
    if (projectId && user && token) {
      // Pedir permisos de notificación
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      loadChannels();
      
      setTimeout(() => {
        initializeSocket();
      }, 1000);
    }

    return () => {
      cleanupSocket();
      document.title = 'Planifica+';
    };
  }, [projectId, user?.id, token]);

  // Calcular total no leídos
  useEffect(() => {
    const total = Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0);
    setTotalUnread(total);
    
    if (total > 0) {
      document.title = `(${total}) Chat - Planifica+`;
    } else {
      document.title = 'Chat - Planifica+';
    }
  }, [unreadCounts]);

  // =================================================================
  // FUNCIONES DE UTILIDAD
  // =================================================================

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvatar = (userName) => {
    const initial = userName?.charAt(0)?.toUpperCase() || 'U';
    const colors = ['28a745', 'dc3545', '007bff', 'ffc107', '6f42c1', '17a2b8'];
    const colorIndex = userName?.length % colors.length || 0;
    return `https://placehold.co/32x32/${colors[colorIndex]}/white?text=${initial}`;
  };

  // =================================================================
  // RENDERIZADO CON ALTURA FIJA LIKE WHATSAPP
  // =================================================================

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      {/* Audio para notificaciones */}
      <audio
        ref={notificationAudioRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaATOB0Oy3YRYE" type="audio/wav" />
      </audio>

      {/* Toast Notification */}
      {showNotificationToast && latestNotification && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1055 }}>
          <div className="toast show" role="alert">
            <div className="toast-header">
              <div className="rounded me-2 bg-primary" style={{ width: '20px', height: '20px' }}></div>
              <strong className="me-auto">#{latestNotification.channelName}</strong>
              <small className="text-muted">{latestNotification.timestamp}</small>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowNotificationToast(false)}
              ></button>
            </div>
            <div className="toast-body">
              <strong>{latestNotification.senderName}:</strong> {latestNotification.content}
            </div>
          </div>
        </div>
      )}

      {/* Header COMPACTO */}
      <div className="bg-white border-bottom p-3 flex-shrink-0">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h4 mb-1">
              Chat Global 
              {socketConnected && joinedToProject ? (
                <span className="badge bg-success ms-2">🟢 Conectado</span>
              ) : (
                <span className="badge bg-danger ms-2">🔴 Desconectado</span>
              )}
              {totalUnread > 0 && (
                <span className="badge bg-danger ms-2">{totalUnread} nuevos</span>
              )}
            </h1>
            <small className="text-muted">
              Proyecto: {projectId?.substring(0, 8)}... | Usuario: {user?.name} | Canales: {channels.length}
            </small>
          </div>
          <div>
            <button 
              className="btn btn-primary btn-sm me-2"
              onClick={() => setShowModal(true)}
              disabled={!projectId}
            >
              + Canal
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => loadChannels()}
              disabled={loading}
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show m-3">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Debug Panel COMPACTO */}
      <div className="bg-light border-bottom p-2 flex-shrink-0">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted">
              Socket Events: {socketEvents.length > 0 && (
                <span className="text-primary">{socketEvents[0]?.type} - {socketEvents[0]?.timestamp}</span>
              )}
            </small>
          </div>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setSocketEvents([])}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* 🔥 CHAT LAYOUT CON ALTURA FIJA - LIKE WHATSAPP */}
      <div className="flex-grow-1 d-flex" style={{ minHeight: 0 }}>
        {/* Sidebar - Canales */}
        <div className="border-end" style={{ width: '350px', maxWidth: '350px' }}>
          <div className="h-100 d-flex flex-column">
            <div className="bg-light p-3 border-bottom">
              <strong>Canales</strong>
              <span className="badge bg-primary ms-2">{channels.length}</span>
            </div>
            
            <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
              {channels.length === 0 ? (
                <div className="text-center p-4 text-muted">
                  <i className="bi bi-chat-dots fs-1 d-block mb-2"></i>
                  <p>No hay canales</p>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowModal(true)}
                  >
                    Crear Primer Canal
                  </button>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {channels.map((channel) => {
                    const unreadCount = unreadCounts.get(channel._id) || 0;
                    const isActive = activeChannel?._id === channel._id;
                    
                    return (
                      <button
                        key={channel._id}
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                          isActive ? 'active' : ''
                        } ${unreadCount > 0 && !isActive ? 'border-start border-danger border-4' : ''}`}
                        onClick={() => switchToChannel(channel)}
                      >
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center">
                            <strong># {channel.name}</strong>
                            {unreadCount > 0 && !isActive && (
                              <span className="badge bg-danger ms-2 rounded-pill">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <small className={`${isActive ? 'text-white-75' : 'text-muted'}`}>
                            {channel.description || 'Sin descripción'}
                          </small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔥 MAIN CHAT AREA - ALTURA FIJA LIKE WHATSAPP */}
        <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
          {activeChannel ? (
            <>
              {/* Header del Chat */}
              <div className="bg-white border-bottom p-3 flex-shrink-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      # {activeChannel.name}
                      {socketConnected && joinedToProject && (
                        <span className="badge bg-success ms-2">
                          <i className="bi bi-broadcast"></i> Live
                        </span>
                      )}
                    </h5>
                    <small className="text-muted">
                      {activeChannel.description} • {messages.length} mensajes
                    </small>
                  </div>
                  <div>
                    <small className="text-muted">ID: {activeChannel._id?.substring(0, 8)}...</small>
                  </div>
                </div>
              </div>
              
              {/* 🔥 CONTAINER DE MENSAJES - ALTURA FIJA CON SCROLL INTERNO */}
              <div 
                ref={messagesContainerRef}
                className="flex-grow-1 p-3 bg-light" 
                style={{ 
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  minHeight: 0, // Crucial para que funcione el flex
                  maxHeight: '100%', // Limitar altura
                  scrollBehavior: 'smooth'
                }}
              >
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-chat-text fs-1 d-block mb-3"></i>
                    <h5>¡Inicia la conversación!</h5>
                    <p>Sé el primero en escribir en # {activeChannel.name}</p>
                  </div>
                ) : (
                  <div>
                    {messages.map((message, index) => (
                      <div key={message._id || index} className="mb-3">
                        <div className="d-flex align-items-start">
                          <img 
                            src={getAvatar(message.sender?.name)} 
                            className="rounded-circle me-2 flex-shrink-0"
                            style={{ width: '32px', height: '32px' }}
                            alt={message.sender?.name}
                          />
                          <div className="flex-grow-1 min-width-0">
                            <div className="d-flex align-items-baseline mb-1">
                              <strong className="me-2">
                                {message.sender?.name || 'Usuario'}
                              </strong>
                              <small className="text-muted">
                                {formatTime(message.createdAt)}
                              </small>
                              {message.sender?._id === user?.id && (
                                <small className="badge bg-light text-dark ms-2">Tú</small>
                              )}
                            </div>
                            <div className="bg-white p-2 rounded shadow-sm">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Anchor para scroll */}
                    <div ref={messagesEndRef} style={{ height: '1px' }} />
                  </div>
                )}
              </div>
              
              {/* Input de Mensaje */}
              <div className="bg-white border-top p-3 flex-shrink-0">
                <form onSubmit={sendMessage}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Mensaje para # ${activeChannel.name}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={!socketConnected || !joinedToProject}
                      maxLength={1000}
                    />
                    <button 
                      className="btn btn-primary" 
                      type="submit"
                      disabled={!newMessage.trim() || !socketConnected || !joinedToProject}
                    >
                      <i className="bi bi-send-fill"></i>
                    </button>
                  </div>
                  {(!socketConnected || !joinedToProject) && (
                    <small className="text-warning">
                      ⚠️ {!socketConnected ? 'Desconectado' : 'No unido al proyecto'} - Los mensajes no se enviarán
                    </small>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center text-muted">
                <i className="bi bi-chat-square-dots fs-1 d-block mb-3"></i>
                <h4>Selecciona un canal</h4>
                <p>Elige un canal de la lista para comenzar a chatear</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Canal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Crear Nuevo Canal</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    setNewChannelName('');
                  }}
                ></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createChannel(); }}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre del Canal</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="general, desarrollo, diseño..."
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setNewChannelName('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!newChannelName.trim()}
                  >
                    Crear Canal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalNotificationsChatPage;