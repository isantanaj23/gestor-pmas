// server/socket/socketHandler.js - VERSIÓN CORREGIDA

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketHandler {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // userId -> socket instance
    this.projectUsers = new Map(); // projectId -> Set of userIds
    this.channelRooms = new Map(); // channelId -> Set of socketIds
    
    // 🆕 Mapa para rastrear qué usuarios están en qué canales específicos
    this.userChannels = new Map(); // userId -> currentChannelId
    
    this.setupMiddleware();
    this.setupEventHandlers();
    
    // Hacer disponible globalmente
    global.socketHandler = this;
    
    console.log('🚀 CHAT SOCKET: Socket.io inicializado con mejoras de tiempo real');
  }

  // Middleware de autenticación
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          console.log('❌ CHAT SOCKET: No token provided');
          return next(new Error('No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        socket.userId = decoded.id;
        socket.user = {
          id: decoded.id,
          name: decoded.name || 'Usuario',
          email: decoded.email || 'user@test.com'
        };
        
        console.log('✅ CHAT SOCKET: Usuario autenticado:', socket.user.name, '(', socket.userId, ')');
        next();
        
      } catch (error) {
        console.log('❌ CHAT SOCKET: Error de autenticación:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  // Configurar event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 CHAT SOCKET: Usuario conectado:', socket.user.name, '(', socket.id, ')');
      
      // Registrar usuario conectado
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.userId, socket);
      
      // Unirse a sala personal
      socket.join(`user_${socket.userId}`);
      console.log('👤 CHAT SOCKET: Usuario unido a sala personal:', `user_${socket.userId}`);

      // =================================================================
      // 🆕 EVENTOS PARA ROOMS DE PROYECTO (MEJORADOS)
      // =================================================================
      
      // Unirse a un proyecto
      socket.on('join_project', (projectId) => {
        console.log('🏠 CHAT SOCKET: Usuario', socket.user.name, 'uniéndose al proyecto:', projectId);
        
        const roomName = `project_${projectId}`;
        socket.join(roomName);
        socket.currentProject = projectId;
        
        // Registrar en el mapa de proyectos
        if (!this.projectUsers.has(projectId)) {
          this.projectUsers.set(projectId, new Set());
        }
        this.projectUsers.get(projectId).add(socket.userId);
        
        console.log('✅ CHAT SOCKET: Usuario unido al proyecto:', roomName);
        console.log('👥 CHAT SOCKET: Usuarios en proyecto', projectId, ':', this.projectUsers.get(projectId).size);
        
        // 🔥 EMITIR CONFIRMACIÓN AL USUARIO
        socket.emit('project_joined', {
          projectId,
          success: true,
          usersCount: this.projectUsers.get(projectId).size
        });
      });

      // Salir de un proyecto
      socket.on('leave_project', (projectId) => {
        console.log('🚪 CHAT SOCKET: Usuario', socket.user.name, 'saliendo del proyecto:', projectId);
        
        const roomName = `project_${projectId}`;
        socket.leave(roomName);
        
        // Remover del mapa de proyectos
        if (this.projectUsers.has(projectId)) {
          this.projectUsers.get(projectId).delete(socket.userId);
        }
        
        // Limpiar canal actual si está en este proyecto
        if (socket.currentProject === projectId) {
          socket.currentProject = null;
          this.userChannels.delete(socket.userId);
        }
      });

      // 🔥 UNIRSE A UN CANAL ESPECÍFICO (MEJORADO)
      socket.on('join_channel', (channelId) => {
        console.log('💬 CHAT SOCKET: Usuario', socket.user.name, 'uniéndose al canal:', channelId);
        
        // Salir del canal anterior si existe
        const previousChannel = this.userChannels.get(socket.userId);
        if (previousChannel && previousChannel !== channelId) {
          const prevRoomName = `channel_${previousChannel}`;
          socket.leave(prevRoomName);
          console.log('👋 CHAT SOCKET: Usuario salió del canal anterior:', previousChannel);
          
          // Limpiar del mapa de canales
          if (this.channelRooms.has(previousChannel)) {
            this.channelRooms.get(previousChannel).delete(socket.id);
          }
        }
        
        const roomName = `channel_${channelId}`;
        socket.join(roomName);
        socket.currentChannel = channelId;
        
        // Actualizar mapas
        this.userChannels.set(socket.userId, channelId);
        
        if (!this.channelRooms.has(channelId)) {
          this.channelRooms.set(channelId, new Set());
        }
        this.channelRooms.get(channelId).add(socket.id);
        
        console.log('✅ CHAT SOCKET: Usuario unido al canal:', roomName);
        console.log('👥 CHAT SOCKET: Usuarios en canal', channelId, ':', this.channelRooms.get(channelId).size);
        
        // 🔥 EMITIR CONFIRMACIÓN AL USUARIO
        socket.emit('channel_joined', {
          channelId,
          success: true,
          usersCount: this.channelRooms.get(channelId).size
        });
        
        // Notificar a otros en el canal
        socket.to(roomName).emit('user_joined_channel', {
          channelId,
          user: socket.user,
          timestamp: new Date()
        });
      });

      // Salir de un canal específico
      socket.on('leave_channel', (channelId) => {
        console.log('👋 CHAT SOCKET: Usuario', socket.user.name, 'saliendo del canal:', channelId);
        
        const roomName = `channel_${channelId}`;
        socket.leave(roomName);
        
        // Limpiar mapas
        this.userChannels.delete(socket.userId);
        if (this.channelRooms.has(channelId)) {
          this.channelRooms.get(channelId).delete(socket.id);
        }
        
        // Notificar a otros en el canal
        socket.to(roomName).emit('user_left_channel', {
          channelId,
          user: socket.user,
          timestamp: new Date()
        });
      });

      // Test de conectividad
      socket.on('ping_test', (data) => {
        console.log('🏓 CHAT SOCKET: Ping recibido de', socket.user.name, ':', data);
        socket.emit('pong_test', {
          message: 'Pong desde servidor',
          timestamp: new Date(),
          originalData: data,
          userConnected: true,
          rooms: Array.from(socket.rooms)
        });
      });

      // Desconexión
      socket.on('disconnect', (reason) => {
        console.log('🔌 CHAT SOCKET: Usuario desconectado:', socket.user?.name, '(', reason, ')');
        
        // Limpiar registros
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.userSockets.delete(socket.userId);
          this.userChannels.delete(socket.userId);
          
          // Limpiar de todos los proyectos
          for (const [projectId, userIds] of this.projectUsers.entries()) {
            userIds.delete(socket.userId);
          }
          
          // Limpiar de todos los canales
          for (const [channelId, socketIds] of this.channelRooms.entries()) {
            socketIds.delete(socket.id);
          }
        }
      });
    });
  }

  // =================================================================
  // 🆕 MÉTODOS MEJORADOS PARA EMITIR EVENTOS
  // =================================================================

  // 🔥 EMITIR NUEVO MENSAJE CON LÓGICA MEJORADA
  emitNewMessage(channelId, message, channelName = null) {
    if (!channelId || !message) {
      console.log('❌ CHAT SOCKET: Datos de mensaje incompletos');
      return;
    }

    const channelRoom = `channel_${channelId}`;
    const usersInChannelRoom = this.channelRooms.get(channelId)?.size || 0;
    const projectId = message.project;
    
    console.log('📢 CHAT SOCKET: Emitiendo nuevo mensaje');
    console.log('📁 CHAT SOCKET: Canal:', channelId, 'nombre:', channelName);
    console.log('🏠 CHAT SOCKET: Proyecto:', projectId);
    console.log('👥 CHAT SOCKET: Usuarios en canal room:', usersInChannelRoom);
    console.log('💬 CHAT SOCKET: De:', message.sender?.name, '-', message.content?.substring(0, 50));
    
    // 1. 🔥 EMITIR A NIVEL DE PROYECTO (PARA NOTIFICACIONES GLOBALES)
    if (projectId) {
      const projectRoom = `project_${projectId}`;
      const usersInProject = this.projectUsers.get(projectId)?.size || 0;
      
      console.log('📡 CHAT SOCKET: Emitiendo a proyecto:', projectRoom, 'usuarios:', usersInProject);
      
      this.io.to(projectRoom).emit('new_message_global', {
        channelId,
        channelName: channelName || 'Canal desconocido',
        message: {
          ...message,
          _id: message._id || message.id,
          content: message.content,
          sender: message.sender,
          createdAt: message.createdAt || message.timestamp || new Date(),
          channel: channelId
        },
        timestamp: new Date(),
        projectId
      });
      
      console.log('✅ CHAT SOCKET: Mensaje emitido a nivel de proyecto');
    }
    
    // 2. 🔥 EMITIR A NIVEL DE CANAL ESPECÍFICO (PARA COMPATIBILIDAD)
    this.io.to(channelRoom).emit('new_message', {
      channelId,
      channelName: channelName || 'Canal desconocido',
      message: {
        ...message,
        _id: message._id || message.id,
        content: message.content,
        sender: message.sender,
        createdAt: message.createdAt || message.timestamp || new Date(),
        channel: channelId
      },
      timestamp: new Date()
    });
    
    console.log('✅ CHAT SOCKET: Mensaje emitido a nivel de canal');
    
    // 3. 🔥 LOG DETALLADO PARA DEBUG
    console.log('📊 CHAT SOCKET: Estadísticas de emisión:');
    console.log('   - Canal room:', channelRoom, 'usuarios:', usersInChannelRoom);
    if (projectId) {
      console.log('   - Proyecto room:', `project_${projectId}`, 'usuarios:', this.projectUsers.get(projectId)?.size || 0);
    }
  }

  // 🆕 Emitir a todos los usuarios de un proyecto (mejorado)
  emitToProject(projectId, eventName, data) {
    if (!projectId) {
      console.log('❌ CHAT SOCKET: ProjectId no proporcionado para emitir');
      return;
    }
    
    const roomName = `project_${projectId}`;
    const usersInProject = this.projectUsers.get(projectId)?.size || 0;
    
    console.log('📡 CHAT SOCKET: Emitiendo a proyecto:', projectId, 'evento:', eventName);
    console.log('👥 CHAT SOCKET: Usuarios en proyecto:', usersInProject);
    
    this.io.to(roomName).emit(eventName, {
      projectId,
      ...data,
      timestamp: new Date()
    });
    
    console.log('✅ CHAT SOCKET: Evento', eventName, 'emitido a proyecto');
  }

  // Emitir nuevo canal creado (mejorado)
  emitChannelCreated(projectId, channel) {
    console.log('📢 CHAT SOCKET: Emitiendo nuevo canal para proyecto:', projectId);
    console.log('📁 CHAT SOCKET: Canal:', channel.name, '(', channel._id, ')');
    
    // Emitir a todos los usuarios del proyecto
    this.emitToProject(projectId, 'channel_created', {
      channel,
      channelName: channel.name
    });
    
    console.log('✅ CHAT SOCKET: Canal creado emitido a proyecto');
  }

  // Método de test mejorado
  testEmit(channelId, testData) {
    const channelRoom = `channel_${channelId}`;
    const usersInRoom = this.channelRooms.get(channelId)?.size || 0;
    
    console.log('🧪 CHAT SOCKET: Test emit a canal:', channelId, channelRoom);
    console.log('👥 CHAT SOCKET: Usuarios en room para test:', usersInRoom);
    
    this.io.to(channelRoom).emit('test_message', {
      channelId,
      data: testData,
      timestamp: new Date(),
      room: channelRoom,
      usersInRoom,
      testId: Date.now()
    });
    
    console.log('✅ CHAT SOCKET: Test emit enviado');
  }

  // 🔥 MÉTODO PARA VERIFICAR ESTADO DE ROOMS
  getRoomInfo(roomId) {
    const room = this.io.sockets.adapter.rooms.get(roomId);
    const socketsInRoom = room ? Array.from(room) : [];
    
    return {
      roomId,
      exists: !!room,
      socketCount: socketsInRoom.length,
      sockets: socketsInRoom
    };
  }

  // 🔥 OBTENER ESTADÍSTICAS MEJORADAS
  getStats() {
    const totalRooms = this.io.sockets.adapter.rooms.size;
    const totalSockets = this.io.sockets.sockets.size;
    
    const stats = {
      connectedUsers: this.connectedUsers.size,
      totalSockets,
      totalRooms,
      projectUsers: Array.from(this.projectUsers.entries()).map(([projectId, userIds]) => ({
        projectId,
        userCount: userIds.size,
        userIds: Array.from(userIds),
        roomInfo: this.getRoomInfo(`project_${projectId}`)
      })),
      channelRooms: Array.from(this.channelRooms.entries()).map(([channelId, socketIds]) => ({
        channelId,
        userCount: socketIds.size,
        socketIds: Array.from(socketIds),
        roomInfo: this.getRoomInfo(`channel_${channelId}`)
      })),
      userChannels: Array.from(this.userChannels.entries()).map(([userId, channelId]) => ({
        userId,
        currentChannel: channelId
      }))
    };
    
    console.log('📊 CHAT SOCKET: Estadísticas completas:', stats);
    return stats;
  }

  // Verificar si un usuario está conectado
  isUserConnected(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  // 🔥 MÉTODO PARA FORCE JOIN A UN USUARIO A UN CANAL (DEBUGGING)
  forceJoinUserToChannel(userId, channelId) {
    const socket = this.userSockets.get(userId);
    if (socket) {
      console.log('🔧 CHAT SOCKET: Force joining user', userId, 'to channel', channelId);
      socket.emit('join_channel', channelId);
      return true;
    }
    return false;
  }

  // 🔥 MÉTODO PARA OBTENER USUARIOS EN UN CANAL
  getUsersInChannel(channelId) {
    const socketIds = this.channelRooms.get(channelId);
    if (!socketIds) return [];
    
    const users = [];
    for (const socketId of socketIds) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.user) {
        users.push(socket.user);
      }
    }
    
    return users;
  }

  // 🔥 MÉTODO PARA BROADCAST A TODOS LOS USUARIOS CONECTADOS
  broadcastToAll(eventName, data) {
    console.log('📢 CHAT SOCKET: Broadcasting a todos los usuarios:', eventName);
    this.io.emit(eventName, {
      ...data,
      timestamp: new Date(),
      totalUsers: this.connectedUsers.size
    });
  }
}

module.exports = SocketHandler;