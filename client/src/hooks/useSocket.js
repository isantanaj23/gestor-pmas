import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const useSocket = () => {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Referencias para evitar re-creaciones
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  // =================================================================
  // CONEXIÓN Y CONFIGURACIÓN INICIAL
  // =================================================================

  useEffect(() => {
    // Solo conectar si el usuario está autenticado y tenemos token
    if (isAuthenticated && token && user && !isLoading) {
      console.log('🔌 Iniciando conexión Socket.io...');
      console.log('   hasToken:', !!token);
      console.log('   hasUser:', !!user);
      console.log('   isAuthenticated:', isAuthenticated);

      // Crear nueva conexión
      const newSocket = io('http://localhost:3001', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Event listeners básicos
      newSocket.on('connect', () => {
        console.log('✅ Socket.io conectado:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket.io desconectado:', reason);
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Error de conexión Socket.io:', error);
        setConnected(false);
      });

      // =================================================================
      // 🆕 EVENT LISTENERS PARA CHAT
      // =================================================================

      // Nuevo mensaje recibido
      newSocket.on('new_message', (data) => {
        console.log('📨 Nuevo mensaje recibido:', data);
        
        // Emitir evento personalizado que puede ser escuchado por componentes
        window.dispatchEvent(new CustomEvent('newMessage', { 
          detail: { 
            channelId: data.channelId, 
            message: data.message,
            timestamp: data.timestamp
          } 
        }));
      });

      // Mensaje actualizado
      newSocket.on('message_updated', (data) => {
        console.log('✏️ Mensaje actualizado:', data);
        
        window.dispatchEvent(new CustomEvent('messageUpdated', { 
          detail: { 
            channelId: data.channelId, 
            message: data.message,
            timestamp: data.timestamp
          } 
        }));
      });

      // Mensaje eliminado
      newSocket.on('message_deleted', (data) => {
        console.log('🗑️ Mensaje eliminado:', data);
        
        window.dispatchEvent(new CustomEvent('messageDeleted', { 
          detail: { 
            channelId: data.channelId, 
            messageId: data.messageId,
            timestamp: data.timestamp
          } 
        }));
      });

      // Usuario se unió al canal
      newSocket.on('user_joined_channel', (data) => {
        console.log('👋 Usuario se unió al canal:', data);
        
        window.dispatchEvent(new CustomEvent('userJoinedChannel', { 
          detail: data 
        }));
      });

      // Usuario salió del canal
      newSocket.on('user_left_channel', (data) => {
        console.log('👋 Usuario salió del canal:', data);
        
        window.dispatchEvent(new CustomEvent('userLeftChannel', { 
          detail: data 
        }));
      });

      // Usuario está escribiendo
      newSocket.on('typing_start', (data) => {
        console.log('✍️ Usuario escribiendo:', data);
        
        window.dispatchEvent(new CustomEvent('typingStart', { 
          detail: data 
        }));
      });

      // Usuario dejó de escribir
      newSocket.on('typing_stop', (data) => {
        console.log('✍️ Usuario dejó de escribir:', data);
        
        window.dispatchEvent(new CustomEvent('typingStop', { 
          detail: data 
        }));
      });

      // Mensajes marcados como leídos
      newSocket.on('messages_read', (data) => {
        console.log('📖 Mensajes marcados como leídos:', data);
        
        window.dispatchEvent(new CustomEvent('messagesRead', { 
          detail: data 
        }));
      });

      // Nuevo canal creado
      newSocket.on('channel_created', (data) => {
        console.log('📢 Nuevo canal creado:', data);
        
        window.dispatchEvent(new CustomEvent('channelCreated', { 
          detail: data 
        }));
      });

      // Canal actualizado
      newSocket.on('channel_updated', (data) => {
        console.log('📢 Canal actualizado:', data);
        
        window.dispatchEvent(new CustomEvent('channelUpdated', { 
          detail: data 
        }));
      });

      // =================================================================
      // EVENT LISTENERS EXISTENTES (Notificaciones, Proyectos, etc.)
      // =================================================================

      // Notificaciones
      newSocket.on('new_notification', (notification) => {
        console.log('🔔 Nueva notificación:', notification);
        addNotification(notification);
      });

      // Actualizaciones de tareas
      newSocket.on('task_updated', (data) => {
        console.log('📋 Tarea actualizada:', data);
        window.dispatchEvent(new CustomEvent('taskUpdated', { detail: data }));
      });

      // Actualizaciones de proyectos
      newSocket.on('project_updated', (data) => {
        console.log('📂 Proyecto actualizado:', data);
        window.dispatchEvent(new CustomEvent('projectUpdated', { detail: data }));
      });

      // Guardar referencias
      socketRef.current = newSocket;
      setSocket(newSocket);

      // Cleanup al desmontar
      return () => {
        console.log('🔌 Cerrando conexión Socket.io');
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    } else {
      // Limpiar conexión si no está autenticado
      console.log('🔌 Usuario no autenticado, limpiando socket');
      console.log('   isAuthenticated:', isAuthenticated);
      console.log('   hasToken:', !!token);
      console.log('   hasUser:', !!user);
      console.log('   isLoading:', isLoading);
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      setSocket(null);
      setConnected(false);
    }
  }, [isAuthenticated, token, user, isLoading]);

  // =================================================================
  // FUNCIONES DE UTILIDAD PARA NOTIFICACIONES
  // =================================================================

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [
      { ...notification, timestamp: new Date() },
      ...prev.slice(0, 9) // Mantener solo las últimas 10
    ]);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  }, []);

  // =================================================================
  // 🆕 FUNCIONES PARA CHAT
  // =================================================================

  // Unirse a un canal
  const joinChannel = useCallback((channelId) => {
    if (socket && connected) {
      console.log(`💬 Uniéndose al canal: ${channelId}`);
      socket.emit('join_channel', channelId);
      return true;
    } else {
      console.log(`⏳ Socket no listo, no se puede unir al canal: ${channelId}`);
      return false;
    }
  }, [socket, connected]);

  // Salir de un canal
  const leaveChannel = useCallback((channelId) => {
    if (socket && connected) {
      console.log(`👋 Saliendo del canal: ${channelId}`);
      socket.emit('leave_channel', channelId);
      return true;
    }
    return false;
  }, [socket, connected]);

  // Indicar que se está escribiendo
  const startTyping = useCallback((channelId) => {
    if (socket && connected) {
      socket.emit('typing_start', { channelId });
      return true;
    }
    return false;
  }, [socket, connected]);

  // Indicar que se dejó de escribir
  const stopTyping = useCallback((channelId) => {
    if (socket && connected) {
      socket.emit('typing_stop', { channelId });
      return true;
    }
    return false;
  }, [socket, connected]);

  // Marcar mensajes como leídos
  const markMessagesAsRead = useCallback((channelId, messageIds = []) => {
    if (socket && connected) {
      socket.emit('mark_messages_read', { channelId, messageIds });
      return true;
    }
    return false;
  }, [socket, connected]);

  // Enviar mensaje (principalmente para notificar, el mensaje se envía por API)
  const sendMessage = useCallback((channelId, content) => {
    if (socket && connected) {
      socket.emit('send_message', { channelId, content });
      return true;
    }
    return false;
  }, [socket, connected]);

  // =================================================================
  // FUNCIONES EXISTENTES (Proyectos, Tareas, etc.)
  // =================================================================

  const joinProject = useCallback((projectId) => {
    if (socket && connected) {
      console.log(`👥 Uniéndose al proyecto: ${projectId}`);
      socket.emit('join_project', projectId);
      return true;
    }
    return false;
  }, [socket, connected]);

  const leaveProject = useCallback((projectId) => {
    if (socket && connected) {
      socket.emit('leave_project', projectId);
      return true;
    }
    return false;
  }, [socket, connected]);

  const updateTask = useCallback((projectId, taskId, update, action = 'updated') => {
    if (socket && connected) {
      socket.emit('task_update', { projectId, taskId, update, action });
      return true;
    }
    return false;
  }, [socket, connected]);

  const updateProject = useCallback((projectId, update, action = 'updated') => {
    if (socket && connected) {
      socket.emit('project_update', { projectId, update, action });
      return true;
    }
    return false;
  }, [socket, connected]);

  // =================================================================
  // FUNCIONES GENÉRICAS
  // =================================================================

  const emit = useCallback((event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
      console.log(`📤 Emit exitoso: ${event}`);
      return true;
    } else {
      console.log(`⏳ Socket no listo, emit diferido: ${event}`);
      return false;
    }
  }, [socket, connected]);

  const on = useCallback((event, callback) => {
    if (socket) {
      console.log(`🎧 Agregando listener: ${event}`);
      socket.on(event, callback);
      
      // Guardar referencia
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, []);
      }
      listenersRef.current.get(event).push(callback);
    }
  }, [socket]);

  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
      
      const listeners = listenersRef.current.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }, [socket]);

  // =================================================================
  // RETORNO DEL HOOK
  // =================================================================

  return {
    // Estado básico
    socket,
    connected,
    notifications,
    
    // Funciones de notificaciones
    addNotification,
    removeNotification,
    
    // 🆕 Funciones de chat
    joinChannel,
    leaveChannel,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    sendMessage,
    
    // Funciones de proyectos
    joinProject,
    leaveProject,
    updateTask,
    updateProject,
    
    // Funciones genéricas
    emit,
    on,
    off
  };
};

export default useSocket;