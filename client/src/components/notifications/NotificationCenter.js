// client/src/components/notifications/NotificationCenter.js
import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import useNotifications from '../../hooks/useNotifications';

// 🎨 Icono para cada tipo de notificación
const getNotificationIcon = (type) => {
  const icons = {
    task_assigned: '📋',
    task_completed: '✅',
    task_due: '⏰',
    comment_added: '💬',
    project_updated: '🏗️',
    followup_due: '📞',
    system: '⚙️',
    social_post_scheduled: '📅',
    social_post_published: '🚀'
  };
  return icons[type] || 'ℹ️';
};

// 🎨 Color del borde para cada prioridad
const getPriorityColor = (priority) => {
  const colors = {
    low: 'border-l-gray-300',
    normal: 'border-l-blue-400',
    high: 'border-l-yellow-400',
    urgent: 'border-l-red-500'
  };
  return colors[priority] || 'border-l-blue-400';
};

// 📝 Componente de notificación individual
const NotificationItem = ({ notification, onMarkAsRead, onDelete, onClick }) => {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification._id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es
  });

  return (
    <div
      className={`
        group relative border-l-4 ${getPriorityColor(notification.priority)}
        p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200
        ${!notification.read ? 'bg-blue-50' : 'bg-white'}
      `}
      onClick={handleClick}
    >
      {/* Indicador de no leída */}
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}

      <div className="flex items-start space-x-3">
        {/* Icono de la notificación */}
        <div className="flex-shrink-0 text-lg">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Contenido de la notificación */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              
              {/* Información adicional */}
              <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                <span>{timeAgo}</span>
                {notification.sender && (
                  <>
                    <span>•</span>
                    <span>de {notification.sender.name}</span>
                  </>
                )}
                {notification.priority === 'urgent' && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 font-medium">URGENTE</span>
                  </>
                )}
              </div>
            </div>

            {/* Botón de eliminar (solo visible en hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification._id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
              title="Eliminar notificación"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔔 Componente principal del centro de notificaciones
const NotificationCenter = ({ isOpen, onClose, anchorEl }) => {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const dropdownRef = useRef(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    loadMoreNotifications,
    refreshNotifications
  } = useNotifications();

  // 🎯 Filtrar notificaciones según el filtro seleccionado
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  // 🖱️ Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // 🔄 Manejar scroll para cargar más notificaciones
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop === clientHeight && hasMore && !loading) {
      loadMoreNotifications();
    }
  };

  // 🖱️ Manejar clic en notificación
  const handleNotificationClick = (notification) => {
    // Redirigir según el tipo de notificación
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 flex flex-col"
      style={{ minHeight: '300px' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {unreadCount}
              </span>
            )}
          </h3>
          
          {/* Botones de acción */}
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshNotifications}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Actualizar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                title="Marcar todas como leídas"
              >
                Marcar todas
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex space-x-1 bg-white rounded-md p-1">
          {[
            { key: 'all', label: 'Todas', count: notifications.length },
            { key: 'unread', label: 'No leídas', count: unreadCount },
            { key: 'read', label: 'Leídas', count: notifications.filter(n => n.read).length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`
                flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200
                ${filter === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div 
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {loading && notifications.length === 0 ? (
          // Estado de carga inicial
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-500">Cargando notificaciones...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          // Estado vacío
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-2">🔔</div>
            <p className="text-sm text-gray-500 mb-1">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' :
               filter === 'read' ? 'No tienes notificaciones leídas' :
               'No tienes notificaciones'}
            </p>
            {filter === 'all' && (
              <p className="text-xs text-gray-400">
                Las notificaciones aparecerán aquí cuando ocurran eventos
              </p>
            )}
          </div>
        ) : (
          // Lista de notificaciones
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClick={handleNotificationClick}
              />
            ))}
            
            {/* Indicador de carga para más notificaciones */}
            {hasMore && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-xs text-gray-500">Cargando más...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      {filteredNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center">
            <button
              onClick={clearReadNotifications}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Limpiar leídas
            </button>
            
            <button
              onClick={onClose}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md text-gray-700 transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;