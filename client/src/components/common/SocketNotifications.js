// client/src/components/common/SocketNotifications.js
import React from 'react';
import { useSocket } from '../../context/SocketContext';

const SocketNotifications = () => {
  const { notifications, removeNotification, connected } = useSocket();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Indicador de conexión */}
      <div 
        className={`position-fixed top-0 start-0 m-2`} 
        style={{ zIndex: 9998 }}
      >
        <div 
          className={`badge ${connected ? 'bg-success' : 'bg-danger'} d-flex align-items-center`}
          style={{ fontSize: '0.7rem' }}
        >
          <i className={`bi bi-${connected ? 'wifi' : 'wifi-off'} me-1`}></i>
          {connected ? 'En línea' : 'Sin conexión'}
        </div>
      </div>

      {/* Container de notificaciones */}
      <div 
        className="position-fixed top-0 end-0 m-3" 
        style={{ zIndex: 9999, width: '350px' }}
      >
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`alert alert-${getAlertType(notification.type)} alert-dismissible shadow-lg border-0 mb-2`}
            style={{
              animation: 'slideInRight 0.3s ease-out',
              opacity: '0.95',
              backdropFilter: 'blur(10px)',
              transform: `translateY(${index * 5}px)`,
              zIndex: 9999 - index
            }}
          >
            <div className="d-flex align-items-start">
              <i className={`bi ${getIcon(notification.type)} me-2 fs-5`}></i>
              <div className="flex-grow-1">
                {notification.title && (
                  <div className="fw-bold small">{notification.title}</div>
                )}
                <div className="small">{notification.message}</div>
                {notification.timestamp && (
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                    {formatTime(notification.timestamp)}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => removeNotification(notification.id)}
                style={{ fontSize: '0.7rem' }}
              ></button>
            </div>
          </div>
        ))}
      </div>

      {/* Estilos para animaciones */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 0.95;
          }
        }
        
        .alert {
          transition: all 0.3s ease;
        }
        
        .alert:hover {
          opacity: 1 !important;
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
};

// Funciones helper
const getAlertType = (type) => {
  switch (type) {
    case 'success':
      return 'success';
    case 'error':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'primary';
  }
};

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return 'bi-check-circle-fill';
    case 'error':
      return 'bi-x-circle-fill';
    case 'warning':
      return 'bi-exclamation-triangle-fill';
    case 'info':
      return 'bi-info-circle-fill';
    default:
      return 'bi-bell-fill';
  }
};

const formatTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMinutes = Math.floor((now - time) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  
  return time.toLocaleDateString('es-ES');
};

export default SocketNotifications;