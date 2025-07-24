// client/src/hooks/useSocket.js - VERSIÓN SIMPLE QUE FUNCIONA
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const useSocket = () => {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  // Conectar socket cuando hay usuario autenticado
  useEffect(() => {
    // No hacer nada si aún está cargando
    if (isLoading) {
      console.log('⏳ AuthContext aún cargando, esperando...');
      return;
    }

    if (isAuthenticated && token && user) {
      console.log('✅ Usuario autenticado, conectando socket...');
      console.log('👤 Usuario:', user.name || user.email);
      
      // Limpiar conexión previa
      if (socketRef.current) {
        console.log('🔄 Cerrando conexión previa...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Crear nueva conexión
      console.log('🌐 Creando socket con configuración simple...');
      socketRef.current = io('http://localhost:3001', {
        auth: { token },
        transports: ['polling'], // Solo HTTP polling
        timeout: 10000,
        forceNew: true
      });

      const socket = socketRef.current;

      // Event listeners básicos
      socket.on('connect', () => {
        console.log('🎉 ¡SOCKET CONECTADO!');
        console.log('🆔 ID:', socket.id);
        console.log('👤 Usuario:', user.name);
        
        // Solicitar contador de notificaciones
        socket.emit('request_notification_count');
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket desconectado:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('🚨 Error de conexión:', error.message);
      });

      // Listeners de notificaciones
      socket.on('new_notification', (notification) => {
        console.log('🔔 Nueva notificación:', notification);
      });

      socket.on('notification_count_updated', (data) => {
        console.log('📊 Contador actualizado:', data.count);
      });

      return () => {
        console.log('🧹 Limpiando socket...');
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } else {
      console.log('❌ No autenticado, no conectando socket');
      console.log('   isAuthenticated:', isAuthenticated);
      console.log('   hasToken:', !!token);
      console.log('   hasUser:', !!user);
      
      // Desconectar si existe
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [isAuthenticated, token, user, isLoading]);

  // Función para agregar listener
  const on = useCallback((event, callback) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log(`🎧 Agregando listener: ${event}`);
      socketRef.current.on(event, callback);
      
      // Guardar referencia
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, []);
      }
      listenersRef.current.get(event).push(callback);
    } else {
      console.log(`⏳ Socket no listo, listener diferido: ${event}`);
      // Agregar cuando se conecte
      if (socketRef.current) {
        socketRef.current.on('connect', () => {
          socketRef.current.on(event, callback);
        });
      }
    }
  }, []);

  // Función para remover listener
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
      
      const listeners = listenersRef.current.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }, []);

  // Función para emitir eventos
  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
      console.log(`📤 Emit exitoso: ${event}`);
      return true;
    } else {
      console.log(`⏳ Socket no listo, emit diferido: ${event}`);
      // Emitir cuando se conecte
      if (socketRef.current) {
        socketRef.current.on('connect', () => {
          socketRef.current.emit(event, data);
          console.log(`📤 Emit diferido exitoso: ${event}`);
        });
      }
      return false;
    }
  }, []);

  // Funciones de conveniencia
  const joinProject = useCallback((projectId) => {
    console.log(`👥 Uniéndose al proyecto: ${projectId}`);
    return emit('join_project', projectId);
  }, [emit]);

  const leaveProject = useCallback((projectId) => {
    return emit('leave_project', projectId);
  }, [emit]);

  const updateTask = useCallback((projectId, taskId, update, action = 'updated') => {
    return emit('task_update', { projectId, taskId, update, action });
  }, [emit]);

  const newComment = useCallback((projectId, taskId, comment) => {
    return emit('new_comment', { projectId, taskId, comment });
  }, [emit]);

  const updateProject = useCallback((projectId, update, action = 'updated') => {
    return emit('project_update', { projectId, update, action });
  }, [emit]);

  const updateContact = useCallback((contactId, update, action = 'updated') => {
    return emit('contact_update', { contactId, update, action });
  }, [emit]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      const currentListeners = listenersRef.current;
      const currentSocket = socketRef.current;
      
      for (const [event, callbacks] of currentListeners) {
        callbacks.forEach(callback => {
          if (currentSocket) {
            currentSocket.off(event, callback);
          }
        });
      }
      currentListeners.clear();
    };
  }, []);

  return {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    on,
    off,
    emit,
    joinProject,
    leaveProject,
    updateTask,
    newComment,
    updateProject,
    updateContact
  };
};

export default useSocket;