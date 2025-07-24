// client/src/components/notifications/NotificationBell.js
import React, { useState, useRef } from 'react';
import NotificationCenter from './NotificationCenter';
import useNotifications from '../../hooks/useNotifications';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);
  const { unreadCount, createTestNotification } = useNotifications();

  // 🔔 Toggle del dropdown de notificaciones
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  // 🖱️ Cerrar dropdown
  const closeNotifications = () => {
    setIsOpen(false);
  };

  // 🎯 Manejar doble clic para crear notificación de prueba (solo desarrollo)
  const handleDoubleClick = () => {
    if (process.env.NODE_ENV === 'development') {
      createTestNotification();
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* Botón de la campana */}
      <button
        onClick={toggleNotifications}
        onDoubleClick={handleDoubleClick}
        className={`
          relative p-2 rounded-lg transition-all duration-200 ease-in-out
          ${isOpen 
            ? 'bg-blue-100 text-blue-600 shadow-md' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
        title={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} sin leer)` : ''}`}
      >
        {/* Icono de campana */}
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Contador de notificaciones no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center">
            {/* Animación de pulso para notificaciones urgentes */}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            
            {/* Contador */}
            <span className="relative inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[1.25rem] h-5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}

        {/* Indicador de nuevas notificaciones (punto verde) */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white"></span>
        )}
      </button>

      {/* Dropdown del centro de notificaciones */}
      <NotificationCenter
        isOpen={isOpen}
        onClose={closeNotifications}
        anchorEl={bellRef.current}
      />

      {/* Overlay para cerrar en móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden" 
          onClick={closeNotifications}
        />
      )}
    </div>
  );
};

export default NotificationBell;