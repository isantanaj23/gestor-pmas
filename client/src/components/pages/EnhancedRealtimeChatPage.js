import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { io } from 'socket.io-client';

function EnhancedRealtimeChatPage() {
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
  
  // 🆕 Estados para notificaciones
  const [unreadCounts, setUnreadCounts] = useState(new Map()); // channelId -> count
  const [totalUnread, setTotalUnread] = useState(0);
  const [lastMessageNotifications, setLastMessageNotifications] = useState([]);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  
  // Estados para crear canal
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  
  // Referencias
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const notificationAudioRef = useRef(null);

  // =================================================================
  // 🆕 FUNCIONES DE NOTIFICACIONES
  // =================================================================

  const playNotificationSound = () => {
    // Crear sonido de notificación simple
    if (notificationAudioRef.current) {
      notificationAudioRef.current.play().catch(e => {
        console.log('No se pudo reproducir sonido:', e);
      });
    } else {
      // Fallback: beep del sistema
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaATOB0Oy3YRYE');
        audio.play();
      } catch (e) {
        console.log('Fallback sound failed:', e);
      }
    }
  };

  const showNotification = (message, channelName) => {
    // Notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Nuevo mensaje en #${channelName}`, {
        body: `${message.sender?.name}: ${message.content}`,
        icon: '/favicon.ico',
        tag: `chat-${message.channel}`,
        silent: false
      });
    }

    // Toast notification
    setLatestNotification({
      id: Date.now(),
      channelName,
      senderName: message.sender?.name || 'Usuario',
      content: message.content,
      timestamp: new Date().toLocaleTimeString()
    });
    
    setShowNotificationToast(true);
    
    // Auto-hide después de 4 segundos
    setTimeout(() => {
      setShowNotificationToast(false);
    }, 4000);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
    }
  };

  const updateUnreadCount = (channelId, increment = true) => {
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      const currentCount = newCounts.get(channelId) || 0;
      const newCount = increment ? currentCount + 1 : 0;
      
      if (newCount > 0) {
        newCounts.set(channelId, newCount);
      } else {
        newCounts.delete(channelId);
      }
      
      console.log('📊 Unread counts updated:', Object.fromEntries(newCounts));
      return newCounts;
    });
  };

  const calculateTotalUnread = () => {
    const total = Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0);
    setTotalUnread(total);
    
    // Actualizar título de la página
    if (total > 0) {
      document.title = `(${total}) Chat - Planifica+`;
    } else {
      document.title = 'Chat - Planifica+';
    }
  };

  const clearChannelUnread = (channelId) => {
    updateUnreadCount(channelId, false);
    
    // También marcar como leído en el backend (opcional)
    if (channelId) {
      API.post(`/messages/channel/${channelId}/mark-all-read`).catch(e => {
        console.log('Error marking as read:', e);
      });
    }
  };

  const addMessageNotification = (message, channelName) => {
    const notification = {
      id: Date.now(),
      channelId: message.channel,
      channelName,
      senderName: message.sender?.name || 'Usuario',
      content: message.content,
      timestamp: new Date(),
      isRead: false
    };
    
    setLastMessageNotifications(prev => [notification, ...prev.slice(0, 19)]); // Mantener últimas 20
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
    
    setSocketEvents(prev => [event, ...prev.slice(0, 9)]);
    console.log('🎯 SOCKET EVENT:', type, data);
  };

  // =================================================================
  // SOCKET.IO CON NOTIFICACIONES MEJORADAS
  // =================================================================

  const initializeSocket = () => {
    if (socketRef.current || !token) {
      console.log('⏭️ ENHANCED CHAT: Socket ya existe o no hay token');
      return;
    }

    console.log('🔌 ENHANCED CHAT: Inicializando Socket.io...');
    
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
      console.log('✅ ENHANCED CHAT: Socket conectado:', newSocket.id);
      setSocket(newSocket);
      setSocketConnected(true);
      addSocketEvent('connect', { socketId: newSocket.id });
      
      // Unirse al canal activo si existe
      if (activeChannel) {
        console.log('🏠 ENHANCED CHAT: Uniéndose al canal activo:', activeChannel._id);
        newSocket.emit('join_channel', activeChannel._id);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 ENHANCED CHAT: Socket desconectado:', reason);
      setSocketConnected(false);
      addSocketEvent('disconnect', { reason });
      
      if (reason !== 'io client disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 ENHANCED CHAT: Intentando reconectar...');
          initializeSocket();
        }, 3000);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ ENHANCED CHAT: Error de conexión:', error);
      setSocketConnected(false);
      addSocketEvent('connect_error', { error: error.message });
    });

    // =================================================================
    // 🆕 EVENT LISTENERS CON NOTIFICACIONES
    // =================================================================

    // Nuevo mensaje recibido
    newSocket.on('new_message', (data) => {
      console.log('📨 ENHANCED CHAT: Nuevo mensaje recibido:', data);
      addSocketEvent('new_message', data);
      
      const newMsg = data.message;
      const isFromActiveChannel = data.channelId === activeChannel?._id;
      const isFromSelf = newMsg.sender?._id === user?.id;
      
      console.log('📊 Message analysis:', {
        isFromActiveChannel,
        isFromSelf,
        activeChannelId: activeChannel?._id,
        messageChannelId: data.channelId
      });
      
      if (isFromActiveChannel) {
        // Mensaje del canal activo: agregar a la UI inmediatamente
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === newMsg._id);
          if (exists) {
            console.log('⚠️ ENHANCED CHAT: Mensaje duplicado, ignorando');
            return prev;
          }
          
          console.log('✅ ENHANCED CHAT: Agregando mensaje a la UI del canal activo');
          return [...prev, newMsg];
        });
        
        setTimeout(() => scrollToBottom(), 100);
        
      } else if (!isFromSelf) {
        // Mensaje de otro canal y no es propio: mostrar notificación
        console.log('🔔 ENHANCED CHAT: Mensaje de otro canal, mostrando notificación');
        
        // Incrementar contador de no leídos
        updateUnreadCount(data.channelId, true);
        
        // Encontrar nombre del canal
        const channelName = channels.find(ch => ch._id === data.channelId)?.name || 'Canal desconocido';
        
        // Agregar a notificaciones
        addMessageNotification(newMsg, channelName);
        
        // Mostrar notificación visual y sonora
        showNotification(newMsg, channelName);
        playNotificationSound();
        
        console.log('✅ ENHANCED CHAT: Notificación de mensaje enviada');
      }
    });

    // Nuevo canal creado
    newSocket.on('channel_created_global', (data) => {
      console.log('📢 ENHANCED CHAT: Nuevo canal creado:', data);
      addSocketEvent('channel_created', data);
      
      if (data.projectId === projectId) {
        setChannels(prev => {
          const exists = prev.some(ch => ch._id === data.channel._id);
          if (exists) return prev;
          
          console.log('✅ ENHANCED CHAT: Agregando canal a la UI');
          return [data.channel, ...prev];
        });
      }
    });

    // Test events
    newSocket.on('pong_test', (data) => {
      console.log('🏓 ENHANCED CHAT: Pong recibido:', data);
      addSocketEvent('pong_test', data);
    });

    newSocket.on('test_message', (data) => {
      console.log('🧪 ENHANCED CHAT: Test message recibido:', data);
      addSocketEvent('test_message', data);
    });

    // Usuario events
    newSocket.on('user_joined_channel', (data) => {
      console.log('👋 ENHANCED CHAT: Usuario se unió al canal:', data);
      addSocketEvent('user_joined_channel', data);
    });

    newSocket.on('user_left_channel', (data) => {
      console.log('👋 ENHANCED CHAT: Usuario salió del canal:', data);
      addSocketEvent('user_left_channel', data);
    });

    socketRef.current = newSocket;
  };

  const cleanupSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      console.log('🔌 ENHANCED CHAT: Cerrando Socket.io');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setSocketConnected(false);
    }
  };

  // =================================================================
  // FUNCIONES DE API (igual que antes)
  // =================================================================

  const loadChannels = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 ENHANCED CHAT: Cargando canales para proyecto:', projectId);
      
      const response = await API.get(`/channels/project/${projectId}`);
      console.log('📥 ENHANCED CHAT: Respuesta canales:', response.data);
      
      if (response.data?.success) {
        const channelData = response.data.data || [];
        setChannels(channelData);
        console.log('✅ ENHANCED CHAT: Canales cargados:', channelData.length);
        
        if (channelData.length > 0 && !activeChannel) {
          await switchToChannel(channelData[0]);
        }
      }
      
    } catch (error) {
      console.error('❌ ENHANCED CHAT: Error cargando canales:', error);
      setError(`Error cargando canales: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId) => {
    if (!channelId) return;

    try {
      console.log('📡 ENHANCED CHAT: Cargando mensajes del canal:', channelId);
      
      const response = await API.get(`/messages/channel/${channelId}`);
      console.log('📥 ENHANCED CHAT: Respuesta mensajes:', response.data);
      
      if (response.data?.success) {
        const messageData = response.data.data || [];
        setMessages(messageData);
        console.log('✅ ENHANCED CHAT: Mensajes cargados:', messageData.length);
        
        setTimeout(() => scrollToBottom(), 100);
      }
      
    } catch (error) {
      console.error('❌ ENHANCED CHAT: Error cargando mensajes:', error);
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !projectId) return;

    try {
      console.log('📝 ENHANCED CHAT: Creando canal:', newChannelName);
      
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
      console.error('❌ ENHANCED CHAT: Error creando canal:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChannel) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      console.log('📝 ENHANCED CHAT: Enviando mensaje:', messageContent);
      
      const response = await API.post('/messages', {
        content: messageContent,
        channelId: activeChannel._id
      });
      
      if (response.data?.success) {
        console.log('✅ ENHANCED CHAT: Mensaje enviado, esperando Socket.io...');
      }
      
    } catch (error) {
      console.error('❌ ENHANCED CHAT: Error enviando mensaje:', error);
      setNewMessage(messageContent);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const switchToChannel = async (channel) => {
    console.log('🔄 ENHANCED CHAT: Cambiando a canal:', channel.name);
    
    // Limpiar contador de no leídos del canal anterior
    if (activeChannel) {
      clearChannelUnread(activeChannel._id);
      
      if (socketRef.current) {
        console.log('👋 ENHANCED CHAT: Saliendo del canal anterior:', activeChannel._id);
        socketRef.current.emit('leave_channel', activeChannel._id);
      }
    }
    
    setActiveChannel(channel);
    setMessages([]);
    await loadMessages(channel._id);
    
    // Limpiar contador de no leídos del nuevo canal
    clearChannelUnread(channel._id);
    
    // Unirse al nuevo canal
    if (socketRef.current) {
      console.log('🏠 ENHANCED CHAT: Uniéndose al nuevo canal:', channel._id);
      socketRef.current.emit('join_channel', channel._id);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Funciones de test (igual que antes)
  const testSocketConnection = () => {
    if (socketRef.current) {
      console.log('🧪 ENHANCED CHAT: Enviando ping test...');
      socketRef.current.emit('ping_test', {
        message: 'Test desde frontend',
        timestamp: new Date(),
        user: user?.name
      });
    }
  };

  const testMessageEmit = async () => {
    if (!activeChannel) return;
    
    try {
      console.log('🧪 ENHANCED CHAT: Enviando test emit...');
      
      const response = await API.post(`/messages/test-emit/${activeChannel._id}`, {
        test: 'Mensaje de prueba',
        user: user?.name,
        timestamp: new Date()
      });
      
      console.log('📥 ENHANCED CHAT: Test emit response:', response.data);
      
    } catch (error) {
      console.error('❌ ENHANCED CHAT: Error en test emit:', error);
    }
  };

  // =================================================================
  // EFECTOS
  // =================================================================

  // Efecto principal
  useEffect(() => {
    console.log('🚀 ENHANCED CHAT: Iniciando...');
    
    if (projectId && user && token) {
      // Solicitar permisos de notificación
      requestNotificationPermission();
      
      loadChannels();
      setTimeout(() => {
        initializeSocket();
      }, 1000);
    }

    return () => {
      cleanupSocket();
      // Limpiar título
      document.title = 'Planifica+';
    };
  }, [projectId, user?.id, token]);

  // Efecto para calcular total no leídos
  useEffect(() => {
    calculateTotalUnread();
  }, [unreadCounts]);

  // Efecto para canal activo
  useEffect(() => {
    if (socketRef.current && activeChannel && socketConnected) {
      console.log('🏠 ENHANCED CHAT: Canal activo cambió:', activeChannel._id);
      socketRef.current.emit('join_channel', activeChannel._id);
    }
  }, [activeChannel, socketConnected]);

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
  // RENDERIZADO
  // =================================================================

  return (
    <div className="container-fluid">
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

      {/* Header con notificaciones */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2">
            Chat en Tiempo Real
            {socketConnected ? (
              <span className="badge bg-success ms-2">🟢 Conectado</span>
            ) : (
              <span className="badge bg-danger ms-2">🔴 Desconectado</span>
            )}
            {totalUnread > 0 && (
              <span className="badge bg-danger ms-2">{totalUnread} nuevos</span>
            )}
          </h1>
          <p className="text-muted">
            Proyecto: {projectId} | Usuario: {user?.name} | Canales: {channels.length}
            {socket && <span className="ms-2">Socket: {socket.id?.substring(0, 8)}</span>}
          </p>
        </div>
        <div>
          <button 
            className="btn btn-primary me-2"
            onClick={() => setShowModal(true)}
            disabled={!projectId}
          >
            + Canal
          </button>
          <button 
            className="btn btn-outline-secondary me-2"
            onClick={loadChannels}
            disabled={loading}
          >
            🔄 Recargar
          </button>
          <button 
            className="btn btn-outline-info me-2"
            onClick={testSocketConnection}
            disabled={!socketConnected}
          >
            🧪 Test Socket
          </button>
          <button 
            className="btn btn-outline-warning"
            onClick={testMessageEmit}
            disabled={!activeChannel || !socketConnected}
          >
            🧪 Test Emit
          </button>
        </div>
      </div>

      {/* Debug Panel - Socket Events */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>🔍 Socket.io Events & Notifications</strong>
              <div>
                <span className="badge bg-info me-2">Total no leídos: {totalUnread}</span>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setSocketEvents([]);
                    setLastMessageNotifications([]);
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>
            <div className="card-body" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              <div className="row">
                <div className="col-md-6">
                  <h6>Socket Events:</h6>
                  {socketEvents.length === 0 ? (
                    <small className="text-muted">No hay eventos...</small>
                  ) : (
                    <div style={{ fontSize: '12px' }}>
                      {socketEvents.map((event) => (
                        <div key={event.id} className="border-bottom pb-1 mb-1">
                          <strong className="text-primary">{event.timestamp}</strong> 
                          <span className="badge bg-light text-dark ms-2">{event.type}</span>
                          <br />
                          <span className="text-muted">{event.data}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <h6>Message Notifications:</h6>
                  {lastMessageNotifications.length === 0 ? (
                    <small className="text-muted">No hay notificaciones...</small>
                  ) : (
                    <div style={{ fontSize: '12px' }}>
                      {lastMessageNotifications.slice(0, 5).map((notif) => (
                        <div key={notif.id} className="border-bottom pb-1 mb-1">
                          <strong className="text-success">#{notif.channelName}</strong>
                          <br />
                          <span className="text-dark">{notif.senderName}: {notif.content.substring(0, 30)}...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Chat Layout */}
      <div className="row" style={{ height: '60vh' }}>
        {/* Sidebar - Canales con badges de notificación */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Canales</strong>
              <div>
                <span className="badge bg-primary">{channels.length}</span>
                {totalUnread > 0 && (
                  <span className="badge bg-danger ms-1">{totalUnread}</span>
                )}
              </div>
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto' }}>
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
                        } ${unreadCount > 0 && !isActive ? 'border-start border-danger border-3' : ''}`}
                        onClick={() => switchToChannel(channel)}
                      >
                        <div>
                          <div className="d-flex align-items-center">
                            <strong># {channel.name}</strong>
                            {unreadCount > 0 && !isActive && (
                              <span className="badge bg-danger ms-2 rounded-pill">
                                {unreadCount}
                              </span>
                            )}
                            {channel.isPrivate && (
                              <i className="bi bi-lock-fill ms-1 text-muted"></i>
                            )}
                          </div>
                          <small className={`${isActive ? 'text-white-75' : 'text-muted'}`}>
                            {channel.description || 'Sin descripción'}
                          </small>
                        </div>
                        {unreadCount > 0 && !isActive && (
                          <div className="position-relative">
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                              <span className="visually-hidden">Mensajes nuevos</span>
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area - Igual que antes pero con indicador Live mejorado */}
        <div className="col-md-8">
          <div className="card h-100 d-flex flex-column">
            {activeChannel ? (
              <>
                <div className="card-header">
                  <h5 className="mb-0">
                    # {activeChannel.name}
                    {socketConnected && (
                      <span className="badge bg-success ms-2">
                        <i className="bi bi-broadcast"></i> Live
                      </span>
                    )}
                  </h5>
                  <small className="text-muted">
                    {activeChannel.description} • {messages.length} mensajes
                    • ID: {activeChannel._id?.substring(0, 8)}...
                  </small>
                </div>
                
                <div className="card-body flex-grow-1" style={{ overflowY: 'auto' }}>
                  {messages.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-chat-text fs-1 d-block mb-3"></i>
                      <h5>¡Inicia la conversación!</h5>
                      <p>Sé el primero en escribir en # {activeChannel.name}</p>
                    </div>
                  ) : (
                    <div>
                      {messages.map((message) => (
                        <div key={message._id} className="mb-3">
                          <div className="d-flex align-items-start">
                            <img 
                              src={getAvatar(message.sender?.name)} 
                              className="rounded-circle me-2"
                              style={{ width: '32px', height: '32px' }}
                              alt={message.sender?.name}
                            />
                            <div className="flex-grow-1">
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
                              <div className="bg-light p-2 rounded">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                <div className="card-footer">
                  <form onSubmit={sendMessage}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Mensaje para # ${activeChannel.name}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={!socketConnected}
                        maxLength={1000}
                      />
                      <button 
                        className="btn btn-primary" 
                        type="submit"
                        disabled={!newMessage.trim() || !socketConnected}
                      >
                        <i className="bi bi-send-fill"></i>
                      </button>
                    </div>
                    {!socketConnected && (
                      <small className="text-warning">
                        ⚠️ Desconectado - Los mensajes no se enviarán en tiempo real
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
                  {totalUnread > 0 && (
                    <div className="alert alert-info">
                      <i className="bi bi-bell-fill"></i> Tienes {totalUnread} mensajes sin leer
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Crear Canal - Igual que antes */}
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
                  <div className="text-muted">
                    <small><strong>Proyecto:</strong> {projectId}</small><br />
                    <small><strong>Socket:</strong> {socketConnected ? '🟢 Conectado' : '🔴 Desconectado'}</small>
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

export default EnhancedRealtimeChatPage;