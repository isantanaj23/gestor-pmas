// server/socket/socketHandler.js - VERSIÓN CORREGIDA FINAL

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
    this.userProjects = new Map(); // userId -> Set of projectIds
    this.channelRooms = new Map(); // channelId -> Set of socketIds
    
    // 🆕 Mapa para rastrear qué usuarios están en qué canales específicos
    this.userChannels = new Map(); // userId -> currentChannelId
    
    this.setupMiddleware();
    this.setupEventHandlers();
    
    // Hacer disponible globalmente
    global.socketHandler = this;
    
    console.log('🚀 SOCKET HANDLER: Inicializado correctamente con todos los métodos');
  }

  // Middleware de autenticación
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          console.log('❌ SOCKET: No token provided');
          return next(new Error('No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuario en la base de datos para tener datos completos
        const User = require('../models/User');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        };
        
        console.log('✅ SOCKET: Usuario autenticado:', socket.user.name, '(', socket.userId, ')');
        next();
        
      } catch (error) {
        console.log('❌ SOCKET: Error de autenticación:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  // Configurar event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 SOCKET: Usuario conectado:', socket.user.name, '(', socket.id, ')');
      
      // Registrar usuario conectado
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.userId, socket);
      
      // Unirse a sala personal
      socket.join(`user_${socket.userId}`);
      console.log('👤 SOCKET: Usuario unido a sala personal:', `user_${socket.userId}`);

      // =================================================================
      // 🆕 EVENTOS PARA PROYECTOS CON USUARIOS EN LÍNEA
      // =================================================================
      
      // Unirse a un proyecto
      socket.on('join_project', async (projectId) => {
        console.log('🏠 SOCKET: Usuario', socket.user.name, 'uniéndose al proyecto:', projectId);
        
        const roomName = `project_${projectId}`;
        socket.join(roomName);
        socket.currentProject = projectId;
        
        // Registrar en el mapa de proyectos
        if (!this.projectUsers.has(projectId)) {
          this.projectUsers.set(projectId, new Set());
        }
        this.projectUsers.get(projectId).add(socket.userId);
        
        // Registrar proyectos del usuario
        if (!this.userProjects.has(socket.userId)) {
          this.userProjects.set(socket.userId, new Set());
        }
        this.userProjects.get(socket.userId).add(projectId);
        
        console.log('✅ SOCKET: Usuario unido al proyecto:', roomName);
        console.log('👥 SOCKET: Usuarios en proyecto', projectId, ':', this.projectUsers.get(projectId).size);
        
        // 🔥 NOTIFICAR A OTROS USUARIOS QUE ALGUIEN SE CONECTÓ
        socket.to(roomName).emit('user_joined_project', {
          projectId,
          userId: socket.userId,
          userName: socket.user.name,
          userAvatar: socket.user.avatar,
          timestamp: new Date()
        });
        
        // 🔥 ENVIAR LISTA ACTUALIZADA DE USUARIOS EN LÍNEA
        const onlineUsers = this.getProjectOnlineUsers(projectId);
        this.io.to(roomName).emit('project_online_users', {
          projectId,
          users: onlineUsers
        });
        
        // 🔥 EMITIR CONFIRMACIÓN AL USUARIO
        socket.emit('project_joined', {
          projectId,
          success: true,
          usersCount: this.projectUsers.get(projectId).size,
          onlineUsers: onlineUsers
        });
      });

      // Salir de un proyecto
      socket.on('leave_project', (projectId) => {
        console.log('🚪 SOCKET: Usuario', socket.user.name, 'saliendo del proyecto:', projectId);
        
        this.handleLeaveProject(socket, projectId);
      });

      // 🆕 Solicitar usuarios en línea de un proyecto
      socket.on('request_project_online_users', (projectId) => {
        console.log('👥 SOCKET: Solicitando usuarios en línea del proyecto:', projectId);
        
        const onlineUsers = this.getProjectOnlineUsers(projectId);
        socket.emit('project_online_users', {
          projectId,
          users: onlineUsers
        });
      });

      // 🆕 Remover miembro del proyecto
      socket.on('remove_project_member', async (data) => {
        await this.handleRemoveProjectMember(socket, data);
      });

      // =================================================================
      // EVENTOS PARA CANALES (EXISTENTES MEJORADOS)
      // =================================================================
      
      // Unirse a un canal específico
      socket.on('join_channel', (channelId) => {
        console.log('💬 SOCKET: Usuario', socket.user.name, 'uniéndose al canal:', channelId);
        
        // Salir del canal anterior si existe
        const previousChannel = this.userChannels.get(socket.userId);
        if (previousChannel && previousChannel !== channelId) {
          const prevRoomName = `channel_${previousChannel}`;
          socket.leave(prevRoomName);
          console.log('👋 SOCKET: Usuario salió del canal anterior:', previousChannel);
          
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
        
        console.log('✅ SOCKET: Usuario unido al canal:', roomName);
        console.log('👥 SOCKET: Usuarios en canal', channelId, ':', this.channelRooms.get(channelId).size);
        
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
        console.log('👋 SOCKET: Usuario', socket.user.name, 'saliendo del canal:', channelId);
        
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
        console.log('🏓 SOCKET: Ping recibido de', socket.user.name, ':', data);
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
        console.log('🔌 SOCKET: Usuario desconectado:', socket.user?.name, '(', reason, ')');
        this.handleUserDisconnect(socket);
      });
    });
  }

  // =================================================================
  // 🆕 MÉTODOS PARA GESTIÓN DE USUARIOS EN LÍNEA
  // =================================================================

  // Obtener lista de usuarios en línea de un proyecto
  getProjectOnlineUsers(projectId) {
    const projectUsersSet = this.projectUsers.get(projectId);
    if (!projectUsersSet) return [];

    const onlineUsers = [];
    for (const userId of projectUsersSet) {
      const socket = this.userSockets.get(userId);
      if (socket && socket.connected) {
        onlineUsers.push({
          userId: userId,
          userName: socket.user.name,
          userEmail: socket.user.email,
          userAvatar: socket.user.avatar,
          userRole: socket.user.role,
          connectedAt: new Date(),
          isOnline: true
        });
      }
    }

    console.log('👥 SOCKET: Usuarios en línea en proyecto', projectId, ':', onlineUsers.length);
    return onlineUsers;
  }

  // Manejar salida de proyecto
  handleLeaveProject(socket, projectId) {
    const roomName = `project_${projectId}`;
    socket.leave(roomName);
    
    // Remover de tracking
    const projectUsersSet = this.projectUsers.get(projectId);
    if (projectUsersSet) {
      projectUsersSet.delete(socket.userId);
      if (projectUsersSet.size === 0) {
        this.projectUsers.delete(projectId);
      }
    }

    const userProjectsSet = this.userProjects.get(socket.userId);
    if (userProjectsSet) {
      userProjectsSet.delete(projectId);
    }

    // Limpiar canal actual si está en este proyecto
    if (socket.currentProject === projectId) {
      socket.currentProject = null;
      this.userChannels.delete(socket.userId);
    }

    // Notificar salida a otros usuarios
    socket.to(roomName).emit('user_left_project', {
      projectId,
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date()
    });

    // Enviar lista actualizada de usuarios en línea
    const onlineUsers = this.getProjectOnlineUsers(projectId);
    this.io.to(roomName).emit('project_online_users', {
      projectId,
      users: onlineUsers
    });
  }

  // 🆕 Remover miembro del proyecto via Socket.IO
  async handleRemoveProjectMember(socket, data) {
    const { projectId, memberIdToRemove, reason } = data;
    
    try {
      console.log('🚫 SOCKET: Removiendo miembro:', { projectId, memberIdToRemove, removedBy: socket.userId });

      // Verificar permisos (debes implementar esta lógica)
      const Project = require('../models/Project');
      const project = await Project.findById(projectId);
      
      if (!project) {
        socket.emit('error', { message: 'Proyecto no encontrado' });
        return;
      }

      // Verificar si el usuario es owner del proyecto
      const isOwner = project.owner.toString() === socket.userId;

      if (!isOwner) {
        socket.emit('error', { message: 'No tienes permisos para remover miembros' });
        return;
      }

      // No se puede remover al owner
      if (project.owner.toString() === memberIdToRemove) {
        socket.emit('error', { message: 'No se puede remover al propietario del proyecto' });
        return;
      }

      // Remover miembro del proyecto (actualizar base de datos)
      project.team = project.team.filter(member => member.user.toString() !== memberIdToRemove);
      await project.save();

      // Si el usuario está conectado, expulsarlo del proyecto
      const memberSocket = this.userSockets.get(memberIdToRemove);
      if (memberSocket) {
        this.handleLeaveProject(memberSocket, projectId);
        
        // Notificar al usuario que fue removido
        memberSocket.emit('removed_from_project', {
          projectId,
          projectName: project.name,
          removedBy: socket.user.name,
          reason: reason || 'Sin razón especificada'
        });
      }

      // Actualizar tracking
      const projectUsersSet = this.projectUsers.get(projectId);
      if (projectUsersSet) {
        projectUsersSet.delete(memberIdToRemove);
      }

      const userProjectsSet = this.userProjects.get(memberIdToRemove);
      if (userProjectsSet) {
        userProjectsSet.delete(projectId);
      }

      // Notificar a todos los miembros del proyecto
      this.io.to(`project_${projectId}`).emit('member_removed', {
        projectId,
        removedMemberId: memberIdToRemove,
        removedBy: {
          _id: socket.userId,
          name: socket.user.name
        },
        reason: reason || 'Sin razón especificada',
        timestamp: new Date()
      });

      // Enviar lista actualizada de usuarios en línea
      const onlineUsers = this.getProjectOnlineUsers(projectId);
      this.io.to(`project_${projectId}`).emit('project_online_users', {
        projectId,
        users: onlineUsers
      });

      console.log('✅ SOCKET: Miembro removido exitosamente');

    } catch (error) {
      console.error('❌ SOCKET: Error removiendo miembro:', error);
      socket.emit('error', { message: 'Error al remover miembro del proyecto' });
    }
  }

  // Manejar desconexión de usuario
  handleUserDisconnect(socket) {
    // Remover de usuarios conectados
    this.connectedUsers.delete(socket.userId);
    this.userSockets.delete(socket.userId);

    // Notificar a todos los proyectos donde estaba el usuario
    const userProjectsSet = this.userProjects.get(socket.userId);
    if (userProjectsSet) {
      for (const projectId of userProjectsSet) {
        // Remover de tracking del proyecto
        const projectUsersSet = this.projectUsers.get(projectId);
        if (projectUsersSet) {
          projectUsersSet.delete(socket.userId);
        }

        // Notificar desconexión
        socket.to(`project_${projectId}`).emit('user_left_project', {
          projectId,
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date()
        });

        // Enviar lista actualizada
        const onlineUsers = this.getProjectOnlineUsers(projectId);
        this.io.to(`project_${projectId}`).emit('project_online_users', {
          projectId,
          users: onlineUsers
        });
      }
    }

    // Limpiar tracking del usuario
    this.userProjects.delete(socket.userId);
    this.userChannels.delete(socket.userId);
    
    // Limpiar de todos los canales
    for (const [channelId, socketIds] of this.channelRooms.entries()) {
      socketIds.delete(socket.id);
    }
  }

  // =================================================================
  // 🔥 MÉTODOS PRINCIPALES PARA EMISIÓN DE MENSAJES
  // =================================================================

  // 🔥 EMITIR NUEVO MENSAJE CON LÓGICA MEJORADA
  emitNewMessage(channelId, message, channelName = null) {
    if (!channelId || !message) {
      console.log('❌ SOCKET: Datos de mensaje incompletos para emitNewMessage');
      return false;
    }

    try {
      const channelRoom = `channel_${channelId}`;
      const usersInChannelRoom = this.channelRooms.get(channelId)?.size || 0;
      const projectId = message.project;
      
      console.log('📢 SOCKET: Emitiendo nuevo mensaje');
      console.log('📁 SOCKET: Canal:', channelId, 'nombre:', channelName);
      console.log('🏠 SOCKET: Proyecto:', projectId);
      console.log('👥 SOCKET: Usuarios en canal room:', usersInChannelRoom);
      console.log('💬 SOCKET: De:', message.sender?.name, '-', message.content?.substring(0, 50));
      
      // 1. 🔥 EMITIR A NIVEL DE PROYECTO (PARA NOTIFICACIONES GLOBALES)
      if (projectId) {
        const projectRoom = `project_${projectId}`;
        const usersInProject = this.projectUsers.get(projectId)?.size || 0;
        
        console.log('📡 SOCKET: Emitiendo a proyecto:', projectRoom, 'usuarios:', usersInProject);
        
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
        
        console.log('✅ SOCKET: Mensaje emitido a nivel de proyecto');
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
      
      console.log('✅ SOCKET: Mensaje emitido a nivel de canal exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ SOCKET: Error en emitNewMessage:', error);
      return false;
    }
  }

  // 🆕 Emitir a todos los usuarios de un proyecto (mejorado)
  emitToProject(projectId, eventName, data) {
    if (!projectId) {
      console.log('❌ SOCKET: ProjectId no proporcionado para emitToProject');
      return false;
    }
    
    try {
      const roomName = `project_${projectId}`;
      const usersInProject = this.projectUsers.get(projectId)?.size || 0;
      
      console.log('📡 SOCKET: Emitiendo a proyecto:', projectId, 'evento:', eventName);
      console.log('👥 SOCKET: Usuarios en proyecto:', usersInProject);
      
      this.io.to(roomName).emit(eventName, {
        projectId,
        ...data,
        timestamp: new Date()
      });
      
      console.log('✅ SOCKET: Evento', eventName, 'emitido a proyecto exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ SOCKET: Error en emitToProject:', error);
      return false;
    }
  }

  // Emitir a un usuario específico
  emitToUser(userId, eventName, data) {
    try {
      const socket = this.userSockets.get(userId);
      if (socket && socket.connected) {
        console.log('📤 SOCKET: Emitiendo a usuario:', userId, 'evento:', eventName);
        socket.emit(eventName, data);
        return true;
      }
      console.log('❌ SOCKET: Usuario no conectado para emitToUser:', userId);
      return false;
    } catch (error) {
      console.error('❌ SOCKET: Error en emitToUser:', error);
      return false;
    }
  }

  // Emitir nuevo canal creado (mejorado)
  emitChannelCreated(projectId, channel) {
    try {
      console.log('📢 SOCKET: Emitiendo nuevo canal para proyecto:', projectId);
      console.log('📁 SOCKET: Canal:', channel.name, '(', channel._id, ')');
      
      // Emitir a todos los usuarios del proyecto
      const success = this.emitToProject(projectId, 'channel_created', {
        channel,
        channelName: channel.name
      });
      
      if (success) {
        console.log('✅ SOCKET: Canal creado emitido a proyecto exitosamente');
      }
      
      return success;
    } catch (error) {
      console.error('❌ SOCKET: Error en emitChannelCreated:', error);
      return false;
    }
  }

  // =================================================================
  // MÉTODOS DE UTILIDAD Y ESTADÍSTICAS
  // =================================================================

  // Verificar si un usuario está conectado
  isUserConnected(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  // Obtener estadísticas completas
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
        onlineUsers: this.getProjectOnlineUsers(projectId).length
      })),
      channelRooms: Array.from(this.channelRooms.entries()).map(([channelId, socketIds]) => ({
        channelId,
        userCount: socketIds.size,
        socketIds: Array.from(socketIds)
      })),
      userChannels: Array.from(this.userChannels.entries()).map(([userId, channelId]) => ({
        userId,
        currentChannel: channelId
      }))
    };
    
    console.log('📊 SOCKET: Estadísticas completas:', stats);
    return stats;
  }

  // Obtener número de usuarios conectados
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Método para obtener información de una sala
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

  // Broadcast a todos los usuarios conectados
  broadcastToAll(eventName, data) {
    try {
      console.log('📢 SOCKET: Broadcasting a todos los usuarios:', eventName);
      this.io.emit(eventName, {
        ...data,
        timestamp: new Date(),
        totalUsers: this.connectedUsers.size
      });
      return true;
    } catch (error) {
      console.error('❌ SOCKET: Error en broadcastToAll:', error);
      return false;
    }
  }

  // 🔥 MÉTODO DE PRUEBA PARA VERIFICAR QUE TODO FUNCIONA
  testConnection() {
    console.log('🧪 SOCKET: Test de conexión');
    console.log('   - Usuarios conectados:', this.connectedUsers.size);
    console.log('   - Proyectos activos:', this.projectUsers.size);
    console.log('   - Canales activos:', this.channelRooms.size);
    console.log('   - Métodos disponibles:', [
      'emitNewMessage',
      'emitToProject', 
      'emitToUser',
      'emitChannelCreated',
      'getProjectOnlineUsers'
    ]);
    return true;
  }
}

module.exports = SocketHandler;