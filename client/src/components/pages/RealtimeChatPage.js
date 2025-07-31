import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { io } from 'socket.io-client';

function RealtimeChatPage() {
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
  
  // Estados para crear canal
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  
  // Referencias
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

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
    
    setSocketEvents(prev => [event, ...prev.slice(0, 9)]); // Mantener últimos 10
    console.log('🎯 SOCKET EVENT:', type, data);
  };

  // =================================================================
  // SOCKET.IO MEJORADO Y SIMPLIFICADO
  // =================================================================

  const initializeSocket = () => {
    // Evitar múltiples conexiones
    if (socketRef.current || !token) {
      console.log('⏭️ REALTIME CHAT: Socket ya existe o no hay token');
      return;
    }

    console.log('🔌 REALTIME CHAT: Inicializando Socket.io...');
    console.log('🔑 REALTIME CHAT: Token presente:', !!token);
    
    const newSocket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true, // Forzar nueva conexión
      timeout: 10000
    });

    // =================================================================
    // EVENT LISTENERS DE CONEXIÓN
    // =================================================================

    newSocket.on('connect', () => {
      console.log('✅ REALTIME CHAT: Socket conectado:', newSocket.id);
      setSocket(newSocket);
      setSocketConnected(true);
      addSocketEvent('connect', { socketId: newSocket.id });
      
      // Unirse al canal activo si existe
      if (activeChannel) {
        console.log('🏠 REALTIME CHAT: Uniéndose al canal activo:', activeChannel._id);
        newSocket.emit('join_channel', activeChannel._id);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 REALTIME CHAT: Socket desconectado:', reason);
      setSocketConnected(false);
      addSocketEvent('disconnect', { reason });
      
      // Reconectar automáticamente si no fue intencional
      if (reason !== 'io client disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 REALTIME CHAT: Intentando reconectar...');
          initializeSocket();
        }, 3000);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ REALTIME CHAT: Error de conexión:', error);
      setSocketConnected(false);
      addSocketEvent('connect_error', { error: error.message });
    });

    // =================================================================
    // EVENT LISTENERS DE CHAT
    // =================================================================

    // Nuevo mensaje recibido
    newSocket.on('new_message', (data) => {
      console.log('📨 REALTIME CHAT: Nuevo mensaje recibido:', data);
      addSocketEvent('new_message', data);
      
      // Solo agregar si es del canal activo
      if (data.channelId === activeChannel?._id) {
        const newMsg = data.message;
        
        setMessages(prev => {
          // Evitar duplicados
          const exists = prev.some(msg => msg._id === newMsg._id);
          if (exists) {
            console.log('⚠️ REALTIME CHAT: Mensaje duplicado, ignorando');
            return prev;
          }
          
          console.log('✅ REALTIME CHAT: Agregando mensaje a la UI');
          return [...prev, newMsg];
        });
        
        // Scroll automático
        setTimeout(() => scrollToBottom(), 100);
      } else {
        console.log('ℹ️ REALTIME CHAT: Mensaje para otro canal, ignorando');
      }
    });

    // Nuevo canal creado
    newSocket.on('channel_created_global', (data) => {
      console.log('📢 REALTIME CHAT: Nuevo canal creado:', data);
      addSocketEvent('channel_created', data);
      
      // Solo agregar si es del proyecto activo
      if (data.projectId === projectId) {
        setChannels(prev => {
          // Evitar duplicados
          const exists = prev.some(ch => ch._id === data.channel._id);
          if (exists) return prev;
          
          console.log('✅ REALTIME CHAT: Agregando canal a la UI');
          return [data.channel, ...prev];
        });
      }
    });

    // Test de conectividad
    newSocket.on('pong_test', (data) => {
      console.log('🏓 REALTIME CHAT: Pong recibido:', data);
      addSocketEvent('pong_test', data);
    });

    newSocket.on('test_message', (data) => {
      console.log('🧪 REALTIME CHAT: Test message recibido:', data);
      addSocketEvent('test_message', data);
    });

    // Usuario se unió/salió del canal
    newSocket.on('user_joined_channel', (data) => {
      console.log('👋 REALTIME CHAT: Usuario se unió al canal:', data);
      addSocketEvent('user_joined_channel', data);
    });

    newSocket.on('user_left_channel', (data) => {
      console.log('👋 REALTIME CHAT: Usuario salió del canal:', data);
      addSocketEvent('user_left_channel', data);
    });

    socketRef.current = newSocket;
  };

  const cleanupSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      console.log('🔌 REALTIME CHAT: Cerrando Socket.io');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setSocketConnected(false);
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
      
      console.log('📡 REALTIME CHAT: Cargando canales para proyecto:', projectId);
      
      const response = await API.get(`/channels/project/${projectId}`);
      console.log('📥 REALTIME CHAT: Respuesta canales:', response.data);
      
      if (response.data?.success) {
        const channelData = response.data.data || [];
        setChannels(channelData);
        console.log('✅ REALTIME CHAT: Canales cargados:', channelData.length);
        
        // Auto-seleccionar primer canal si no hay uno activo
        if (channelData.length > 0 && !activeChannel) {
          await switchToChannel(channelData[0]);
        }
      }
      
    } catch (error) {
      console.error('❌ REALTIME CHAT: Error cargando canales:', error);
      setError(`Error cargando canales: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId) => {
    if (!channelId) return;

    try {
      console.log('📡 REALTIME CHAT: Cargando mensajes del canal:', channelId);
      
      const response = await API.get(`/messages/channel/${channelId}`);
      console.log('📥 REALTIME CHAT: Respuesta mensajes:', response.data);
      
      if (response.data?.success) {
        const messageData = response.data.data || [];
        setMessages(messageData);
        console.log('✅ REALTIME CHAT: Mensajes cargados:', messageData.length);
        
        // Scroll al final
        setTimeout(() => scrollToBottom(), 100);
      }
      
    } catch (error) {
      console.error('❌ REALTIME CHAT: Error cargando mensajes:', error);
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !projectId) return;

    try {
      console.log('📝 REALTIME CHAT: Creando canal:', newChannelName);
      
      const response = await API.post('/channels', {
        name: newChannelName.trim(),
        description: `Canal ${newChannelName}`,
        projectId,
        isPrivate: false
      });
      
      console.log('📥 REALTIME CHAT: Canal creado:', response.data);
      
      if (response.data?.success) {
        setNewChannelName('');
        setShowModal(false);
        
        // El canal se agregará automáticamente via Socket.io
        // Pero por si acaso, también recargar
        setTimeout(() => loadChannels(), 1000);
        
        alert('Canal creado exitosamente');
      }
      
    } catch (error) {
      console.error('❌ REALTIME CHAT: Error creando canal:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChannel) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Limpiar inmediatamente

    try {
      console.log('📝 REALTIME CHAT: Enviando mensaje:', messageContent);
      
      const response = await API.post('/messages', {
        content: messageContent,
        channelId: activeChannel._id
      });
      
      console.log('📥 REALTIME CHAT: Mensaje enviado:', response.data);
      
      if (response.data?.success) {
        // El mensaje se agregará automáticamente via Socket.io
        console.log('✅ REALTIME CHAT: Mensaje enviado, esperando Socket.io...');
      }
      
    } catch (error) {
      console.error('❌ REALTIME CHAT: Error enviando mensaje:', error);
      setNewMessage(messageContent); // Restaurar si hay error
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const switchToChannel = async (channel) => {
    console.log('🔄 REALTIME CHAT: Cambiando a canal:', channel.name);
    
    // Salir del canal anterior
    if (activeChannel && socketRef.current) {
      console.log('👋 REALTIME CHAT: Saliendo del canal anterior:', activeChannel._id);
      socketRef.current.emit('leave_channel', activeChannel._id);
    }
    
    setActiveChannel(channel);
    setMessages([]);
    await loadMessages(channel._id);
    
    // Unirse al nuevo canal
    if (socketRef.current) {
      console.log('🏠 REALTIME CHAT: Uniéndose al nuevo canal:', channel._id);
      socketRef.current.emit('join_channel', channel._id);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Función de test
  const testSocketConnection = () => {
    if (socketRef.current) {
      console.log('🧪 REALTIME CHAT: Enviando ping test...');
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
      console.log('🧪 REALTIME CHAT: Enviando test emit...');
      
      const response = await API.post(`/messages/test-emit/${activeChannel._id}`, {
        test: 'Mensaje de prueba',
        user: user?.name,
        timestamp: new Date()
      });
      
      console.log('📥 REALTIME CHAT: Test emit response:', response.data);
      
    } catch (error) {
      console.error('❌ REALTIME CHAT: Error en test emit:', error);
    }
  };

  // =================================================================
  // EFECTOS
  // =================================================================

  // Efecto principal: inicializar cuando esté listo
  useEffect(() => {
    console.log('🚀 REALTIME CHAT: Iniciando...');
    console.log('  - projectId:', projectId);
    console.log('  - user:', user?.id);
    console.log('  - token:', !!token);
    
    if (projectId && user && token) {
      loadChannels();
      
      // Inicializar Socket.io después de un breve delay
      setTimeout(() => {
        initializeSocket();
      }, 1000);
    }

    // Cleanup al desmontar
    return () => {
      cleanupSocket();
    };
  }, [projectId, user?.id, token]);

  // Efecto para manejar cambios de canal activo
  useEffect(() => {
    if (socketRef.current && activeChannel && socketConnected) {
      console.log('🏠 REALTIME CHAT: Canal activo cambió, uniéndose via Socket.io:', activeChannel._id);
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
      {/* Header con Status */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2">
            Chat en Tiempo Real
            {socketConnected ? (
              <span className="badge bg-success ms-2">🟢 Conectado</span>
            ) : (
              <span className="badge bg-danger ms-2">🔴 Desconectado</span>
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
              <strong>🔍 Socket.io Events (últimos 10)</strong>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSocketEvents([])}
              >
                Limpiar
              </button>
            </div>
            <div className="card-body" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {socketEvents.length === 0 ? (
                <small className="text-muted">No hay eventos aún...</small>
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
        {/* Sidebar - Canales */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Canales</strong>
              <span className="badge bg-primary">{channels.length}</span>
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
                  {channels.map((channel) => (
                    <button
                      key={channel._id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        activeChannel?._id === channel._id ? 'active' : ''
                      }`}
                      onClick={() => switchToChannel(channel)}
                    >
                      <div>
                        <strong># {channel.name}</strong>
                        <br />
                        <small className="text-muted">
                          {channel.description || 'Sin descripción'}
                        </small>
                      </div>
                      {channel.isPrivate && (
                        <i className="bi bi-lock-fill"></i>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="col-md-8">
          <div className="card h-100 d-flex flex-column">
            {activeChannel ? (
              <>
                {/* Chat Header */}
                <div className="card-header">
                  <h5 className="mb-0">
                    # {activeChannel.name}
                    {socketConnected && (
                      <span className="badge bg-success ms-2">Live</span>
                    )}
                  </h5>
                  <small className="text-muted">
                    {activeChannel.description} • {messages.length} mensajes
                    • ID: {activeChannel._id?.substring(0, 8)}...
                  </small>
                </div>
                
                {/* Messages */}
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
                
                {/* Message Input */}
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
              /* No Channel Selected */
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

export default RealtimeChatPage;