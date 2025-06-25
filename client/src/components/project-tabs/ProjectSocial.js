import React, { useState } from 'react';
import './ProjectSocial.css';

const ProjectSocial = () => {
  // Estado para manejar las publicaciones programadas
  const [scheduledPosts, setScheduledPosts] = useState([
    {
      id: 1,
      date: '2025-06-28',
      time: '09:00',
      network: 'linkedin',
      content: 'Artículo completo en nuestro blog: "5 Claves para una Gestión de Proyectos Exitosa en la Era Digital". ¡No te lo pierdas!',
      imageUrl: 'https://placehold.co/600x314/0A66C2/white?text=Preview+LinkedIn',
      status: 'programada'
    },
    {
      id: 2,
      date: '2025-06-28',
      time: '17:30',
      network: 'facebook',
      content: 'Esta tarde tenemos un Live Q&A con el equipo de diseño para responder todas vuestras preguntas sobre el nuevo "Proyecto Alpha". ¡Os esperamos!',
      imageUrl: '',
      status: 'programada'
    },
    {
      id: 3,
      date: '2025-06-30',
      time: '14:00',
      network: 'instagram',
      content: 'Behind the scenes del desarrollo de nuestra nueva funcionalidad 🚀 #WorkInProgress #TechTeam',
      imageUrl: 'https://placehold.co/600x600/E4405F/white?text=Instagram+Post',
      status: 'borrador'
    }
  ]);

  // Estado para el modal de nueva publicación
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({
    network: 'instagram',
    content: '',
    imageUrl: '',
    date: '',
    time: ''
  });

  // Estado para mostrar detalles de publicación
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Generar días del calendario (simple grid de 7x6)
  const generateCalendarDays = () => {
    const days = [];
    const currentDate = new Date(2025, 5, 1); // Junio 2025
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Días previos del mes anterior
    const firstDayWeek = firstDay.getDay();
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const prevDate = new Date(firstDay);
      prevDate.setDate(prevDate.getDate() - i - 1);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        dayNumber: prevDate.getDate()
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      days.push({
        date: date,
        isCurrentMonth: true,
        dayNumber: day
      });
    }
    
    // Completar hasta 42 días (6 semanas)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(lastDay);
      nextDate.setDate(nextDate.getDate() + i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        dayNumber: nextDate.getDate()
      });
    }
    
    return days;
  };

  // Obtener publicaciones para una fecha específica
  const getPostsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return scheduledPosts.filter(post => post.date === dateString);
  };

  // Obtener ícono de red social
  const getSocialIcon = (network) => {
    const icons = {
      instagram: 'bi-instagram',
      facebook: 'bi-facebook', 
      linkedin: 'bi-linkedin',
      twitter: 'bi-twitter'
    };
    return icons[network] || 'bi-share';
  };

  // Obtener color de red social
  const getSocialColor = (network) => {
    const colors = {
      instagram: 'instagram',
      facebook: 'facebook',
      linkedin: 'linkedin', 
      twitter: 'twitter'
    };
    return colors[network] || 'secondary';
  };

  // Manejar guardado de nueva publicación
  const handleSavePost = () => {
    if (!newPost.content || !newPost.date || !newPost.time) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const post = {
      id: scheduledPosts.length + 1,
      ...newPost,
      status: 'programada'
    };

    setScheduledPosts([...scheduledPosts, post]);
    setNewPost({
      network: 'instagram',
      content: '',
      imageUrl: '',
      date: '',
      time: ''
    });
    setShowModal(false);
    
    // Mostrar notificación (opcional)
    console.log('Nueva publicación programada:', post);
  };

  // Ver detalles de publicación
  const viewPost = (post) => {
    setSelectedPost(post);
    setShowViewModal(true);
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="project-social-container">
      {/* Header con controles */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <button className="btn btn-outline-secondary me-2">
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="btn btn-outline-secondary me-3">
            <i className="bi bi-chevron-right"></i>
          </button>
          <button className="btn btn-outline-secondary">Hoy</button>
        </div>
        
        <h4 className="mb-0">
          <i className="bi bi-calendar3 me-2"></i>
          Junio 2025
        </h4>
        
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Programar Publicación
        </button>
      </div>

      {/* Calendario Grid */}
      <div className="calendar-social-grid shadow-sm bg-white rounded p-3">
        {/* Headers de días */}
        <div className="calendar-header-row">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="calendar-day-header text-center fw-bold text-muted py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Días del calendario */}
        <div className="calendar-grid">
          {calendarDays.map((day, index) => {
            const postsForDay = getPostsForDate(day.date);
            
            return (
              <div 
                key={index} 
                className={`calendar-day ${!day.isCurrentMonth ? 'disabled' : ''}`}
              >
                {/* Número del día */}
                <span className="day-number">{day.dayNumber}</span>
                
                {/* Botón para agregar publicación */}
                {day.isCurrentMonth && (
                  <button 
                    className="add-post-btn"
                    onClick={() => {
                      setNewPost({
                        ...newPost,
                        date: day.date.toISOString().split('T')[0]
                      });
                      setShowModal(true);
                    }}
                  >
                    <i className="bi bi-plus"></i>
                  </button>
                )}
                
                {/* Lista de publicaciones */}
                <div className="post-preview-list">
                  {postsForDay.map(post => (
                    <div 
                      key={post.id}
                      className={`post-preview-item ${post.network}`}
                      onClick={() => viewPost(post)}
                    >
                      <i className={`bi ${getSocialIcon(post.network)}`}></i>
                      <p className="post-preview-text">
                        {post.content.substring(0, 30)}...
                      </p>
                      <small className="post-time">{post.time}</small>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal para programar nueva publicación */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-plus me-2"></i>
                  Programar Nueva Publicación
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              
              <div className="modal-body">
                {/* Selector de red social */}
                <div className="mb-3">
                  <label className="form-label">Red Social</label>
                  <div className="btn-group w-100" role="group">
                    {['instagram', 'facebook', 'linkedin'].map(network => (
                      <input
                        key={network}
                        type="radio"
                        className="btn-check"
                        name="socialNetwork"
                        id={`${network}Radio`}
                        value={network}
                        checked={newPost.network === network}
                        onChange={(e) => setNewPost({...newPost, network: e.target.value})}
                      />
                    ))}
                    {['instagram', 'facebook', 'linkedin'].map(network => (
                      <label 
                        key={`${network}-label`}
                        className={`btn btn-outline-${getSocialColor(network)}`}
                        htmlFor={`${network}Radio`}
                      >
                        <i className={`bi ${getSocialIcon(network)} me-1`}></i>
                        {network.charAt(0).toUpperCase() + network.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Contenido */}
                <div className="mb-3">
                  <label className="form-label">Contenido del Post</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Escribe aquí el contenido de tu publicación..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  ></textarea>
                </div>

                {/* URL de imagen */}
                <div className="mb-3">
                  <label className="form-label">URL de Imagen (Opcional)</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={newPost.imageUrl}
                    onChange={(e) => setNewPost({...newPost, imageUrl: e.target.value})}
                  />
                </div>

                {/* Fecha y hora */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newPost.date}
                        onChange={(e) => setNewPost({...newPost, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Hora</label>
                      <input
                        type="time"
                        className="form-control"
                        value={newPost.time}
                        onChange={(e) => setNewPost({...newPost, time: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSavePost}
                >
                  <i className="bi bi-calendar-check me-1"></i>
                  Programar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de publicación */}
      {showViewModal && selectedPost && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center">
                  <i className={`bi ${getSocialIcon(selectedPost.network)} me-2`}></i>
                  {selectedPost.network.charAt(0).toUpperCase() + selectedPost.network.slice(1)}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              
              <div className="modal-body">
                <p className="mb-3">{selectedPost.content}</p>
                
                {selectedPost.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={selectedPost.imageUrl}
                      className="img-fluid rounded"
                      alt="Vista previa"
                      style={{maxHeight: '200px'}}
                    />
                  </div>
                )}
                
                <p className="text-muted small">
                  <i className="bi bi-calendar-event me-1"></i>
                  Programado para: {selectedPost.date} a las {selectedPost.time}
                </p>
                
                <div className="d-flex align-items-center">
                  <span className={`badge bg-${selectedPost.status === 'programada' ? 'success' : 'warning'} me-2`}>
                    {selectedPost.status === 'programada' ? 'Programada' : 'Borrador'}
                  </span>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-danger me-auto">
                  <i className="bi bi-trash me-1"></i>
                  Eliminar
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Cerrar
                </button>
                <button type="button" className="btn btn-primary">
                  <i className="bi bi-pencil me-1"></i>
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSocial;