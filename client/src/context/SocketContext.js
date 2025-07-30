// client/src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user && token) {
      console.log('🔌 Conectando Socket.io para usuario:', user.name);
      
      // Crear conexión de socket
const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Eventos de conexión
      newSocket.on('connect', () => {
        console.log('✅ Socket.io conectado:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket.io desconectado');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Error de conexión Socket.io:', error);
        setConnected(false);
      });

      // 🆕 Eventos de publicaciones sociales
      newSocket.on('social_post_created', (data) => {
        console.log('📱 Nueva publicación social creada:', data);
        
        // Mostrar notificación en la UI
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Publicación creada',
          message: `Nueva publicación para ${data.platform} programada`,
          data: data
        });

        // Emitir evento personalizado para que los componentes puedan escuchar
        window.dispatchEvent(new CustomEvent('socialPostCreated', { detail: data }));
      });

      newSocket.on('social_post_updated', (data) => {
        console.log('✏️ Publicación social actualizada:', data);
        
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'Publicación actualizada',
          message: `Publicación de ${data.platform} ha sido modificada`,
          data: data
        });

        window.dispatchEvent(new CustomEvent('socialPostUpdated', { detail: data }));
      });

      newSocket.on('social_post_deleted', (data) => {
        console.log('🗑️ Publicación social eliminada:', data);
        
        addNotification({
          id: Date.now(),
          type: 'warning',
          title: 'Publicación eliminada',
          message: `Una publicación de ${data.platform} ha sido eliminada`,
          data: data
        });

        window.dispatchEvent(new CustomEvent('socialPostDeleted', { detail: data }));
      });

      newSocket.on('social_post_status_changed', (data) => {
        console.log('🔄 Estado de publicación social cambiado:', data);
        
        const statusMessages = {
          'draft': 'marcada como borrador',
          'scheduled': 'programada',
          'published': 'publicada',
          'failed': 'falló en la publicación',
          'cancelled': 'cancelada'
        };

        addNotification({
          id: Date.now(),
          type: data.status === 'published' ? 'success' : 'info',
          title: 'Estado actualizado',
          message: `Publicación ${statusMessages[data.status] || 'actualizada'}`,
          data: data
        });

        window.dispatchEvent(new CustomEvent('socialPostStatusChanged', { detail: data }));
      });

      // Eventos generales de notificaciones
      newSocket.on('notification', (notification) => {
        console.log('🔔 Nueva notificación:', notification);
        addNotification(notification);
      });

      // Eventos de proyectos
      newSocket.on('project_updated', (data) => {
        console.log('📋 Proyecto actualizado:', data);
        window.dispatchEvent(new CustomEvent('projectUpdated', { detail: data }));
      });

      // Eventos de tareas
      newSocket.on('task_created', (data) => {
        console.log('✅ Nueva tarea creada:', data);
        window.dispatchEvent(new CustomEvent('taskCreated', { detail: data }));
      });

      newSocket.on('task_updated', (data) => {
        console.log('✏️ Tarea actualizada:', data);
        window.dispatchEvent(new CustomEvent('taskUpdated', { detail: data }));
      });

      setSocket(newSocket);

      // Cleanup
      return () => {
        console.log('🔌 Cerrando conexión Socket.io');
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [user, token]);

  // Función para agregar notificaciones
  const addNotification = (notification) => {
    setNotifications(prev => [
      { ...notification, timestamp: new Date() },
      ...prev.slice(0, 9) // Mantener solo las últimas 10
    ]);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  // Función para remover notificaciones
  const removeNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  // Función para unirse a un room de proyecto
  const joinProjectRoom = (projectId) => {
    if (socket && connected) {
      console.log(`🏠 Uniéndose al room del proyecto: ${projectId}`);
      socket.emit('join_project', projectId);
    }
  };

  // Función para salir de un room de proyecto
  const leaveProjectRoom = (projectId) => {
    if (socket && connected) {
      console.log(`🚪 Saliendo del room del proyecto: ${projectId}`);
      socket.emit('leave_project', projectId);
    }
  };

  // Función para emitir eventos personalizados
  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  // Función para escuchar eventos personalizados
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  // Función para dejar de escuchar eventos
  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    notifications,
    addNotification,
    removeNotification,
    joinProjectRoom,
    leaveProjectRoom,
    emit,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;