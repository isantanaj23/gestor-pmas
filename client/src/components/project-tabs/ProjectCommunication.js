import React, { useState, useEffect, useRef } from 'react';
import './ProjectCommunication.css';

function ProjectCommunication({ projectId }) {
  const [activeChannel, setActiveChannel] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const [onlineMembers, setOnlineMembers] = useState([
    { id: 1, name: 'Ana García', role: 'Frontend Developer', status: 'online', avatar: 'A' },
    { id: 2, name: 'Laura Martín', role: 'UI/UX Designer', status: 'online', avatar: 'L' },
    { id: 3, name: 'Carlos López', role: 'Project Manager', status: 'online', avatar: 'C' },
    { id: 4, name: 'David Chen', role: 'Backend Developer', status: 'away', avatar: 'D' }
  ]);

  const messagesEndRef = useRef(null);

  // Canales específicos del proyecto
  const projectChannels = [
    {
      id: 'general',
      name: '# General del Proyecto',
      description: 'Conversaciones generales sobre el proyecto',
      members: 4,
      lastActivity: 'Hace 2 min'
    },
    {
      id: 'desarrollo',
      name: '# Desarrollo',
      description: 'Temas técnicos y de desarrollo',
      members: 3,
      lastActivity: 'Hace 1 hora'
    },
    {
      id: 'diseno',
      name: '# Diseño',
      description: 'UI/UX y aspectos visuales',
      members: 2,
      lastActivity: 'Hace 3 horas'
    }
  ];

  // Mensajes del proyecto (simulados pero contextualizados)
  const [projectMessages, setProjectMessages] = useState({
    general: [
      {
        id: 1,
        sender: 'Carlos López',
        avatar: 'C',
        message: '¡Buenos días equipo! Hoy tenemos review del sprint. ¿Todos listos?',
        time: '09:00 AM',
        isOwn: false,
        timestamp: new Date('2025-06-25T09:00:00')
      },
      {
        id: 2,
        sender: 'Ana García',
        avatar: 'A',
        message: 'Sí, terminé la integración de la API de autenticación. Todo funcionando 👍',
        time: '09:15 AM',
        isOwn: false,
        timestamp: new Date('2025-06-25T09:15:00')
      },
      {
        id: 3,
        sender: 'Tú',
        avatar: 'U',
        message: 'Excelente! He actualizado el mockup con los comentarios del cliente.',
        time: '09:20 AM',
        isOwn: true,
        timestamp: new Date('2025-06-25T09:20:00')
      },
      {
        id: 4,
        sender: 'Laura Martín',
        avatar: 'L',
        message: 'Perfecto! ¿Podrían revisar el nuevo diseño del dashboard? Necesito feedback.',
        time: '09:25 AM',
        isOwn: false,
        timestamp: new Date('2025-06-25T09:25:00'),
        attachments: [
          {
            type: 'image',
            name: 'dashboard_v3.png',
            url: 'https://placehold.co/300x200/964ef9/white?text=Dashboard+V3',
            size: '2.3 MB'
          }
        ]
      },
      {
        id: 5,
        sender: 'David Chen',
        avatar: 'D',
        message: 'El servidor de staging está listo. Ya pueden probar las nuevas funcionalidades.',
        time: '10:00 AM',
        isOwn: false,
        timestamp: new Date('2025-06-25T10:00:00')
      }
    ],
    desarrollo: [
      {
        id: 1,
        sender: 'Ana García',
        avatar: 'A',
        message: '¿Alguien ha probado la nueva versión de la API? Creo que hay un bug en el endpoint de usuarios.',
        time: '08:30 AM',
        isOwn: false,
        timestamp: new Date('2025-06-25T08:30:00')
      },
      {
        id: 2,
        sender: 'David Chen',
        avatar: 'D',
        message: 'Sí, lo vi también. Creo que es un problema con la validación. Lo arreglo en 30 min.',
        time: '08:45 AM',
        isOwn: false,
        timestamp: new Date('2025-06-25T08:45:00')
      }
    ],
    diseno: [
      {
        id: 1,
        sender: 'Laura Martín',
        avatar: 'L',
        message: 'He terminado el sistema de design tokens. ¿Podemos implementarlo esta semana?',
        time: '07:00 AM',
        isOwn: false,
        timestamp: new Date('2025-06-25T07:00:00')
      }
    ]
  });

  const [typing, setTyping] = useState([]);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [projectMessages, activeChannel]);

  // Simular usuarios escribiendo
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% de probabilidad cada 3 segundos
        const randomMember = onlineMembers[Math.floor(Math.random() * onlineMembers.length)];
        setTyping([randomMember.name]);
        setTimeout(() => setTyping([]), 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [onlineMembers]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const newMsg = {
        id: Date.now(),
        sender: 'Tú',
        avatar: 'U',
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        timestamp: new Date()
      };

      setProjectMessages(prev => ({
        ...prev,
        [activeChannel]: [...prev[activeChannel], newMsg]
      }));

      setNewMessage('');

      // Simular respuesta automática ocasionalmente
      if (Math.random() < 0.3) {
        setTimeout(() => {
          const responses = [
            '¡Perfecto! Gracias por la actualización.',
            'Entendido, lo reviso ahora.',
            '👍 Excelente trabajo.',
            'Ok, anotado para la próxima reunión.',
            'Me parece bien, sigamos con eso.'
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          const randomMember = onlineMembers[Math.floor(Math.random() * onlineMembers.length)];
          
          const autoMsg = {
            id: Date.now() + 1,
            sender: randomMember.name,
            avatar: randomMember.avatar,
            message: randomResponse,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: false,
            timestamp: new Date()
          };

          setProjectMessages(prev => ({
            ...prev,
            [activeChannel]: [...prev[activeChannel], autoMsg]
          }));
        }, 1000 + Math.random() * 2000);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#28a745';
      case 'away': return '#ffc107';
      case 'busy': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const currentChannel = projectChannels.find(ch => ch.id === activeChannel);
  const currentMessages = projectMessages[activeChannel] || [];

  return (
    <div>
      {/* Header de Comunicación del Proyecto */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Comunicación del Proyecto</h4>
          <p className="text-muted mb-0">
            Conversaciones específicas del proyecto Alpha
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-people-fill text-success me-2"></i>
            <span className="text-success fw-bold">
              {onlineMembers.filter(m => m.status === 'online').length} online
            </span>
          </div>
          <button className="btn btn-outline-primary btn-sm">
            <i className="bi bi-person-plus"></i> Invitar miembro
          </button>
        </div>
      </div>

      <div className="row g-0" style={{ height: '600px', border: '1px solid #dee2e6', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Sidebar de Canales */}
        <div className="col-md-4 border-end">
          <div className="h-100 d-flex flex-column">
            {/* Header de canales */}
            <div className="p-3 border-bottom bg-light">
              <h6 className="mb-2 fw-bold text-primary">Canales del Proyecto</h6>
              <small className="text-muted">
                <i className="bi bi-hash"></i> {projectChannels.length} canales disponibles
              </small>
            </div>

            {/* Lista de canales */}
            <div className="flex-grow-1 overflow-auto">
              {projectChannels.map((channel) => (
                <div
                  key={channel.id}
                  className={`p-3 border-bottom cursor-pointer ${
                    activeChannel === channel.id ? 'bg-primary text-white' : 'hover-bg-light'
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveChannel(channel.id)}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="mb-0">{channel.name}</h6>
                    <small className={activeChannel === channel.id ? 'text-white-50' : 'text-muted'}>
                      {channel.lastActivity}
                    </small>
                  </div>
                  <p className={`small mb-1 ${activeChannel === channel.id ? 'text-white-50' : 'text-muted'}`}>
                    {channel.description}
                  </p>
                  <small className={activeChannel === channel.id ? 'text-white' : 'text-muted'}>
                    <i className="bi bi-people me-1"></i>
                    {channel.members} miembros
                  </small>
                </div>
              ))}
            </div>

            {/* Miembros del proyecto online */}
            <div className="border-top p-3">
              <h6 className="small text-muted text-uppercase mb-2">Miembros Online</h6>
              {onlineMembers.filter(m => m.status === 'online').map((member) => (
                <div key={member.id} className="d-flex align-items-center mb-2">
                  <div className="position-relative me-2">
                    <img
                      src={`https://placehold.co/24x24/28a745/white?text=${member.avatar}`}
                      className="rounded-circle"
                      alt={member.name}
                    />
                    <span
                      className="position-absolute bottom-0 end-0 rounded-circle border border-white"
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: getStatusColor(member.status)
                      }}
                    ></span>
                  </div>
                  <div>
                    <div className="small fw-bold">{member.name}</div>
                    <div className="small text-muted">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Área de Chat */}
        <div className="col-md-8">
          <div className="h-100 d-flex flex-column">
            {/* Header del canal activo */}
            <div className="p-3 border-bottom bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">{currentChannel?.name}</h5>
                  <small className="text-muted">{currentChannel?.description}</small>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-telephone"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-camera-video"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-info-circle"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
              {currentMessages.map((message) => (
                <div key={message.id} className={`d-flex mb-3 ${message.isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div className={`max-w-75 ${message.isOwn ? 'text-end' : ''}`} style={{ maxWidth: '75%' }}>
                    {!message.isOwn && (
                      <div className="d-flex align-items-center mb-1">
                        <img
                          src={`https://placehold.co/32x32/${message.avatar === 'A' ? 'ffc107' : message.avatar === 'L' ? '28a745' : message.avatar === 'C' ? 'dc3545' : '17a2b8'}/white?text=${message.avatar}`}
                          className="rounded-circle me-2"
                          alt={message.sender}
                        />
                        <strong className="small">{message.sender}</strong>
                        <small className="text-muted ms-2">{message.time}</small>
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-3 ${
                        message.isOwn
                          ? 'bg-primary text-white'
                          : 'bg-white border'
                      }`}
                      style={{
                        borderRadius: message.isOwn ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
                        marginLeft: message.isOwn ? 'auto' : '0'
                      }}
                    >
                      {message.message}
                    </div>
                    
                    {/* Archivos adjuntos */}
                    {message.attachments && (
                      <div className="mt-2">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="bg-white border rounded p-2 d-flex align-items-center">
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="rounded me-2"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                            <div className="flex-grow-1">
                              <div className="small fw-bold">{attachment.name}</div>
                              <small className="text-muted">{attachment.size}</small>
                            </div>
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-download"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {message.isOwn && (
                      <small className="text-muted d-block mt-1">{message.time}</small>
                    )}
                  </div>
                </div>
              ))}

              {/* Indicador de escritura */}
              {typing.length > 0 && (
                <div className="d-flex align-items-center mb-3">
                  <img
                    src="https://placehold.co/32x32/6c757d/white?text=..."
                    className="rounded-circle me-2"
                    alt="typing"
                  />
                  <div className="bg-light p-2 rounded">
                    <small className="text-muted">
                      <i className="bi bi-three-dots"></i> {typing.join(', ')} está escribiendo...
                    </small>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="p-3 border-top bg-white">
              <form onSubmit={handleSendMessage}>
                <div className="input-group">
                  <button className="btn btn-outline-secondary" type="button">
                    <i className="bi bi-paperclip"></i>
                  </button>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Mensaje en ${currentChannel?.name}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="button">
                    <i className="bi bi-emoji-smile"></i>
                  </button>
                  <button className="btn btn-primary" type="submit">
                    <i className="bi bi-send-fill"></i>
                  </button>
                </div>
              </form>
              <small className="text-muted d-block mt-1">
                <i className="bi bi-lightbulb me-1"></i>
                Tip: Menciona tareas con #tarea o personas con @nombre
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCommunication;