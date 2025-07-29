// client/src/components/project-tabs/ProjectCommunication.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProjectCommunication.css';

const ProjectCommunication = ({ projectId, project }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  
  // Estados principales
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Estados de modales
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  
  // Estados de formularios
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    type: 'public', // public, private
    category: 'general' // general, social, docs, development
  });
  
  // 🎯 CANALES PREDETERMINADOS
  const defaultChannels = [
    {
      id: 'general',
      name: 'General',
      description: 'Conversaciones generales del proyecto',
      type: 'public',
      category: 'general',
      icon: 'bi-chat-dots',
      color: 'primary',
      members: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'social-media',
      name: 'Redes Sociales',
      description: 'Planificación y seguimiento de publicaciones en redes sociales',
      type: 'public',
      category: 'social',
      icon: 'bi-instagram',
      color: 'danger',
      members: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'documentation',
      name: 'Documentación',
      description: 'Recursos, manuales y documentación del proyecto',
      type: 'public',
      category: 'docs',
      icon: 'bi-file-earmark-text',
      color: 'success',
      members: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'development',
      name: 'Desarrollo',
      description: 'Discusiones técnicas y desarrollo',
      type: 'public',
      category: 'development',
      icon: 'bi-code-slash',
      color: 'info',
      members: [],
      createdAt: new Date().toISOString()
    }
  ];

  // 🎯 MENSAJES DE DEMOSTRACIÓN
  const demoMessages = {
    'general': [
      {
        id: 1,
        channelId: 'general',
        content: '¡Hola equipo! ¿Cómo va el progreso del proyecto?',
        author: {
          id: 'demo-1',
          name: 'Ana García',
          email: 'ana@empresa.com',
          avatar: null
        },
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        edited: false,
        reactions: [
          { emoji: '👍', users: ['demo-2'], count: 1 }
        ]
      },
      {
        id: 2,
        channelId: 'general',
        content: 'Todo excelente! Acabamos de completar la autenticación JWT 🚀',
        author: {
          id: 'demo-2',
          name: 'Carlos López',
          email: 'carlos@empresa.com',
          avatar: null
        },
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        edited: false,
        reactions: []
      }
    ],
    'social-media': [
      {
        id: 3,
        channelId: 'social-media',
        content: '📱 Programé las publicaciones para esta semana. ¿Alguien puede revisar el contenido de LinkedIn?',
        author: {
          id: 'demo-3',
          name: 'Laura Martín',
          email: 'laura@empresa.com',
          avatar: null
        },
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        edited: false,
        reactions: []
      }
    ],
    'documentation': [
      {
        id: 4,
        channelId: 'documentation',
        content: '📚 Actualicé la documentación de la API. El enlace está en Drive.',
        author: {
          id: 'demo-4',
          name: 'Miguel Rodríguez',
          email: 'miguel@empresa.com',
          avatar: null
        },
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        edited: false,
        reactions: []
      }
    ],
    'development': [
      {
        id: 5,
        channelId: 'development',
        content: '💻 ¿Alguien puede ayudarme con la integración del sistema de notificaciones?',
        author: {
          id: 'demo-5',
          name: 'Sofia Chen',
          email: 'sofia@empresa.com',
          avatar: null
        },
        timestamp: new Date(Date.now() - 900000).toISOString(),
        edited: false,
        reactions: []
      }
    ]
  };

  // 🚀 INICIALIZAR DATOS
  useEffect(() => {
    const initializeCommunication = async () => {
      try {
        setLoading(true);
        
        // Simular carga de canales (en el futuro será una API call)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Inicializar canales con miembros del proyecto
        const projectMembers = project?.team || [];
        const channelsWithMembers = defaultChannels.map(channel => ({
          ...channel,
          members: projectMembers.map(member => ({
            id: member._id || member.id,
            name: member.name || member.user?.name || 'Usuario Sin Nombre',
            email: member.email || member.user?.email || 'sin-email@ejemplo.com',
            role: member.role || 'member',
            avatar: member.avatar || member.user?.avatar || null,
            isOnline: Math.random() > 0.5 // Simular estado online
          }))
        }));
        
        setChannels(channelsWithMembers);
        setMessages(demoMessages);
        
        // Seleccionar canal general por defecto
        setActiveChannel(channelsWithMembers[0]);
        
        // Simular usuarios online
        const onlineUsersList = channelsWithMembers[0]?.members?.filter(member => member.isOnline) || [];
        setOnlineUsers(onlineUsersList);
        
      } catch (error) {
        console.error('❌ Error inicializando comunicación:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && project) {
      initializeCommunication();
    }
  }, [projectId, project]);

  // 🔄 AUTO-SCROLL AL FINAL
  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 📤 ENVIAR MENSAJE
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;

    const messageData = {
      id: Date.now(),
      channelId: activeChannel.id,
      content: newMessage.trim(),
      author: {
        id: user?.id || 'current-user',
        name: user?.name || 'Usuario Actual',
        email: user?.email || 'usuario@empresa.com',
        avatar: user?.avatar || null
      },
      timestamp: new Date().toISOString(),
      edited: false,
      reactions: []
    };

    // Actualizar mensajes localmente
    setMessages(prev => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), messageData]
    }));

    setNewMessage('');

    // TODO: Enviar al servidor via API
    console.log('📤 Enviando mensaje:', messageData);
  }, [newMessage, activeChannel, user]);

  // 🏗️ CREAR NUEVO CANAL
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    
    if (!newChannelData.name.trim()) return;

    const channelData = {
      id: `channel-${Date.now()}`,
      name: newChannelData.name.trim(),
      description: newChannelData.description.trim(),
      type: newChannelData.type,
      category: newChannelData.category,
      icon: getCategoryIcon(newChannelData.category),
      color: getCategoryColor(newChannelData.category),
      members: activeChannel?.members || [],
      createdAt: new Date().toISOString(),
      createdBy: user?.id || 'current-user'
    };

    setChannels(prev => [...prev, channelData]);
    setMessages(prev => ({ ...prev, [channelData.id]: [] }));
    
    // Seleccionar el nuevo canal
    setActiveChannel(channelData);
    
    // Resetear formulario y cerrar modal
    setNewChannelData({
      name: '',
      description: '',
      type: 'public',
      category: 'general'
    });
    setShowCreateChannel(false);

    console.log('🏗️ Canal creado:', channelData);
  };

  // 🎨 HELPERS PARA ICONOS Y COLORES
  const getCategoryIcon = (category) => {
    const icons = {
      general: 'bi-chat-dots',
      social: 'bi-instagram',
      docs: 'bi-file-earmark-text',
      development: 'bi-code-slash'
    };
    return icons[category] || 'bi-chat-dots';
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: 'primary',
      social: 'danger',
      docs: 'success',
      development: 'info'
    };
    return colors[category] || 'primary';
  };

  // 🎭 OBTENER AVATAR O INICIALES
  const getAvatarContent = (member) => {
    if (member?.avatar) {
      return <img src={member.avatar} alt={member.name} className="w-100 h-100 rounded-circle" />;
    }
    
    const name = member?.name || 'Usuario';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return <span>{initials}</span>;
  };

  // 🕐 FORMATEAR TIEMPO
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // 📱 RENDERIZAR VISTA DE CARGA
  if (loading) {
    return (
      <div className="communication-tab d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando canales de comunicación...</p>
        </div>
      </div>
    );
  }

  const currentMessages = messages[activeChannel?.id] || [];

  return (
    <div className="communication-tab">
      <div className="row g-0" style={{ height: '600px' }}>
        
        {/* 📋 SIDEBAR - CANALES */}
        <div className="col-md-3 border-end">
          <div className="h-100 d-flex flex-column">
            
            {/* Header del sidebar */}
            <div className="p-3 border-bottom bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-chat-left-dots-fill me-2 text-primary"></i>
                  Canales
                </h6>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setShowCreateChannel(true)}
                  title="Crear canal"
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
            </div>

            {/* Lista de canales */}
            <div className="flex-grow-1 overflow-auto">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  className={`w-100 text-start border-0 p-3 channel-item ${
                    activeChannel?.id === channel.id ? 'active' : ''
                  }`}
                  onClick={() => setActiveChannel(channel)}
                >
                  <div className="d-flex align-items-center">
                    <div className={`channel-icon me-2 text-${channel.color}`}>
                      <i className={channel.icon}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium">{channel.name}</div>
                      <small className="text-muted d-block text-truncate">
                        {channel.description}
                      </small>
                    </div>
                    <div className="text-end">
                      {(messages[channel.id]?.length || 0) > 0 && (
                        <span className="badge bg-light text-dark rounded-pill">
                          {messages[channel.id].length}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* 💬 ÁREA PRINCIPAL - CHAT */}
        <div className="col-md-6">
          <div className="h-100 d-flex flex-column">
            
            {/* Header del chat */}
            <div className="p-3 border-bottom bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className={`channel-icon me-2 text-${activeChannel?.color || 'primary'}`}>
                    <i className={activeChannel?.icon || 'bi-chat-dots'}></i>
                  </div>
                  <div>
                    <h6 className="mb-0">{activeChannel?.name || 'Selecciona un canal'}</h6>
                    <small className="text-muted">
                      {activeChannel?.members?.length || 0} miembros
                    </small>
                  </div>
                </div>
                
                {activeChannel && (
                  <div className="d-flex align-items-center">
                    <button 
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => setShowAddMembers(true)}
                      title="Agregar miembros"
                    >
                      <i className="bi bi-person-plus"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setShowChannelSettings(true)}
                      title="Configuración del canal"
                    >
                      <i className="bi bi-gear"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Área de mensajes */}
            <div className="flex-grow-1 overflow-auto p-3 messages-container">
              {currentMessages.length === 0 ? (
                <div className="text-center py-5">
                  <div className={`text-${activeChannel?.color || 'primary'} mb-3`}>
                    <i className={`${activeChannel?.icon || 'bi-chat-dots'}`} style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h6 className="text-muted">
                    {activeChannel ? `¡Comienza la conversación en #${activeChannel.name}!` : 'Selecciona un canal'}
                  </h6>
                  <p className="text-muted small">
                    {activeChannel ? 'Sé el primero en enviar un mensaje' : 'Elige un canal de la lista lateral'}
                  </p>
                </div>
              ) : (
                currentMessages.map(message => (
                  <div key={message.id} className="message-item mb-3">
                    <div className="d-flex">
                      <div 
                        className="avatar-container me-3"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <div className="avatar rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center w-100 h-100">
                          {getAvatarContent(message.author)}
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <span className="fw-medium me-2">{message.author?.name || 'Usuario'}</span>
                          <small className="text-muted">{formatTime(message.timestamp)}</small>
                        </div>
                        <div className="message-content">
                          <p className="mb-1">{message.content}</p>
                          
                          {/* Reacciones */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="reactions mt-2">
                              {message.reactions.map((reaction, index) => (
                                <span key={index} className="badge bg-light text-dark me-1">
                                  {reaction.emoji} {reaction.count}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulario de mensaje */}
            {activeChannel && (
              <div className="p-3 border-top">
                <form onSubmit={handleSendMessage}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Mensaje a #${activeChannel.name}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={loading}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={!newMessage.trim() || loading}
                    >
                      <i className="bi bi-send"></i>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* 👥 SIDEBAR DERECHO - MIEMBROS */}
        <div className="col-md-3 border-start">
          <div className="h-100 d-flex flex-column">
            
            {/* Header de miembros */}
            <div className="p-3 border-bottom bg-light">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-people me-2 text-success"></i>
                Miembros Online
              </h6>
            </div>

            {/* Lista de miembros */}
            <div className="flex-grow-1 overflow-auto p-3">
              {activeChannel?.members?.map(member => (
                <div key={member.id} className="d-flex align-items-center mb-3">
                  <div className="position-relative me-2">
                    <div 
                      className="avatar rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', fontSize: '12px' }}
                    >
                      {getAvatarContent(member)}
                    </div>
                    {member.isOnline && (
                      <span 
                        className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white"
                        style={{ width: '10px', height: '10px' }}
                      ></span>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-medium small">{member.name}</div>
                    <small className="text-muted">{member.role}</small>
                  </div>
                  <div>
                    {member.isOnline ? (
                      <span className="badge bg-success-subtle text-success">Online</span>
                    ) : (
                      <span className="badge bg-light text-muted">Offline</span>
                    )}
                  </div>
                </div>
              )) || (
                <div className="text-center text-muted py-3">
                  <i className="bi bi-people d-block mb-2" style={{ fontSize: '2rem' }}></i>
                  <small>No hay miembros en este canal</small>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 🏗️ MODAL CREAR CANAL */}
      {showCreateChannel && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Nuevo Canal
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowCreateChannel(false)}
                ></button>
              </div>
              
              <form onSubmit={handleCreateChannel}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre del Canal</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Ej: marketing-campaigns"
                      value={newChannelData.name}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea 
                      className="form-control"
                      rows="2"
                      placeholder="Describe el propósito de este canal..."
                      value={newChannelData.description}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, description: e.target.value }))}
                    ></textarea>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Categoría</label>
                      <select 
                        className="form-select"
                        value={newChannelData.category}
                        onChange={(e) => setNewChannelData(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="general">General</option>
                        <option value="social">Redes Sociales</option>
                        <option value="docs">Documentación</option>
                        <option value="development">Desarrollo</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Tipo</label>
                      <select 
                        className="form-select"
                        value={newChannelData.type}
                        onChange={(e) => setNewChannelData(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="public">Público</option>
                        <option value="private">Privado</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCreateChannel(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check me-1"></i>
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
};

export default ProjectCommunication;