import React, { useState } from 'react';
import './SocialMedia.css';

function SocialMediaPage() {
  const [currentMonth, setCurrentMonth] = useState('Junio 2025');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' o 'list'

  // Datos de publicaciones programadas
  const scheduledPosts = {
    4: [
      {
        id: 1,
        content: 'Descubre las nuevas tendencias de diseño para 2025...',
        platform: 'instagram',
        time: '10:00 AM',
        image: 'https://placehold.co/100x60/a173f9/white?text=Post',
        status: 'scheduled'
      }
    ],
    9: [
      {
        id: 2,
        content: 'Anuncio especial para nuestros seguidores...',
        platform: 'facebook',
        time: '2:00 PM',
        image: 'https://placehold.co/100x60/3001ff/white?text=Anuncio',
        status: 'scheduled'
      }
    ],
    18: [
      {
        id: 3,
        content: 'Evento exclusivo - No te lo pierdas',
        platform: 'instagram',
        time: '11:00 AM',
        image: 'https://placehold.co/100x60/ffc107/white?text=Evento',
        status: 'scheduled'
      },
      {
        id: 4,
        content: 'Live streaming sobre productividad',
        platform: 'facebook',
        time: '7:00 PM',
        image: 'https://placehold.co/100x60/dc3545/white?text=Live',
        status: 'scheduled'
      }
    ]
  };

  // Generar días del calendario (Junio 2025)
  const generateCalendarDays = () => {
    const days = [];
    
    // Días previos del mes anterior (Mayo 2025)
    const prevDays = [26, 27, 28, 29, 30, 31];
    prevDays.forEach(day => {
      days.push({ day, isPrevMonth: true, posts: [] });
    });

    // Días del mes actual (Junio 2025)
    for (let day = 1; day <= 30; day++) {
      days.push({
        day,
        isPrevMonth: false,
        isNextMonth: false,
        posts: scheduledPosts[day] || []
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const getPlatformIcon = (platform) => {
    const icons = {
      instagram: 'bi-instagram',
      facebook: 'bi-facebook', 
      linkedin: 'bi-linkedin',
      twitter: 'bi-twitter'
    };
    return icons[platform] || 'bi-share';
  };

  const getPlatformColor = (platform) => {
    const colors = {
      instagram: '#E4405F',
      facebook: '#1877F2',
      linkedin: '#0A66C2',
      twitter: '#1DA1F2'
    };
    return colors[platform] || '#6c757d';
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2">Calendario de Contenido</h1>
          <p className="text-muted">Planifica y programa tus publicaciones en redes sociales</p>
        </div>
        <div className="btn-toolbar">
          <div className="btn-group me-2">
            <button 
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('calendar')}
            >
              <i className="bi bi-calendar3"></i> Calendario
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <i className="bi bi-list-ul"></i> Lista
            </button>
          </div>
          <button className="btn btn-primary">
            <i className="bi bi-plus-lg me-1"></i>
            Programar Publicación
          </button>
        </div>
      </div>

      {/* Controles del Calendario */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-outline-secondary me-2">
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="btn btn-outline-secondary">
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
        <h4 className="mb-0">{currentMonth}</h4>
        <button className="btn btn-outline-secondary">
          <i className="bi bi-calendar-today"></i> Hoy
        </button>
      </div>

      {/* Vista de Calendario */}
      {viewMode === 'calendar' && (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            {/* Calendario Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1px',
              backgroundColor: '#dee2e6'
            }}>
              {/* Headers de días */}
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(day => (
                <div key={day} className="p-3 bg-light text-center fw-bold text-muted">
                  {day}
                </div>
              ))}

              {/* Días del calendario */}
              {calendarDays.map((dayData, index) => (
                <div
                  key={index}
                  className={`bg-white p-2 ${dayData.isPrevMonth ? 'text-muted' : ''}`}
                  style={{ 
                    minHeight: '120px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => !dayData.isPrevMonth && console.log(`Clicked day ${dayData.day}`)}
                >
                  {/* Número del día */}
                  <div className="fw-bold mb-2" style={{ fontSize: '0.9rem' }}>
                    {dayData.day}
                  </div>

                  {/* Publicaciones programadas */}
                  {dayData.posts.map(post => (
                    <div 
                      key={post.id}
                      className="mb-1"
                      style={{ 
                        borderRadius: '4px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <img 
                        src={post.image} 
                        alt="Post preview"
                        style={{ 
                          width: '100%',
                          height: '40px',
                          objectFit: 'cover'
                        }}
                      />
                      <div 
                        className="position-absolute"
                        style={{
                          top: '22px',
                          right: '4px',
                          backgroundColor: getPlatformColor(post.platform),
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}
                      >
                        <i className={getPlatformIcon(post.platform)}></i>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vista de Lista */}
      {viewMode === 'list' && (
        <div className="card shadow-sm">
          <div className="card-header">
            <h6 className="mb-0">Publicaciones Programadas - {currentMonth}</h6>
          </div>
          <div className="card-body">
            {Object.entries(scheduledPosts).map(([day, posts]) => (
              <div key={day} className="mb-4">
                <h6 className="text-primary mb-3">{day} de Junio, 2025</h6>
                {posts.map(post => (
                  <div key={post.id} className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                    <img 
                      src={post.image} 
                      alt="Post preview"
                      className="rounded me-3"
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{post.content}</h6>
                      <div className="d-flex align-items-center text-muted">
                        <i 
                          className={`${getPlatformIcon(post.platform)} me-2`}
                          style={{ color: getPlatformColor(post.platform) }}
                        ></i>
                        <small>{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} • {post.time}</small>
                      </div>
                    </div>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h3 className="mb-0">12</h3>
              <small>Publicaciones este mes</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h3 className="mb-0">8</h3>
              <small>Programadas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center">
              <h3 className="mb-0">3</h3>
              <small>Borradores</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h3 className="mb-0">4</h3>
              <small>Plataformas conectadas</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialMediaPage;