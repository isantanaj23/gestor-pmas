// // client/src/hooks/useSocket.js
// import { useEffect, useRef, useCallback } from 'react';
// import { io } from 'socket.io-client';
// import { useAuth } from '../context/AuthContext';

// const useSocket = () => {
//   const { user, token } = useAuth();
//   const socketRef = useRef(null);
//   const listenersRef = useRef(new Map());

//   // Conectar socket cuando hay usuario autenticado
//   useEffect(() => {
//     if (user && token) {
//       console.log('🔌 Conectando socket...');
      
//       socketRef.current = io('http://localhost:3001', {
//         auth: {
//           token: token
//         },
//         transports: ['websocket', 'polling']
//       });

//       const socket = socketRef.current;

//       // Event listeners de conexión
//       socket.on('connect', () => {
//         console.log('✅ Socket conectado:', socket.id);
//       });

//       socket.on('disconnect', (reason) => {
//         console.log('❌ Socket desconectado:', reason);
//       });

//       socket.on('connect_error', (error) => {
//         console.error('🚨 Error de conexión socket:', error.message);
//       });

//       return () => {
//         console.log('🔌 Desconectando socket...');
//         socket.disconnect();
//         socketRef.current = null;
//       };
//     }
//   }, [user, token]);

//   // Función para agregar listener
//   const on = useCallback((event, callback) => {
//     if (socketRef.current) {
//       socketRef.current.on(event, callback);
      
//       // Guardar referencia para cleanup
//       if (!listenersRef.current.has(event)) {
//         listenersRef.current.set(event, []);
//       }
//       listenersRef.current.get(event).push(callback);
//     }
//   }, []);

//   // Función para remover listener
//   const off = useCallback((event, callback) => {
//     if (socketRef.current) {
//       socketRef.current.off(event, callback);
      
//       // Remover de referencia
//       const listeners = listenersRef.current.get(event);
//       if (listeners) {
//         const index = listeners.indexOf(callback);
//         if (index > -1) {
//           listeners.splice(index, 1);
//         }
//       }
//     }
//   }, []);

//   // Función para emitir eventos
//   const emit = useCallback((event, data) => {
//     if (socketRef.current && socketRef.current.connected) {
//       socketRef.current.emit(event, data);
//       console.log(`📤 Socket emit: ${event}`, data);
//     } else {
//       console.warn('⚠️ Socket no está conectado, no se puede emitir:', event);
//     }
//   }, []);

//   // Funciones de conveniencia
//   const joinProject = useCallback((projectId) => {
//     emit('join_project', projectId);
//   }, [emit]);

//   const leaveProject = useCallback((projectId) => {
//     emit('leave_project', projectId);
//   }, [emit]);

//   const updateTask = useCallback((projectId, taskId, update, action = 'updated') => {
//     emit('task_update', {
//       projectId,
//       taskId,
//       update,
//       action
//     });
//   }, [emit]);

//   const newComment = useCallback((projectId, taskId, comment) => {
//     emit('new_comment', {
//       projectId,
//       taskId,
//       comment
//     });
//   }, [emit]);

//   const updateProject = useCallback((projectId, update, action = 'updated') => {
//     emit('project_update', {
//       projectId,
//       update,
//       action
//     });
//   }, [emit]);

//   const updateContact = useCallback((contactId, update, action = 'updated') => {
//     emit('contact_update', {
//       contactId,
//       update,
//       action
//     });
//   }, [emit]);

//   // Cleanup al desmontar
//   useEffect(() => {
//     return () => {
//       // Limpiar todos los listeners registrados
//       for (const [event, callbacks] of listenersRef.current) {
//         callbacks.forEach(callback => {
//           if (socketRef.current) {
//             socketRef.current.off(event, callback);
//           }
//         });
//       }
//       listenersRef.current.clear();
//     };
//   }, []);

//   return {
//     socket: socketRef.current,
//     connected: socketRef.current?.connected || false,
//     on,
//     off,
//     emit,
//     joinProject,
//     leaveProject,
//     updateTask,
//     newComment,
//     updateProject,
//     updateContact
//   };
// };

// export default useSocket;

// client/src/hooks/useSocket.js - MOCK TEMPORAL (sin funcionalidad)

import { useState } from 'react';

const useSocket = () => {
  const [connected, setConnected] = useState(false);

  // Funciones mock que no hacen nada
  const joinProject = (projectId) => {
    console.log('🔇 Socket deshabilitado - joinProject:', projectId);
  };

  const leaveProject = (projectId) => {
    console.log('🔇 Socket deshabilitado - leaveProject:', projectId);
  };

  const updateTask = (projectId, taskId, update, action) => {
    console.log('🔇 Socket deshabilitado - updateTask:', { projectId, taskId, update, action });
  };

  const newComment = (taskId, comment) => {
    console.log('🔇 Socket deshabilitado - newComment:', { taskId, comment });
  };

  const on = (event, callback) => {
    console.log('🔇 Socket deshabilitado - on:', event);
  };

  const off = (event, callback) => {
    console.log('🔇 Socket deshabilitado - off:', event);
  };

  return {
    connected,
    joinProject,
    leaveProject,
    updateTask,
    newComment,
    on,
    off
  };
};

export default useSocket;