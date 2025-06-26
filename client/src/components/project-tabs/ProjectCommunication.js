import React, { useState } from 'react';

const ProjectCommunication = ({ projectId, project }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      user: { name: 'Ana García', avatar: null },
      message: '¡Hola equipo! ¿Cómo va el progreso del proyecto?',
      timestamp: '2024-06-26 10:30',
      type: 'message'
    },
    {
      id: 2,
      user: { name: 'Carlos López', avatar: null },
      message: 'Todo bien, acabamos de completar la autenticación JWT',
      timestamp: '2024-06-26 10:45',
      type: 'message'
    },
    {
      id: 3,
      user: { name: 'Sistema', avatar: null },
      message: 'Laura Martín movió "Diseñar interfaz" a En Progreso',
      timestamp: '2024-06-26 11:00',
      type: 'activity'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        user: { name: 'Usuario Actual', avatar: null },
        message: newMessage.trim(),
        timestamp: new Date().toLocaleString('es-ES'),
        type: 'message'
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  return (
    <div className="communication-tab">
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-chat-left-dots-fill me-2"></i>
                Chat del Proyecto
              </h5>
            </div>
            <div className="card-body">
              {/* Lista de mensajes */}
              <div className="messages-container" style={{ height: '400px', overflowY: 'auto' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`d-flex mb-3 ${msg.type === 'activity' ? 'justify-content-center' : ''}`}>
                    {msg.type === 'message' ? (
                      <>
                        <div 
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px', fontSize: '14px' }}
                        >
                          {msg.user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <strong className="me-2">{msg.user.name}</strong>
                            <small className="text-muted">{msg.timestamp}</small>
                          </div>
                          <div className="bg-light p-3 rounded">
                            {msg.message}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="alert alert-info py-2 px-3 mb-0">
                        <small>
                          <i className="bi bi-info-circle me-1"></i>
                          {msg.message} • {msg.timestamp}
                        </small>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Formulario de nuevo mensaje */}
              <form onSubmit={handleSendMessage} className="mt-3">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-send"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Miembros Online</h6>
            </div>
            <div className="card-body">
              {project?.team?.map(member => (
                <div key={member._id} className="d-flex align-items-center mb-2">
                  <div className="position-relative">
                    <div 
                      className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                      style={{ width: '32px', height: '32px', fontSize: '12px' }}
                    >
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span 
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success"
                      style={{ fontSize: '8px' }}
                    >
                      <span className="visually-hidden">online</span>
                    </span>
                  </div>
                  <div>
                    <div className="fw-medium" style={{ fontSize: '14px' }}>{member.name}</div>
                    <small className="text-muted">{member.role}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCommunication;