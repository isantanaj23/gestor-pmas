import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import API from '../../services/api';

function CommunicationPage() {
  // Obtener projectId de parámetros de ruta o props
  const { projectId } = useParams();
  const { user, token } = useAuth();
  const { socket, connected: socketConnected, joinProjectRoom, leaveProjectRoom, emit, on, off } = useSocket();
  
  // Estados básicos
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para notificaciones
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [totalUnread, setTotalUnread] = useState(0);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  
  // Estados para crear canal
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  
  // Referencias
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const activeChannelRef = useRef(null);
  const notificationAudioRef = useRef(null);

  // =================================================================
  // 🔥 FUNCIÓN DE SCROLL OPTIMIZADA
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
  // 🔥 FUNCIONES DE SOCKET.IO INTEGRADAS
  // =================================================================

  useEffect(() => {
    if (!projectId || !socketConnected || !socket) return;

    console.log('🏠 COMMUNICATION: Uniéndose al proyecto:', projectId);
    joinProjectRoom(projectId);

    // Eventos de mensajes en tiempo real
    const handleNewMessageGlobal = (data) => {
      console.log('📨 COMMUNICATION: Nuevo mensaje global:', data);
      
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
          // Mostrar notificación para otros canales
          updateUnreadCount(channelId, true, 1);
          showNotification(message, channelName || 'Canal');
        }
      }
    };

    const handleChannelCreated = (data) => {
      if (data.projectId === projectId) {
        console.log('📢 COMMUNICATION: Nuevo canal creado:', data);
        setChannels(prev => {
          const exists = prev.some(ch => ch._id === data.channel._id);
          if (!exists) {
            return [data.channel, ...prev];
          }
          return prev;
        });
      }
    };

    // Registrar eventos usando SocketContext
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
        
        // Seleccionar primer canal si no hay uno activo
        if (channelData.length > 0 && !activeChannel) {
          await switchToChannel(channelData[0]);
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
    console.log('🔄 COMMUNICATION: Cambiando a canal:', channel.name);
    
    // Limpiar contador del canal anterior
    if (activeChannel) {
      clearChannelUnread(activeChannel._id);
    }
    
    setActiveChannel(channel);
    activeChannelRef.current = channel;
    await loadMessages(channel._id);
    
    // Limpiar contador del nuevo canal
    clearChannelUnread(channel._id);
    
    // Notificar al socket sobre el cambio de canal
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
        isPrivate: newChannelData.isPrivate
      });
      
      if (response.data?.success) {
        setShowCreateChannelModal(false);
        setNewChannelData({ name: '', description: '', isPrivate: false });
        setTimeout(() => loadChannels(), 500);
        alert('Canal creado exitosamente');
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

  const showNotification = (message, channelName) => {
    // Reproducir sonido
    if (notificationAudioRef.current) {
      notificationAudioRef.current.play().catch(() => {});
    }

    // Mostrar notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Nuevo mensaje en #${channelName}`, {
        body: `${message.sender?.name}: ${message.content}`,
        icon: '/favicon.ico'
      });
    }

    // Mostrar toast interno
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

  const generateAvatarUrl = (name, color = '28a745') => {
    const initial = name?.charAt(0)?.toUpperCase() || 'U';
    return `https://placehold.co/32x32/${color}/white?text=${initial}`;
  };

  // Filtrar conversaciones por búsqueda
  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =================================================================
  // EFECTOS DE INICIALIZACIÓN
  // =================================================================

  useEffect(() => {
    if (projectId && user && token) {
      // Pedir permisos de notificación
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      loadChannels();
    }
  }, [projectId, user?.id, token]);

  // =================================================================
  // RENDERIZADO
  // =================================================================

  if (loading && channels.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Audio para notificaciones */}
      <audio ref={notificationAudioRef} preload="auto" style={{ display: 'none' }}>
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

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2">Comunicación</h1>
          <p className="text-muted">
            Mantente conectado con tu equipo
            {socketConnected ? (
              <span className="text-success ms-2">(Conectado)</span>
            ) : (
              <span className="text-danger ms-2">(Desconectado)</span>
            )}
            {totalUnread > 0 && (
              <span className="badge bg-danger ms-2">{totalUnread} mensajes nuevos</span>
            )}
          </p>
        </div>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateChannelModal(true)}
            disabled={!projectId}
          >
            <i className="bi bi-plus-lg"></i> Nuevo Canal
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Chat Container */}
      <div className="row g-0" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Sidebar: Lista de Canales */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">
              <div className="input-group">
                <span className="input-group-text bg-light border-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-0"
                  placeholder="Buscar canal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="card-body p-0" style={{ overflowY: 'auto' }}>
              {filteredChannels.length === 0 ? (
                <div className="text-center p-4 text-muted">
                  {channels.length === 0 ? (
                    <>
                      <i className="bi bi-chat-dots fs-1 d-block mb-2"></i>
                      <p>No hay canales disponibles</p>
                      {projectId && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowCreateChannelModal(true)}
                        >
                          Crear primer canal
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search fs-4 d-block mb-2"></i>
                      <p>No se encontraron resultados</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredChannels.map((channel) => {
                    const unreadCount = unreadCounts.get(channel._id) || 0;
                    const isActive = activeChannel?._id === channel._id;
                    
                    return (
                      <button
                        key={channel._id}
                        className={`list-group-item list-group-item-action ${
                          isActive ? 'active' : ''
                        } ${unreadCount > 0 && !isActive ? 'border-start border-danger border-4' : ''}`}
                        onClick={() => switchToChannel(channel)}
                      >
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">
                            # {channel.name}
                            {channel.isPrivate && (
                              <i className="bi bi-lock-fill ms-1 small"></i>
                            )}
                          </h6>
                          {unreadCount > 0 && !isActive && (
                            <span className="badge bg-danger rounded-pill">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`mb-1 small ${
                          isActive ? 'text-white-50' : 'text-muted'
                        }`}>
                          {channel.description || 'Sin descripción'}
                        </p>
                      </button>
                    );
                  })}
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
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">
                      # {activeChannel.name}
                      {activeChannel.isPrivate && (
                        <i className="bi bi-lock-fill ms-2 text-muted"></i>
                      )}
                    </h5>
                    <small className="text-muted">
                      {activeChannel.description || 'Canal de comunicación'}
                      {socketConnected && <span className="ms-2">• En línea</span>}
                    </small>
                  </div>
                  <div>
                    <small className="text-muted">
                      {messages.length} mensajes
                    </small>
                  </div>
                </div>

                {/* Messages Area */}
                <div 
                  ref={messagesContainerRef}
                  className="card-body flex-grow-1 p-3" 
                  style={{ 
                    overflowY: 'auto',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-chat-text fs-1 d-block mb-3"></i>
                      <h5>¡Inicia la conversación!</h5>
                      <p>Sé el primero en enviar un mensaje en #{activeChannel.name}</p>
                    </div>
                  ) : (
                    <div>
                      {messages.map((message) => (
                        <div 
                          key={message._id} 
                          className={`d-flex mb-3 ${message.sender?._id === user?.id ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                          <div className={`max-w-75 ${message.sender?._id === user?.id ? 'text-end' : ''}`}>
                            {message.sender?._id !== user?.id && (
                              <div className="d-flex align-items-center mb-1">
                                <img 
                                  src={generateAvatarUrl(message.sender?.name)}
                                  className="rounded-circle me-2"
                                  alt={message.sender?.name}
                                  style={{ width: '32px', height: '32px' }}
                                />
                                <strong className="small">{message.sender?.name || 'Usuario'}</strong>
                                <small className="text-muted ms-2">{formatMessageTime(message.createdAt)}</small>
                              </div>
                            )}
                            <div className={`p-3 rounded-3 ${
                              message.sender?._id === user?.id
                                ? 'bg-primary text-white ms-auto'
                                : 'bg-white border'
                            }`} style={{ maxWidth: '70%' }}>
                              <div>{message.content}</div>
                              {message.sender?._id === user?.id && (
                                <small className="text-white-50 d-block mt-1">
                                  {formatMessageTime(message.createdAt)}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Auto-scroll anchor */}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="card-footer">
                  <form onSubmit={sendMessage}>
                    <div className="input-group">
                      <input
                        ref={messageInputRef}
                        type="text"
                        className="form-control"
                        placeholder={`Escribe un mensaje en #${activeChannel.name}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={!socketConnected}
                        maxLength={2000}
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
                        Desconectado - Los mensajes no se enviarán
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

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Crear Nuevo Canal</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateChannelModal(false)}
                ></button>
              </div>
              <form onSubmit={createChannel}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre del Canal</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newChannelData.name}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="general, desarrollo, diseño..."
                      required
                    />
                    <div className="form-text">Solo letras, números y guiones</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción (opcional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newChannelData.description}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe el propósito de este canal..."
                    />
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isPrivate"
                      checked={newChannelData.isPrivate}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="isPrivate">
                      Canal privado
                    </label>
                    <div className="form-text">Solo los miembros invitados pueden ver este canal</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateChannelModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Crear Canal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CSS para max-width */}
      <style jsx>{`
        .max-w-75 {
          max-width: 75%;
        }
      `}</style>
    </div>
  );
}

export default CommunicationPage;