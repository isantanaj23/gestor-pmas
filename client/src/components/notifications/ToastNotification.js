// client/src/components/notifications/ToastNotification.js
import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

// 🎨 Componente personalizado para cada tipo de notificación
const CustomToast = ({ t, title, message, type, icon, onAction, actionText }) => (
  <div
    className={`${
      t.visible ? 'animate__animated animate__slideInRight' : 'animate__animated animate__slideOutRight'
    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    style={{
      animation: t.visible ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in'
    }}
  >
    <div className="flex-1 w-0 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {/* Icono basado en el tipo */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm
            ${type === 'success' ? 'bg-green-100 text-green-600' : ''}
            ${type === 'error' ? 'bg-red-100 text-red-600' : ''}
            ${type === 'warning' ? 'bg-yellow-100 text-yellow-600' : ''}
            ${type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
          `}>
            {icon || (
              <>
                {type === 'success' && '✅'}
                {type === 'error' && '❌'}
                {type === 'warning' && '⚠️'}
                {type === 'info' && 'ℹ️'}
              </>
            )}
          </div>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <p className="text-sm font-medium text-gray-900">
              {title}
            </p>
          )}
          <p className={`text-sm text-gray-500 ${title ? 'mt-1' : ''}`}>
            {message}
          </p>
          {actionText && onAction && (
            <div className="mt-2">
              <button
                onClick={onAction}
                className="text-sm bg-white rounded-md text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {actionText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    <div className="flex border-l border-gray-200">
      <button
        onClick={() => toast.dismiss(t.id)}
        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        ✕
      </button>
    </div>
  </div>
);

// 🎯 Funciones helper para diferentes tipos de notificaciones
export const showNotificationToast = {
  // Notificación de éxito
  success: (message, options = {}) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        message={message}
        type="success"
        {...options}
      />
    ), {
      duration: 4000,
      position: 'top-right',
      ...options
    });
  },

  // Notificación de error
  error: (message, options = {}) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        message={message}
        type="error"
        {...options}
      />
    ), {
      duration: 6000,
      position: 'top-right',
      ...options
    });
  },

  // Notificación de advertencia
  warning: (message, options = {}) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        message={message}
        type="warning"
        {...options}
      />
    ), {
      duration: 5000,
      position: 'top-right',
      ...options
    });
  },

  // Notificación informativa
  info: (message, options = {}) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        message={message}
        type="info"
        {...options}
      />
    ), {
      duration: 4000,
      position: 'top-right',
      ...options
    });
  },

  // Notificación de nueva tarea
  taskAssigned: (taskTitle, projectName, onView) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        title="Nueva tarea asignada"
        message={`"${taskTitle}" en ${projectName}`}
        type="info"
        icon="📋"
        actionText="Ver tarea"
        onAction={onView}
      />
    ), {
      duration: 6000,
      position: 'top-right'
    });
  },

  // Notificación de comentario
  newComment: (userName, taskTitle, onView) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        title="Nuevo comentario"
        message={`${userName} comentó en "${taskTitle}"`}
        type="info"
        icon="💬"
        actionText="Ver comentario"
        onAction={onView}
      />
    ), {
      duration: 5000,
      position: 'top-right'
    });
  },

  // Notificación de tarea vencida
  taskDue: (taskTitle, onView) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        title="Tarea vencida"
        message={`"${taskTitle}" ha vencido`}
        type="warning"
        icon="⏰"
        actionText="Ver tarea"
        onAction={onView}
      />
    ), {
      duration: 8000,
      position: 'top-right'
    });
  },

  // Notificación de seguimiento CRM
  followUpDue: (contactName, onView) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        title="Seguimiento pendiente"
        message={`Recordatorio para contactar a ${contactName}`}
        type="warning"
        icon="📞"
        actionText="Ver contacto"
        onAction={onView}
      />
    ), {
      duration: 6000,
      position: 'top-right'
    });
  },

  // Notificación de publicación social
  socialPostScheduled: (platform, onView) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        title="Publicación programada"
        message={`Tu publicación para ${platform} ha sido programada`}
        type="success"
        icon="📅"
        actionText="Ver calendario"
        onAction={onView}
      />
    ), {
      duration: 4000,
      position: 'top-right'
    });
  },

  // Notificación de publicación realizada
  socialPostPublished: (platform, onView) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        title="Publicación realizada"
        message={`Tu publicación en ${platform} ha sido publicada exitosamente`}
        type="success"
        icon="🚀"
        actionText="Ver publicación"
        onAction={onView}
      />
    ), {
      duration: 5000,
      position: 'top-right'
    });
  },

  // Notificación personalizada
  custom: (title, message, type = 'info', options = {}) => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        title={title}
        message={message}
        type={type}
        {...options}
      />
    ), {
      duration: 4000,
      position: 'top-right',
      ...options
    });
  },

  // Notificación con botón de acción
  withAction: (title, message, actionText, onAction, type = 'info') => {
    toast.custom((t) => (
      <CustomToast
        t={t}
        title={title}
        message={message}
        type={type}
        actionText={actionText}
        onAction={() => {
          onAction();
          toast.dismiss(t.id);
        }}
      />
    ), {
      duration: 8000,
      position: 'top-right'
    });
  }
};

// 🎨 Componente principal del Toast Provider
const ToastNotification = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{
        top: 80, // Debajo del navbar
        right: 20
      }}
      toastOptions={{
        // Configuración global
        duration: 4000,
        style: {
          background: 'transparent',
          padding: 0,
          boxShadow: 'none'
        },
        // Configuración por tipo
        success: {
          duration: 4000,
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFFFFF',
          },
        },
        error: {
          duration: 6000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#FFFFFF',
          },
        },
        loading: {
          duration: Infinity,
        },
      }}
    />
  );
};

export default ToastNotification;