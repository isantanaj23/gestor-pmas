// client/src/components/common/NotificationCenter.js
import React, { useState, useEffect, useCallback } from 'react';
import useSocket from '../../hooks/useSocket';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentToast, setCurrentToast] = useState(null);
  const { on, off } = useSocket();

  // Función para agregar notificación
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Mantener solo 50 notificaciones

    // Mostrar toast solo si el dropdown no está abierto
    if (!showDropdown) {
      setCurrentToast(newNotification);
      setShowToast(true);

      // Auto-ocultar toast después de 4 segundos
      setTimeout(() => {
        setShowToast(false);
      }, 4000);
    }
  }, [showDropdown]);

  // Configurar listeners de socket
  useEffect(() => {
    // Tarea actualizada
    const handleTaskUpdated = (data) => {
      addNotification({
        type: 'task',
        title: 'Tarea Actualizada',
        message: `${data.updatedBy.name} ${data.action} una tarea`,
        icon: 'bi-check-circle',
        color: 'primary',
        data: data
      });
    };

    // Nueva tarea asignada
    const handleTaskAssigned = (data) => {
      addNotification({
        type: 'task',
        title: 'Nueva Tarea Asignada',
        message: data.message,
        icon: 'bi-person-check',
        color: 'success',
        data: data
      });
    };

    // Tarea vencida
    const handleTaskDue = (data) => {
      addNotification({
        type: 'task',
        title: 'Tarea Vencida',
        message: data.message,
        icon: 'bi-exclamation-triangle',
        color: 'danger',
        data: data
      });
    };

    // Nuevo comentario
    const handleNewComment = (data) => {
      addNotification({
        type: 'comment',
        title: 'Nuevo Comentario',
        message: `${data.comment.user.name} agregó un comentario`,
        icon: 'bi-chat-dots',
        color: 'info',
        data: data
      });
    };

    // Proyecto actualizado
    const handleProjectUpdated = (data) => {
      addNotification({
        type: 'project',
        title: 'Proyecto Actualizado',
        message: `${data.updatedBy.name} ${data.action} el proyecto`,
        icon: 'bi-kanban',
        color: 'warning',
        data: data
      });
    };

    // Contacto actualizado
    const handleContactUpdated = (data) => {
      addNotification({
        type: 'contact',
        title: 'Contacto Actualizado',
        message: `Contacto ${data.action}`,
        icon: 'bi-person-plus',
        color: 'info',
        data: data
      });
    };

    // Seguimiento pendiente
    const handleFollowUpDue = (data) => {
      addNotification({
        type: 'followup',
        title: 'Seguimiento Pendiente',
        message: data.message,
        icon: 'bi-telephone',
        color: 'warning',
        data: data
      });
    };

    // Registrar listeners
    on('task_updated', handleTaskUpdated);
    on('task_assigned', handleTaskAssigned);
    on('task_due', handleTaskDue);
    on('new_comment', handleNewComment);
    on('project_updated', handleProjectUpdated);
    on('contact_updated', handleContactUpdated);
    on('followup_due', handleFollowUpDue);

    // Cleanup
    return () => {
      off('task_updated', handleTaskUpdated);
      off('task_assigned', handleTaskAssigned);
      off('task_due', handleTaskDue);
      off('new_comment', handleNewComment);
      off('project_updated', handleProjectUpdated);
      off('contact_updated', handleContactUpdated);
      off('followup_due', handleFollowUpDue);
    };
  }, [on, off, addNotification]);

  // Cerrar dropdown al hacer click fuera
  const handleClickOutside = useCallback((e) => {
    if (!e.target.closest('.notification-dropdown')) {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Marcar notificación como leída
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Limpiar todas las notificaciones
  const clearAll = () => {
    setNotifications([]);
  };

  // Formatear fecha
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    
    return date.toLocaleDateString('es-ES');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Botón de notificaciones - Mantiene el estilo exacto de tu Navbar */}
      <div className="position-relative notification-dropdown">
        <button 
          className="btn btn-light rounded-circle p-2 position-relative"
          title="Notificaciones"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <i className="bi bi-bell fs-5"></i>
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
              <span className="visually-hidden">notificaciones</span>
            </span>
          )}
        </button>

        {/* Dropdown de notificaciones */}
        {showDropdown && (
          <div 
            className="position-absolute top-100 end-0 bg-white shadow border rounded-3 mt-2"
            style={{ 
              width: '380px', 
              maxHeight: '500px',
              zIndex: 1050,
              transform: 'translateX(50%)'
            }}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light rounded-top">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-bell me-2"></i>
                Notificaciones
              </h6>
              <div className="d-flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={markAllAsRead}
                  >
                    <i className="bi bi-check-all me-1"></i>
                    Marcar todas
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={clearAll}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
              {notifications.length === 0 ? (
                <div className="text-center p-5 text-muted">
                  <i className="bi bi-bell-slash fs-1 mb-3 d-block text-muted"></i>
                  <h6 className="text-muted">No hay notificaciones</h6>
                  <p className="small mb-0">Te notificaremos cuando algo importante suceda</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-bottom position-relative hover-bg-light cursor-pointer ${!notification.read ? 'bg-light bg-opacity-50' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex">
                      <div className={`me-3 text-${notification.color} fs-5`}>
                        <i className={notification.icon}></i>
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="mb-0 fw-semibold text-truncate">{notification.title}</h6>
                          <small className="text-muted ms-2 flex-shrink-0">
                            {formatTime(notification.timestamp)}
                          </small>
                        </div>
                        <p className="mb-0 small text-muted text-truncate">{notification.message}</p>
                        {!notification.read && (
                          <span className="position-absolute top-50 end-0 translate-middle-y me-3">
                            <span className="bg-primary rounded-circle" style={{ width: '8px', height: '8px', display: 'block' }}></span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-top bg-light text-center rounded-bottom">
                <button className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-eye me-1"></i>
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {showToast && currentToast && (
        <div 
          className="position-fixed bottom-0 end-0 p-3" 
          style={{ zIndex: 1060 }}
        >
          <div className={`toast show shadow border border-${currentToast.color}`} role="alert">
            <div className="toast-header">
              <div className={`me-2 text-${currentToast.color}`}>
                <i className={currentToast.icon}></i>
              </div>
              <strong className="me-auto">{currentToast.title}</strong>
              <small className="text-muted">Ahora</small>
              <button
                type="button"
                className="btn-close btn-close-sm"
                onClick={() => setShowToast(false)}
              ></button>
            </div>
            <div className="toast-body">
              {currentToast.message}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationCenter;