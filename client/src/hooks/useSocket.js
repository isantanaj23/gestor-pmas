import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const useSocket = () => {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // 🆕 Estados para usuarios en línea
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [projectOnlineUsers, setProjectOnlineUsers] = useState(new Map()); // projectId -> users array
  
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
      // 🆕 EVENT LISTENERS PARA USUARIOS EN LÍNEA
      // =================================================================

      // Lista de usuarios en línea de un proyecto
      newSocket.on('project_online_users', (data) => {
        console.log('👥 Usuarios en línea del proyecto recibidos:', data);
        
        const { projectId, users } = data;
        
        // Actualizar mapa de usuarios en línea por proyecto
        setProjectOnlineUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(projectId, users || []);
          return newMap;
        });

        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('projectOnlineUsers', { 
          detail: { projectId, users: users || [] }
        }));
      });

      // Usuario se unió al proyecto
      newSocket.on('user_joined_project', (data) => {
        console.log('👋 Usuario se unió al proyecto:', data);
        
        const { projectId, userId, userName, userAvatar } = data;
        
        // Actualizar usuarios del proyecto
        setProjectOnlineUsers(prev => {
          const newMap = new Map(prev);
          const currentUsers = newMap.get(projectId) || [];
          const userExists = currentUsers.some(u => u.userId === userId);
          
          if (!userExists) {
            const updatedUsers = [...currentUsers, {
              userId,
              userName,
              userAvatar,
              isOnline: true,
              connectedAt: new Date()
            }];
            newMap.set(projectId, updatedUsers);
          }
          
          return newMap;
        });

        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('userJoinedProject', { 
          detail: data 
        }));
      });

      // Usuario salió del proyecto
      newSocket.on('user_left_project', (data) => {
        console.log('👋 Usuario salió del proyecto:', data);
        
        const { projectId, userId } = data;
        
        // Actualizar usuarios del proyecto
        setProjectOnlineUsers(prev => {
          const newMap = new Map(prev);
          const currentUsers = newMap.get(projectId) || [];
          const updatedUsers = currentUsers.filter(u => u.userId !== userId);
          newMap.set(projectId, updatedUsers);
          return newMap;
        });

        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('userLeftProject', { 
          detail: data 
        }));
      });

      // 🆕 Miembro removido del proyecto
      newSocket.on('member_removed', (data) => {
        console.log('🚫 Miembro removido del proyecto:', data);
        
        const { projectId, removedMemberId } = data;
        
        // Actualizar usuarios en línea
        setProjectOnlineUsers(prev => {
          const newMap = new Map(prev);
          const currentUsers = newMap.get(projectId) || [];
          const updatedUsers = currentUsers.filter(u => u.userId !== removedMemberId);
          newMap.set(projectId, updatedUsers);
          return newMap;
        });

        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('memberRemoved', { 
          detail: data 
        }));
      });

      // 🆕 Usuario fue removido del proyecto
      newSocket.on('removed_from_project', (data) => {
        console.log('🚫 Fuiste removido del proyecto:', data);
        
        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('removedFromProject', { 
          detail: data 
        }));
      });

      // 🆕 Usuario fue agregado al proyecto
      newSocket.on('added_to_project', (data) => {
        console.log('✅ Fuiste agregado al proyecto:', data);
        
        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('addedToProject', { 
          detail: data 
        }));
      });

      // 🆕 Nuevo miembro agregado al proyecto
      newSocket.on('member_added', (data) => {
        console.log('👥 Nuevo miembro agregado al proyecto:', data);
        
        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('memberAdded', { 
          detail: data 
        }));
      });

      // =================================================================
      // EVENT LISTENERS PARA CHAT (EXISTENTES)
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

      // 🆕 Nuevo mensaje global (para notificaciones)
      newSocket.on('new_message_global', (data) => {
        console.log('📨 Nuevo mensaje global recibido:', data);
        
        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('newMessageGlobal', { 
          detail: data
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

      // Confirmaciones
      newSocket.on('project_joined', (data) => {
        console.log('✅ Confirmación de unión al proyecto:', data);
      });

      newSocket.on('channel_joined', (data) => {
        console.log('✅ Confirmación de unión al canal:', data);
      });

      // Manejo de errores
      newSocket.on('error', (error) => {
        console.error('❌ Error del socket:', error);
        // Puedes mostrar una notificación al usuario
        addNotification({
          id: Date.now(),
          type: 'error',
          message: error.message || 'Error de conexión'
        });
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
        setOnlineUsers(new Map());
        setProjectOnlineUsers(new Map());
      };
    } else {
      // Limpiar conexión si no está autenticado
      console.log('🔌 Usuario no autenticado, limpiando socket');
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      setSocket(null);
      setConnected(false);
      setOnlineUsers(new Map());
      setProjectOnlineUsers(new Map());
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
  // 🆕 FUNCIONES PARA USUARIOS EN LÍNEA Y GESTIÓN DE MIEMBROS
  // =================================================================

  // Obtener usuarios en línea de un proyecto
  const getProjectOnlineUsers = useCallback((projectId) => {
    return projectOnlineUsers.get(projectId) || [];
  }, [projectOnlineUsers]);

  // Verificar si un usuario está en línea en un proyecto
  const isUserOnlineInProject = useCallback((projectId, userId) => {
    const users = projectOnlineUsers.get(projectId) || [];
    return users.some(user => user.userId === userId && user.isOnline);
  }, [projectOnlineUsers]);

  // Obtener count de usuarios en línea de un proyecto
  const getOnlineUsersCount = useCallback((projectId) => {
    const users = projectOnlineUsers.get(projectId) || [];
    return users.filter(user => user.isOnline).length;
  }, [projectOnlineUsers]);

  // Solicitar usuarios en línea de un proyecto
  const requestProjectOnlineUsers = useCallback((projectId) => {
    if (socket && connected) {
      console.log(`👥 Solicitando usuarios en línea del proyecto: ${projectId}`);
      socket.emit('request_project_online_users', projectId);
      return true;
    }
    return false;
  }, [socket, connected]);

  // Remover miembro del proyecto
  const removeMember = useCallback((projectId, memberIdToRemove, reason) => {
    if (socket && connected) {
      console.log(`🚫 Removiendo miembro: ${memberIdToRemove} del proyecto: ${projectId}`);
      socket.emit('remove_project_member', { 
        projectId, 
        memberIdToRemove, 
        reason: reason || 'Sin razón especificada' 
      });
      return true;
    } else {
      console.log(`⏳ Socket no listo, no se puede remover miembro`);
      return false;
    }
  }, [socket, connected]);

  // =================================================================
  // FUNCIONES PARA CHAT (EXISTENTES)
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
      console.log(`👋 Saliendo del proyecto: ${projectId}`);
      socket.emit('leave_project', projectId);
      
      // Limpiar usuarios en línea del proyecto local
      setProjectOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(projectId);
        return newMap;
      });
      
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
    
    // 🆕 Estados y funciones de usuarios en línea
    onlineUsers,
    projectOnlineUsers,
    getProjectOnlineUsers,
    isUserOnlineInProject,
    getOnlineUsersCount,
    requestProjectOnlineUsers,
    
    // 🆕 Funciones de gestión de miembros
    removeMember,
    
    // Funciones de notificaciones
    addNotification,
    removeNotification,
    
    // Funciones de chat
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