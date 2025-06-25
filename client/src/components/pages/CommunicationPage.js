import React, { useState } from 'react';

function CommunicationPage() {
  const [activeChat, setActiveChat] = useState('general');
  const [newMessage, setNewMessage] = useState('');

  // Datos simulados de conversaciones
  const conversations = [
    {
      id: 'general',
      name: '# General',
      type: 'channel',
      lastMessage: 'Laura: ¡Claro! Lo reviso ahora mismo.',
      time: 'Ahora',
      unread: 0
    },
    {
      id: 'design',
      name: '# Diseño UX/UI',
      type: 'channel',
      lastMessage: 'Tú: Envié la nueva propuesta de colores.',
      time: 'Ayer',
      unread: 0
    },
    {
      id: 'carlos',
      name: 'Carlos Mendoza',
      type: 'dm',
      lastMessage: 'Carlos: Perfecto, gracias por el aviso.',
      time: '2 días',
      unread: 0
    }
  ];

  // Datos simulados de mensajes
  const messages = {
    general: [
      {
        id: 1,
        sender: 'Ana',
        message: '¿Alguien tiene el link al documento de requisitos?',
        time: '10:30 AM',
        isOwn: false
      },
      {
        id: 2,
        sender: 'Tú',
        message: 'Sí, aquí tienes. Avísame si necesitas algo más.',
        time: '10:32 AM',
        isOwn: true
      },
      {
        id: 3,
        sender: 'Laura',
        message: '¡Gracias! Justo lo que necesitaba. ¿Revisaste el último commit del front?',
        time: '10:35 AM',
        isOwn: false
      },
      {
        id: 4,
        sender: 'Tú',
        message: 'Aún no, lo tengo en mi lista para hoy.',
        time: '10:36 AM',
        isOwn: true
      },
      {
        id: 5,
        sender: 'Laura',
        message: '¡Claro! Lo reviso ahora mismo.',
        time: '10:37 AM',
        isOwn: false
      }
    ]
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Aquí agregar lógica para enviar mensaje
      console.log('Enviando mensaje:', newMessage);
      setNewMessage('');
    }
  };

  const currentMessages = messages[activeChat] || [];
  const currentChat = conversations.find(conv => conv.id === activeChat);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2">Comunicación</h1>
          <p className="text-muted">Mantente conectado con tu equipo</p>
        </div>
      </div>

      <div className="row g-0" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Columna Izquierda: Lista de Conversaciones */}
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
                  placeholder="Buscar canal o persona..."
                />
              </div>
            </div>
            <div className="card-body p-0" style={{ overflowY: 'auto' }}>
              <div className="list-group list-group-flush">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={`list-group-item list-group-item-action ${
                      activeChat === conv.id ? 'active' : ''
                    }`}
                    onClick={() => setActiveChat(conv.id)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">{conv.name}</h6>
                      <small className={activeChat === conv.id ? 'text-white' : 'text-muted'}>
                        {conv.time}
                      </small>
                    </div>
                    <p className={`mb-1 small ${activeChat === conv.id ? 'text-white-50' : 'text-muted'}`}>
                      {conv.lastMessage}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Ventana de Chat */}
        <div className="col-md-8">
          <div className="card h-100 d-flex flex-column">
            {/* Header del Chat */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{currentChat?.name}</h5>
                <small className="text-muted">
                  {currentChat?.type === 'channel' ? '3 miembros activos' : 'Activo hace 2 horas'}
                </small>
              </div>
              <div>
                <button className="btn btn-sm btn-outline-secondary me-2">
                  <i className="bi bi-telephone"></i>
                </button>
                <button className="btn btn-sm btn-outline-secondary">
                  <i className="bi bi-camera-video"></i>
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="card-body flex-grow-1 p-3" style={{ 
              overflowY: 'auto',
              backgroundColor: '#f8f9fa'
            }}>
              {currentMessages.map((msg) => (
                <div key={msg.id} className={`d-flex mb-3 ${msg.isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div className={`max-w-75 ${msg.isOwn ? 'text-end' : ''}`}>
                    {!msg.isOwn && (
                      <div className="d-flex align-items-center mb-1">
                        <img 
                          src={`https://placehold.co/32x32/${msg.sender === 'Ana' ? 'ffc107' : '28a745'}/white?text=${msg.sender.charAt(0)}`}
                          className="rounded-circle me-2"
                          alt={msg.sender}
                          style={{ width: '32px', height: '32px' }}
                        />
                        <strong className="small">{msg.sender}</strong>
                        <small className="text-muted ms-2">{msg.time}</small>
                      </div>
                    )}
                    <div className={`p-3 rounded-3 ${
                      msg.isOwn 
                        ? 'bg-primary text-white' 
                        : 'bg-white border'
                    }`} style={{ 
                      borderRadius: msg.isOwn ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
                      maxWidth: '75%',
                      marginLeft: msg.isOwn ? 'auto' : '0'
                    }}>
                      {msg.message}
                    </div>
                    {msg.isOwn && (
                      <small className="text-muted d-block mt-1">{msg.time}</small>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input para escribir mensaje */}
            <div className="card-footer">
              <form onSubmit={handleSendMessage}>
                <div className="input-group">
                  <button className="btn btn-outline-secondary" type="button">
                    <i className="bi bi-paperclip"></i>
                  </button>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Escribe un mensaje..."
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunicationPage;