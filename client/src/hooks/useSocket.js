// client/src/hooks/useSocket.js - HOOK COMPLETO INTEGRADO

import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const useSocket = () => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  // 🗺️ Estados para tracking
  const [projectOnlineUsers, setProjectOnlineUsers] = useState(new Map());
  const [userProjects, setUserProjects] = useState(new Set());
  const [currentProject, setCurrentProject] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  
  // 📊 Estados para estadísticas
  const [connectionStats, setConnectionStats] = useState({
    connectTime: null,
    reconnectCount: 0,
    lastPing: null,
    latency: null
  });

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // =================================================================
  // 🔌 CONFIGURACIÓN Y CONEXIÓN DEL SOCKET
  // =================================================================

  useEffect(() => {
    if (!token || !user) {
      console.log('🔌 SOCKET HOOK: No hay token o usuario, no conectando');
      return;
    }

    console.log('🔌 SOCKET HOOK: Inicializando conexión para usuario:', user.name);
    
    // Crear conexión Socket.IO
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // =================================================================
    // 🎧 EVENT LISTENERS DE CONEXIÓN
    // =================================================================

    newSocket.on('connect', () => {
      console.log('✅ SOCKET HOOK: Conectado exitosamente - ID:', newSocket.id);
      setConnected(true);
      setReconnecting(false);
      setConnectionError(null);
      setConnectionStats(prev => ({
        ...prev,
        connectTime: new Date(),
        reconnectCount: prev.reconnectCount + (prev.connectTime ? 1 : 0)
      }));

      // Iniciar ping para medir latencia
      startPingInterval(newSocket);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ SOCKET HOOK: Desconectado - Razón:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Desconexión forzada por el servidor
        setConnectionError('Desconectado por el servidor');
      } else if (reason === 'io client disconnect') {
        // Desconexión manual
        setConnectionError(null);
      } else {
        // Desconexión por red u otros problemas
        setConnectionError('Conexión perdida');
        setReconnecting(true);
      }

      // Limpiar ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 SOCKET HOOK: Reconectado después de', attemptNumber, 'intentos');
      setReconnecting(false);
      setConnectionError(null);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 SOCKET HOOK: Intento de reconexión', attemptNumber);
      setReconnecting(true);
    });

    newSocket.on('reconnect_failed', () => {
      console.log('❌ SOCKET HOOK: Falló la reconexión');
      setReconnecting(false);
      setConnectionError('No se pudo reconectar');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ SOCKET HOOK: Error de conexión:', error.message);
      setConnectionError(`Error de conexión: ${error.message}`);
      setConnected(false);
    });

    // =================================================================
    // 🎧 EVENT LISTENERS PARA PROYECTOS Y USUARIOS
    // =================================================================

    newSocket.on('project_online_users', (data) => {
      console.log('👥 SOCKET HOOK: Usuarios en línea actualizados:', data);
      if (data.projectId && data.users) {
        setProjectOnlineUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(data.projectId, data.users);
          return newMap;
        });
        
        // Emitir evento personalizado para que los componentes puedan escuchar
        window.dispatchEvent(new CustomEvent('projectOnlineUsers', {
          detail: data
        }));
      }
    });

    newSocket.on('user_joined_project', (data) => {
      console.log('👋 SOCKET HOOK: Usuario se unió al proyecto:', data);
      
      // Actualizar lista de usuarios en línea
      if (data.projectId) {
        setProjectOnlineUsers(prev => {
          const newMap = new Map(prev);
          const currentUsers = newMap.get(data.projectId) || [];
          
          // Agregar usuario si no existe
          const userExists = currentUsers.some(u => u.userId === data.userId);
          if (!userExists) {
            const updatedUsers = [...currentUsers, {
              userId: data.userId,
              userName: data.userName,
              userRole: data.userRole,
              isOnline: true,
              connectedAt: new Date(data.timestamp)
            }];
            newMap.set(data.projectId, updatedUsers);
          }
          
          return newMap;
        });
      }
      
      // Emitir evento personalizado
      window.dispatchEvent(new CustomEvent('userJoinedProject', {
        detail: data
      }));
    });

    newSocket.on('user_left_project', (data) => {
      console.log('👋 SOCKET HOOK: Usuario salió del proyecto:', data);
      
      // Actualizar lista de usuarios en línea
      if (data.projectId) {
        setProjectOnlineUsers(prev => {
          const newMap = new Map(prev);
          const currentUsers = newMap.get(data.projectId) || [];
          const updatedUsers = currentUsers.filter(u => u.userId !== data.userId);
          newMap.set(data.projectId, updatedUsers);
          return newMap;
        });
      }
      
      // Emitir evento personalizado
      window.dispatchEvent(new CustomEvent('userLeftProject', {
        detail: data
      }));
    });

    // =================================================================
    // 🎧 EVENT LISTENERS PARA MENSAJES
    // =================================================================

    newSocket.on('new_message_global', (data) => {
      console.log('📨 SOCKET HOOK: Nuevo mensaje global:', data);
      
      // Emitir evento personalizado para que los componentes puedan escuchar
      window.dispatchEvent(new CustomEvent('newMessageGlobal', {
        detail: data
      }));
    });

    newSocket.on('new_message', (data) => {
      console.log('📨 SOCKET HOOK: Nuevo mensaje en canal:', data);
      
      // Emitir evento personalizado
      window.dispatchEvent(new CustomEvent('newMessage', {
        detail: data
      }));
    });

    // =================================================================
    // 🎧 EVENT LISTENERS PARA CANALES
    // =================================================================

    newSocket.on('channel_created', (data) => {
      console.log('📢 SOCKET HOOK: Canal creado:', data);
      
      window.dispatchEvent(new CustomEvent('channelCreated', {
        detail: data
      }));
    });

    newSocket.on('channel_updated', (data) => {
      console.log('📝 SOCKET HOOK: Canal actualizado:', data);
      
      window.dispatchEvent(new CustomEvent('channelUpdated', {
        detail: data
      }));
    });

    newSocket.on('channel_deleted', (data) => {
      console.log('🗑️ SOCKET HOOK: Canal eliminado:', data);
      
      window.dispatchEvent(new CustomEvent('channelDeleted', {
        detail: data
      }));
    });

    // =================================================================
    // 🎧 EVENT LISTENERS PARA GESTIÓN DE MIEMBROS
    // =================================================================

    newSocket.on('member_removed_from_project', (data) => {
      console.log('🚫 SOCKET HOOK: Miembro removido del proyecto:', data);
      
      window.dispatchEvent(new CustomEvent('memberRemovedFromProject', {
        detail: data
      }));
    });

    newSocket.on('removed_from_project', (data) => {
      console.log('🚫 SOCKET HOOK: Fuiste removido del proyecto:', data);
      
      window.dispatchEvent(new CustomEvent('removedFromProject', {
        detail: data
      }));
    });

    newSocket.on('member_added_to_channel', (data) => {
      console.log('➕ SOCKET HOOK: Miembro agregado al canal:', data);
      
      window.dispatchEvent(new CustomEvent('memberAddedToChannel', {
        detail: data
      }));
    });

    newSocket.on('member_removed_from_channel', (data) => {
      console.log('➖ SOCKET HOOK: Miembro removido del canal:', data);
      
      window.dispatchEvent(new CustomEvent('memberRemovedFromChannel', {
        detail: data
      }));
    });

    newSocket.on('removed_from_channel', (data) => {
      console.log('🚫 SOCKET HOOK: Fuiste removido del canal:', data);
      
      window.dispatchEvent(new CustomEvent('removedFromChannel', {
        detail: data
      }));
    });

    // =================================================================
    // 🎧 EVENT LISTENERS PARA NOTIFICACIONES (EXISTENTES)
    // =================================================================

    newSocket.on('task_updated', (data) => {
      console.log('📝 SOCKET HOOK: Tarea actualizada:', data);
      
      window.dispatchEvent(new CustomEvent('taskUpdated', {
        detail: data
      }));
    });

    newSocket.on('comment_added', (data) => {
      console.log('💬 SOCKET HOOK: Comentario agregado:', data);
      
      window.dispatchEvent(new CustomEvent('commentAdded', {
        detail: data
      }));
    });

    newSocket.on('project_updated', (data) => {
      console.log('🏗️ SOCKET HOOK: Proyecto actualizado:', data);
      
      window.dispatchEvent(new CustomEvent('projectUpdated', {
        detail: data
      }));
    });

    // =================================================================
    // 🎧 EVENT LISTENERS PARA TESTING Y ERRORES
    // =================================================================

    newSocket.on('pong_test', (data) => {
      console.log('🏓 SOCKET HOOK: Pong recibido:', data);
      const latency = Date.now() - data.originalData?.timestamp;
      setConnectionStats(prev => ({
        ...prev,
        lastPing: new Date(),
        latency: latency
      }));
    });

    newSocket.on('error', (data) => {
      console.error('❌ SOCKET HOOK: Error del servidor:', data);
      setConnectionError(`Error del servidor: ${data.message}`);
    });

    // =================================================================
    // 🧹 CLEANUP
    // =================================================================

    return () => {
      console.log('🧹 SOCKET HOOK: Limpiando conexión');
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
      socketRef.current = null;
    };
  }, [token, user]);

  // =================================================================
  // 🔧 FUNCIONES DE UTILIDAD
  // =================================================================

  const startPingInterval = (socket) => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    pingIntervalRef.current = setInterval(() => {
      if (socket && socket.connected) {
        socket.emit('ping_test', {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          userId: user?.id
        });
      }
    }, 30000); // Ping cada 30 segundos
  };

  // =================================================================
  // 🏠 FUNCIONES PARA PROYECTOS
  // =================================================================

  const joinProject = useCallback((projectId) => {
    if (socket && connected && projectId) {
      console.log('🏠 SOCKET HOOK: Uniéndose al proyecto:', projectId);
      socket.emit('join_project', projectId);
      setUserProjects(prev => new Set([...prev, projectId]));
      setCurrentProject(projectId);
      return true;
    }
    console.warn('⚠️ SOCKET HOOK: No se puede unir al proyecto - Socket no conectado');
    return false;
  }, [socket, connected]);

  const leaveProject = useCallback((projectId) => {
    if (socket && projectId) {
      console.log('🚪 SOCKET HOOK: Saliendo del proyecto:', projectId);
      socket.emit('leave_project', projectId);
      setUserProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
      
      if (currentProject === projectId) {
        setCurrentProject(null);
      }
      return true;
    }
    return false;
  }, [socket, currentProject]);

  const requestProjectOnlineUsers = useCallback((projectId) => {
    if (socket && connected && projectId) {
      console.log('👥 SOCKET HOOK: Solicitando usuarios en línea del proyecto:', projectId);
      socket.emit('request_project_online_users', projectId);
      return true;
    }
    return false;
  }, [socket, connected]);

  const getProjectOnlineUsers = useCallback((projectId) => {
    return projectOnlineUsers.get(projectId) || [];
  }, [projectOnlineUsers]);

  const isUserOnlineInProject = useCallback((projectId, userId) => {
    const users = projectOnlineUsers.get(projectId) || [];
    return users.some(user => user.userId === userId && user.isOnline);
  }, [projectOnlineUsers]);

  const getOnlineUsersCount = useCallback((projectId) => {
    const users = projectOnlineUsers.get(projectId) || [];
    return users.filter(user => user.isOnline).length;
  }, [projectOnlineUsers]);

  // =================================================================
  // 💬 FUNCIONES PARA CANALES
  // =================================================================

  const joinChannel = useCallback((channelId) => {
    if (socket && connected && channelId) {
      console.log('💬 SOCKET HOOK: Uniéndose al canal:', channelId);
      socket.emit('join_channel', channelId);
      setCurrentChannel(channelId);
      return true;
    }
    return false;
  }, [socket, connected]);

  const leaveChannel = useCallback((channelId) => {
    if (socket && channelId) {
      console.log('👋 SOCKET HOOK: Saliendo del canal:', channelId);
      socket.emit('leave_channel', channelId);
      
      if (currentChannel === channelId) {
        setCurrentChannel(null);
      }
      return true;
    }
    return false;
  }, [socket, currentChannel]);

  // =================================================================
  // 👥 FUNCIONES PARA GESTIÓN DE MIEMBROS
  // =================================================================

  const removeMember = useCallback((projectId, memberId, reason = '') => {
    if (socket && connected && projectId && memberId) {
      console.log('🗑️ SOCKET HOOK: Removiendo miembro:', { projectId, memberId, reason });
      socket.emit('remove_project_member', {
        projectId,
        memberIdToRemove: memberId,
        reason
      });
      return true;
    }
    return false;
  }, [socket, connected]);

  const removeUserFromChat = useCallback((projectId, userId, reason = '') => {
    if (socket && connected && projectId && userId) {
      console.log('🗑️ SOCKET HOOK: Removiendo usuario del chat:', { projectId, userId, reason });
      socket.emit('remove_user_from_chat', {
        projectId,
        userId,
        reason
      });
      return true;
    }
    return false;
  }, [socket, connected]);

  const addMemberToChannel = useCallback((channelId, memberId, projectId) => {
    if (socket && connected && channelId && memberId) {
      console.log('➕ SOCKET HOOK: Agregando miembro al canal:', { channelId, memberId });
      socket.emit('add_member_to_channel', {
        channelId,
        memberId,
        projectId
      });
      return true;
    }
    return false;
  }, [socket, connected]);

  const removeMemberFromChannel = useCallback((channelId, memberId, projectId, reason = '') => {
    if (socket && connected && channelId && memberId) {
      console.log('➖ SOCKET HOOK: Removiendo miembro del canal:', { channelId, memberId });
      socket.emit('remove_member_from_channel', {
        channelId,
        memberId,
        projectId,
        reason
      });
      return true;
    }
    return false;
  }, [socket, connected]);

  // =================================================================
  // 📨 FUNCIONES PARA MENSAJES
  // =================================================================

  const sendMessage = useCallback((projectId, channelId, message, type = 'text') => {
    if (socket && connected && channelId && message.trim()) {
      console.log('📨 SOCKET HOOK: Enviando mensaje:', { channelId, message });
      socket.emit('send_message', {
        projectId,
        channelId,
        message: message.trim(),
        type
      });
      return true;
    }
    return false;
  }, [socket, connected]);

  const deleteMessage = useCallback((projectId, channelId, messageId) => {
    if (socket && connected && channelId && messageId) {
      console.log('🗑️ SOCKET HOOK: Eliminando mensaje:', { channelId, messageId });
      socket.emit('delete_message', {
        projectId,
        channelId,
        messageId
      });
      return true;
    }
    return false;
  }, [socket, connected]);

  // =================================================================
  // 🎧 FUNCIONES GENÉRICAS DE SOCKET
  // =================================================================

  const emit = useCallback((eventName, data) => {
    if (socket && connected) {
      console.log('📡 SOCKET HOOK: Emitiendo evento:', eventName, data);
      socket.emit(eventName, data);
      return true;
    }
    console.warn('⚠️ SOCKET HOOK: No se puede emitir - Socket no conectado');
    return false;
  }, [socket, connected]);

  const on = useCallback((eventName, callback) => {
    if (socket) {
      console.log('👂 SOCKET HOOK: Registrando listener para:', eventName);
      socket.on(eventName, callback);
      return true;
    }
    return false;
  }, [socket]);

  const off = useCallback((eventName, callback) => {
    if (socket) {
      console.log('🔇 SOCKET HOOK: Removiendo listener para:', eventName);
      socket.off(eventName, callback);
      return true;
    }
    return false;
  }, [socket]);

  // =================================================================
  // 🧪 FUNCIONES DE TESTING
  // =================================================================

  const testConnection = useCallback(() => {
    if (socket && connected) {
      console.log('🧪 SOCKET HOOK: Probando conexión...');
      socket.emit('ping_test', {
        timestamp: Date.now(),
        testMessage: 'Test de conectividad desde useSocket hook',
        userId: user?.id,
        userAgent: navigator.userAgent
      });
      return true;
    }
    console.warn('⚠️ SOCKET HOOK: No se puede probar - Socket no conectado');
    return false;
  }, [socket, connected, user]);

  const getConnectionInfo = useCallback(() => {
    return {
      connected,
      reconnecting,
      connectionError,
      socketId: socket?.id || null,
      stats: connectionStats,
      currentProject,
      currentChannel,
      userProjects: Array.from(userProjects),
      projectsWithOnlineUsers: Array.from(projectOnlineUsers.keys()),
      totalOnlineUsers: Array.from(projectOnlineUsers.values()).reduce((total, users) => total + users.length, 0)
    };
  }, [connected, reconnecting, connectionError, socket, connectionStats, currentProject, currentChannel, userProjects, projectOnlineUsers]);

  // =================================================================
  // 🔄 FUNCIONES DE RECONEXIÓN MANUAL
  // =================================================================

  const forceReconnect = useCallback(() => {
    if (socket) {
      console.log('🔄 SOCKET HOOK: Forzando reconexión...');
      socket.disconnect();
      socket.connect();
      return true;
    }
    return false;
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      console.log('🔌 SOCKET HOOK: Desconectando manualmente...');
      socket.disconnect();
      return true;
    }
    return false;
  }, [socket]);

  // =================================================================
  // 📊 RETURN DEL HOOK
  // =================================================================

  return {
    // Estados básicos
    socket,
    connected,
    reconnecting,
    connectionError,
    
    // Estados de tracking
    currentProject,
    currentChannel,
    userProjects,
    
    // Funciones para proyectos
    joinProject,
    leaveProject,
    requestProjectOnlineUsers,
    getProjectOnlineUsers,
    isUserOnlineInProject,
    getOnlineUsersCount,
    
    // Funciones para canales
    joinChannel,
    leaveChannel,
    
    // Funciones para gestión de miembros
    removeMember,
    removeUserFromChat,
    addMemberToChannel,
    removeMemberFromChannel,
    
    // Funciones para mensajes
    sendMessage,
    deleteMessage,
    
    // Funciones genéricas de socket
    emit,
    on,
    off,
    
    // Funciones de utilidad
    testConnection,
    getConnectionInfo,
    forceReconnect,
    disconnect,
    
    // Estadísticas
    connectionStats
  };
};

export default useSocket;