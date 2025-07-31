import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import API from '../../services/api';

const ProjectCommunication = ({ projectId, project }) => {
  const { user, token } = useAuth();
  const { socket, connected: socketConnected, joinProjectRoom, leaveProjectRoom, emit, on, off } = useSocket();
  
  // Estados básicos
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para notificaciones
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [totalUnread, setTotalUnread] = useState(0);
  
  // Estados para crear canal
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: ''
  });
  
  // Referencias
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const activeChannelRef = useRef(null);

  // =================================================================
  // FUNCIÓN DE SCROLL
  // =================================================================

  const scrollToBottom = (force = false) => {
    setTimeout(() => {
      if (messagesEndRef.current && messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
        
        if (force || isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
  };

  // =================================================================
  // SOCKET.IO INTEGRATION
  // =================================================================

  useEffect(() => {
    if (!projectId || !socketConnected || !socket) return;

    console.log('🏠 PROJECT COMMUNICATION: Uniéndose al proyecto:', projectId);
    joinProjectRoom(projectId);

    // Manejar mensajes en tiempo real
    const handleNewMessageGlobal = (data) => {
      console.log('📨 PROJECT COMMUNICATION: Nuevo mensaje:', data);
      
      const { channelId, channelName, message } = data;
      const currentActiveChannel = activeChannelRef.current;
      
      if (data.projectId === projectId) {
        const isFromActiveChannel = String(channelId) === String(currentActiveChannel?._id);
        const isFromSelf = String(message.sender?._id) === String(user?.id);
        
        if (isFromActiveChannel && currentActiveChannel) {
          // Agregar mensaje al canal activo
          setMessages(prevMessages => {
            const messageExists = prevMessages.some(msg => msg._id === message._id);
            if (!messageExists) {
              const newMessages = [...prevMessages, {
                ...message,
                _id: message._id || `temp_${Date.now()}`,
                createdAt: message.createdAt || new Date(),
                sender: message.sender || { name: 'Usuario', _id: 'unknown' }
              }];
              scrollToBottom(false);
              return newMessages;
            }
            return prevMessages;
          });
        } else if (!isFromSelf) {
          // Incrementar contador para otros canales
          updateUnreadCount(channelId, true, 1);
        }
      }
    };

    const handleChannelCreated = (data) => {
      if (data.projectId === projectId) {
        console.log('📢 PROJECT COMMUNICATION: Nuevo canal:', data);
        setChannels(prev => {
          const exists = prev.some(ch => ch._id === data.channel._id);
          if (!exists) {
            return [data.channel, ...prev];
          }
          return prev;
        });
      }
    };

    // Registrar eventos
    on('new_message_global', handleNewMessageGlobal);
    on('channel_created', handleChannelCreated);

    return () => {
      off('new_message_global', handleNewMessageGlobal);
      off('channel_created', handleChannelCreated);
      leaveProjectRoom(projectId);
    };
  }, [projectId, socketConnected, socket, user?.id, joinProjectRoom, leaveProjectRoom, on, off]);

  // Sincronizar activeChannel con referencia
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

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
        
        // Seleccionar canal general o el primero disponible
        if (channelData.length > 0 && !activeChannel) {
          const generalChannel = channelData.find(ch => ch.name.toLowerCase() === 'general') || channelData[0];
          await switchToChannel(generalChannel);
        }
      }
      
    } catch (error) {
      console.error('❌ Error cargando canales:', error);
      setError(`Error cargando canales: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId) => {
    if (!channelId) return;

    try {
      const response = await API.get(`/messages/channel/${channelId}`);
      
      if (response.data?.success) {
        const messageData = response.data.data || [];
        setMessages(messageData);
        scrollToBottom(true);
      }
      
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
    }
  };

  const switchToChannel = async (channel) => {
    console.log('🔄 PROJECT COMMUNICATION: Cambiando a canal:', channel.name);
    
    // Limpiar contador del canal anterior
    if (activeChannel) {
      clearChannelUnread(activeChannel._id);
    }
    
    setActiveChannel(channel);
    activeChannelRef.current = channel;
    await loadMessages(channel._id);
    
    // Limpiar contador del nuevo canal
    clearChannelUnread(channel._id);
    
    // Notificar al socket
    if (socket && socketConnected) {
      emit('join_channel', channel._id);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChannel) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const response = await API.post('/messages', {
        content: messageContent,
        channelId: activeChannel._id
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error enviando mensaje');
      }
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      setNewMessage(messageContent);
      alert(`Error: ${error.message}`);
    }
  };

  const createChannel = async (e) => {
    e.preventDefault();
    
    if (!newChannelData.name.trim()) {
      alert('El nombre del canal es requerido');
      return;
    }

    try {
      const response = await API.post('/channels', {
        name: newChannelData.name.trim(),
        description: newChannelData.description.trim() || `Canal ${newChannelData.name}`,
        projectId,
        isPrivate: false
      });
      
      if (response.data?.success) {
        setShowCreateChannelModal(false);
        setNewChannelData({ name: '', description: '' });
        setTimeout(() => loadChannels(), 500);
      }
      
    } catch (error) {
      console.error('❌ Error creando canal:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // =================================================================
  // FUNCIONES DE NOTIFICACIONES
  // =================================================================

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

  // Calcular total no leídos
  useEffect(() => {
    const total = Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0);
    setTotalUnread(total);
  }, [unreadCounts]);

  // =================================================================
  // FUNCIONES DE UTILIDAD
  // =================================================================

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateAvatarUrl = (name) => {
    const initial = name?.charAt(0)?.toUpperCase() || 'U';
    const colors = ['28a745', 'dc3545', '007bff', 'ffc107', '6f42c1', '17a2b8'];
    const colorIndex = name?.length % colors.length || 0;
    return `https://placehold.co/32x32/${colors[colorIndex]}/white?text=${initial}`;
  };

  // =================================================================
  // EFECTOS DE INICIALIZACIÓN
  // =================================================================

  useEffect(() => {
    if (projectId && user && token) {
      loadChannels();
    }
  }, [projectId, user?.id, token]);

  // =================================================================
  // RENDERIZADO
  // =================================================================

  if (loading && channels.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="communication-tab">
      {/* Header con estado de conexión */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">
            <i className="bi bi-chat-left-dots-fill me-2"></i>
            Chat del Proyecto
            {socketConnected ? (
              <span className="badge bg-success ms-2">En línea</span>
            ) : (
              <span className="badge bg-warning ms-2">Desconectado</span>
            )}
            {totalUnread > 0 && (
              <span className="badge bg-danger ms-2">{totalUnread} nuevos</span>
            )}
          </h5>
          <small className="text-muted">
            {project?.name} • {channels.length} canales
          </small>
        </div>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setShowCreateChannelModal(true)}
          disabled={!projectId}
        >
          <i className="bi bi-plus"></i> Canal
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="row">
        {/* Sidebar de Canales */}
        <div className="col-md-3">
          <div className="card" style={{ height: '450px' }}>
            <div className="card-header bg-light">
              <strong>Canales</strong>
              <span className="badge bg-primary ms-2">{channels.length}</span>
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto' }}>
              {channels.length === 0 ? (
                <div className="text-center p-3 text-muted">
                  <i className="bi bi-chat-dots fs-4 d-block mb-2"></i>
                  <p className="small">No hay canales</p>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowCreateChannelModal(true)}
                  >
                    Crear canal
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
                        className={`list-group-item list-group-item-action py-2 ${
                          isActive ? 'active' : ''
                        }`}
                        onClick={() => switchToChannel(channel)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small">
                            <strong># {channel.name}</strong>
                          </span>
                          {unreadCount > 0 && !isActive && (
                            <span className="badge bg-danger rounded-pill">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Área Principal de Chat */}
        <div className="col-md-9">
          <div className="card" style={{ height: '450px' }}>
            {activeChannel ? (
              <>
                {/* Header del Chat */}
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <strong># {activeChannel.name}</strong>
                    <small className="text-muted ms-2">
                      {messages.length} mensajes
                    </small>
                  </div>
                  <small className="text-muted">
                    {socketConnected ? '🟢 En vivo' : '🔴 Desconectado'}
                  </small>
                </div>

                {/* Mensajes */}
                <div 
                  ref={messagesContainerRef}
                  className="card-body" 
                  style={{ 
                    height: '320px',
                    overflowY: 'auto',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-chat-text fs-1 d-block mb-2"></i>
                      <p>¡Inicia la conversación!</p>
                    </div>
                  ) : (
                    <div>
                      {messages.map((message) => (
                        <div key={message._id} className="mb-2">
                          <div className="d-flex align-items-start">
                            <img 
                              src={generateAvatarUrl(message.sender?.name)}
                              className="rounded-circle me-2 flex-shrink-0"
                              style={{ width: '24px', height: '24px' }}
                              alt={message.sender?.name}
                            />
                            <div className="flex-grow-1 min-width-0">
                              <div className="d-flex align-items-baseline">
                                <strong className="small me-2">
                                  {message.sender?.name || 'Usuario'}
                                </strong>
                                <small className="text-muted">
                                  {formatMessageTime(message.createdAt)}
                                </small>
                                {message.sender?._id === user?.id && (
                                  <small className="badge bg-light text-dark ms-1">Tú</small>
                                )}
                              </div>
                              <div className="small mt-1">{message.content}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input de Mensaje */}
                <div className="card-footer">
                  <form onSubmit={sendMessage}>
                    <div className="input-group input-group-sm">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Mensaje en #${activeChannel.name}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={!socketConnected}
                        maxLength={1000}
                      />
                      <button 
                        className="btn btn-outline-primary" 
                        type="submit"
                        disabled={!newMessage.trim() || !socketConnected}
                      >
                        <i className="bi bi-send"></i>
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100">
                <div className="text-center text-muted">
                  <i className="bi bi-chat-square-dots fs-1 d-block mb-2"></i>
                  <h6>Selecciona un canal</h6>
                  <p className="small">Elige un canal para comenzar a chatear</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Crear Canal */}
      {showCreateChannelModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Crear Canal</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateChannelModal(false)}
                ></button>
              </div>
              <form onSubmit={createChannel}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newChannelData.name}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ej: general, desarrollo"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newChannelData.description}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowCreateChannelModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCommunication;