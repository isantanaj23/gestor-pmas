import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { io } from 'socket.io-client';

function SimpleChatPage() {
  const { projectId } = useParams();
  const { user, token } = useAuth();
  
  // Estados básicos
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // Estados para crear canal
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  
  // Referencias
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // =================================================================
  // FUNCIONES DE API DIRECTAS (SIN HOOKS COMPLEJOS)
  // =================================================================

  const loadChannels = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 SIMPLE CHAT: Cargando canales para proyecto:', projectId);
      
      const response = await API.get(`/channels/project/${projectId}`);
      console.log('📥 SIMPLE CHAT: Respuesta canales:', response.data);
      
      if (response.data?.success) {
        const channelData = response.data.data || [];
        setChannels(channelData);
        console.log('✅ SIMPLE CHAT: Canales cargados:', channelData.length);
        
        // Auto-seleccionar primer canal si no hay uno activo
        if (channelData.length > 0 && !activeChannel) {
          await switchToChannel(channelData[0]);
        }
      }
      
    } catch (error) {
      console.error('❌ SIMPLE CHAT: Error cargando canales:', error);
      setError(`Error cargando canales: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId) => {
    if (!channelId) return;

    try {
      console.log('📡 SIMPLE CHAT: Cargando mensajes del canal:', channelId);
      
      const response = await API.get(`/messages/channel/${channelId}`);
      console.log('📥 SIMPLE CHAT: Respuesta mensajes:', response.data);
      
      if (response.data?.success) {
        const messageData = response.data.data || [];
        setMessages(messageData);
        console.log('✅ SIMPLE CHAT: Mensajes cargados:', messageData.length);
        
        // Scroll al final
        setTimeout(() => scrollToBottom(), 100);
      }
      
    } catch (error) {
      console.error('❌ SIMPLE CHAT: Error cargando mensajes:', error);
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !projectId) return;

    try {
      console.log('📝 SIMPLE CHAT: Creando canal:', newChannelName);
      
      const response = await API.post('/channels', {
        name: newChannelName.trim(),
        description: `Canal ${newChannelName}`,
        projectId,
        isPrivate: false
      });
      
      console.log('📥 SIMPLE CHAT: Canal creado:', response.data);
      
      if (response.data?.success) {
        setNewChannelName('');
        setShowModal(false);
        await loadChannels(); // Recargar lista
        alert('Canal creado exitosamente');
      }
      
    } catch (error) {
      console.error('❌ SIMPLE CHAT: Error creando canal:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChannel) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Limpiar inmediatamente

    try {
      console.log('📝 SIMPLE CHAT: Enviando mensaje:', messageContent);
      
      const response = await API.post('/messages', {
        content: messageContent,
        channelId: activeChannel._id
      });
      
      console.log('📥 SIMPLE CHAT: Mensaje enviado:', response.data);
      
      if (response.data?.success) {
        // Agregar mensaje localmente para UX inmediata
        const newMsg = response.data.data;
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => scrollToBottom(), 50);
      }
      
    } catch (error) {
      console.error('❌ SIMPLE CHAT: Error enviando mensaje:', error);
      setNewMessage(messageContent); // Restaurar si hay error
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const switchToChannel = async (channel) => {
    console.log('🔄 SIMPLE CHAT: Cambiando a canal:', channel.name);
    setActiveChannel(channel);
    setMessages([]);
    await loadMessages(channel._id);
    
    // Unirse al canal en Socket.io
    if (socketRef.current) {
      socketRef.current.emit('join_channel', channel._id);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // =================================================================
  // SOCKET.IO SIMPLIFICADO
  // =================================================================

  const initializeSocket = () => {
    if (!token || socketRef.current) return;

    console.log('🔌 SIMPLE CHAT: Inicializando Socket.io...');
    
    const newSocket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('✅ SIMPLE CHAT: Socket conectado:', newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 SIMPLE CHAT: Socket desconectado:', reason);
      setSocket(null);
    });

    // Escuchar nuevos mensajes
    newSocket.on('new_message', (data) => {
      console.log('📨 SIMPLE CHAT: Nuevo mensaje recibido:', data);
      
      if (data.channelId === activeChannel?._id) {
        setMessages(prev => {
          // Evitar duplicados
          const exists = prev.some(msg => msg._id === data.message._id);
          if (exists) return prev;
          
          return [...prev, data.message];
        });
        setTimeout(() => scrollToBottom(), 50);
      }
    });

    socketRef.current = newSocket;
  };

  const cleanupSocket = () => {
    if (socketRef.current) {
      console.log('🔌 SIMPLE CHAT: Cerrando Socket.io');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
  };

  // =================================================================
  // EFECTOS
  // =================================================================

  // Efecto principal: cargar datos cuando está listo
  useEffect(() => {
    console.log('🚀 SIMPLE CHAT: Iniciando...');
    console.log('  - projectId:', projectId);
    console.log('  - user:', user?.id);
    console.log('  - token:', !!token);
    
    if (projectId && user && token) {
      loadChannels();
      initializeSocket();
    }

    // Cleanup al desmontar
    return () => {
      cleanupSocket();
    };
  }, [projectId, user?.id, token]);

  // Efecto para unirse al canal activo en Socket.io
  useEffect(() => {
    if (socketRef.current && activeChannel) {
      socketRef.current.emit('join_channel', activeChannel._id);
    }
  }, [activeChannel]);

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
    const colors = ['28a745', 'dc3545', '007bff', 'ffc107', '6f42c1'];
    const colorIndex = userName?.length % colors.length || 0;
    return `https://placehold.co/32x32/${colors[colorIndex]}/white?text=${initial}`;
  };

  // =================================================================
  // RENDERIZADO
  // =================================================================

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2">
            Chat Simple 
            {socket && <span className="badge bg-success ms-2">Conectado</span>}
            {!socket && <span className="badge bg-secondary ms-2">Desconectado</span>}
          </h1>
          <p className="text-muted">
            Proyecto: {projectId} | Usuario: {user?.name} | Canales: {channels.length}
          </p>
        </div>
        <div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            disabled={!projectId}
          >
            + Nuevo Canal
          </button>
          <button 
            className="btn btn-outline-secondary ms-2"
            onClick={loadChannels}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-1"></span>
            ) : (
              '🔄'
            )}
            Recargar
          </button>
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
      <div className="row" style={{ height: '70vh' }}>
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
                  <h5 className="mb-0"># {activeChannel.name}</h5>
                  <small className="text-muted">
                    {activeChannel.description} • {messages.length} mensajes
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
                        maxLength={1000}
                      />
                      <button 
                        className="btn btn-primary" 
                        type="submit"
                        disabled={!newMessage.trim()}
                      >
                        <i className="bi bi-send-fill"></i>
                      </button>
                    </div>
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
                    <div className="form-text">
                      Solo letras, números y guiones. El nombre será en minúsculas.
                    </div>
                  </div>
                  <div className="text-muted">
                    <small><strong>Proyecto:</strong> {projectId}</small>
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

export default SimpleChatPage;