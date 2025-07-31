// server/socket/socketHandler.js - VERSIÓN COMPLETA INTEGRADA

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

    // 🗺️ Mapas para tracking completo
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // userId -> socket instance
    this.projectUsers = new Map(); // projectId -> Set of userIds
    this.userProjects = new Map(); // userId -> Set of projectIds
    this.channelRooms = new Map(); // channelId -> Set of socketIds
    this.userChannels = new Map(); // userId -> currentChannelId
    
    // 🔐 Sistema de permisos
    this.loadRolePermissions();
    
    this.setupMiddleware();
    this.setupEventHandlers();
    
    // Hacer disponible globalmente para usar en otros módulos
    global.socketHandler = this;
    
    console.log('🚀 SOCKET HANDLER: Inicializado completamente con chat avanzado');
  }

  // =================================================================
  // 🔐 SISTEMA DE PERMISOS Y ROLES
  // =================================================================

  loadRolePermissions() {
    try {
      // Intentar cargar el sistema de roles si existe
      const roles = require('../utils/roles');
      this.checkUserPermissions = roles;
    } catch (error) {
      console.warn('⚠️ SOCKET: Sistema de roles no encontrado, usando permisos básicos');
      // Sistema de permisos básico
      this.checkUserPermissions = {
        checkPermission: (role, permission) => {
          const permissions = {
            'admin': {
              canSendMessages: true,
              canDeleteMessages: true,
              canRemoveUsers: true,
              canManageProjectMembers: true,
              canCreateChannels: true,
              canManageChannels: true
            },
            'manager': {
              canSendMessages: true,
              canDeleteMessages: true,
              canRemoveUsers: true,
              canManageProjectMembers: true,
              canCreateChannels: true,
              canManageChannels: true
            },
            'developer': {
              canSendMessages: true,
              canDeleteMessages: false,
              canRemoveUsers: false,
              canManageProjectMembers: false,
              canCreateChannels: false,
              canManageChannels: false
            },
            'designer': {
              canSendMessages: true,
              canDeleteMessages: false,
              canRemoveUsers: false,
              canManageProjectMembers: false,
              canCreateChannels: false,
              canManageChannels: false
            },
            'tester': {
              canSendMessages: true,
              canDeleteMessages: false,
              canRemoveUsers: false,
              canManageProjectMembers: false,
              canCreateChannels: false,
              canManageChannels: false
            },
            'viewer': {
              canSendMessages: true,
              canDeleteMessages: false,
              canRemoveUsers: false,
              canManageProjectMembers: false,
              canCreateChannels: false,
              canManageChannels: false
            }
          };
          
          return permissions[role]?.[permission] || false;
        }
      };
    }
  }

  // =================================================================
  // 🔐 MIDDLEWARE DE AUTENTICACIÓN
  // =================================================================

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          console.log('❌ SOCKET: No token provided');
          return next(new Error('No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuario en la base de datos
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
          avatar: user.avatar || null,
          role: user.role || 'viewer'
        };
        
        console.log('✅ SOCKET: Usuario autenticado:', socket.user.name, '- Rol:', socket.user.role);
        next();
        
      } catch (error) {
        console.log('❌ SOCKET: Error de autenticación:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  // =================================================================
  // 🎧 CONFIGURAR EVENT HANDLERS PRINCIPALES
  // =================================================================

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 SOCKET: Usuario conectado:', socket.user.name, '(ID:', socket.id, ')');
      
      // Registrar usuario conectado
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.userId, socket);
      
      // Unirse a sala personal del usuario
      socket.join(`user_${socket.userId}`);
      
      // Unirse a salas de proyectos del usuario
      this.joinUserRooms(socket);

      // =================================================================
      // 🏠 EVENTOS DE PROYECTOS
      // =================================================================
      
      socket.on('join_project', (projectId) => this.handleJoinProject(socket, projectId));
      socket.on('leave_project', (projectId) => this.handleLeaveProject(socket, projectId));
      socket.on('request_project_online_users', (projectId) => this.handleRequestProjectOnlineUsers(socket, projectId));

      // =================================================================
      // 💬 EVENTOS DE CANALES
      // =================================================================
      
      socket.on('join_channel', (channelId) => this.handleJoinChannel(socket, channelId));
      socket.on('leave_channel', (channelId) => this.handleLeaveChannel(socket, channelId));

      // =================================================================
      // 📨 EVENTOS DE MENSAJES
      // =================================================================
      
      socket.on('send_message', (data) => this.handleSendMessage(socket, data));
      socket.on('delete_message', (data) => this.handleDeleteMessage(socket, data));

      // =================================================================
      // 👥 EVENTOS DE GESTIÓN DE MIEMBROS
      // =================================================================
      
      socket.on('remove_user_from_chat', (data) => this.handleRemoveUserFromChat(socket, data));
      socket.on('remove_project_member', (data) => this.handleRemoveProjectMember(socket, data));
      socket.on('add_member_to_channel', (data) => this.handleAddMemberToChannel(socket, data));
      socket.on('remove_member_from_channel', (data) => this.handleRemoveMemberFromChannel(socket, data));

      // =================================================================
      // 🔔 EVENTOS DE NOTIFICACIONES (EXISTENTES)
      // =================================================================
      
      socket.on('task_update', (data) => this.handleTaskUpdate(socket, data));
      socket.on('new_comment', (data) => this.handleNewComment(socket, data));
      socket.on('project_update', (data) => this.handleProjectUpdate(socket, data));
      socket.on('contact_update', (data) => this.handleContactUpdate(socket, data));

      // =================================================================
      // 🧪 EVENTOS DE TESTING
      // =================================================================
      
      socket.on('ping_test', (data) => {
        console.log('🏓 SOCKET: Ping recibido de', socket.user.name);
        socket.emit('pong_test', {
          message: 'Pong desde servidor',
          timestamp: new Date(),
          originalData: data,
          userConnected: true,
          userRole: socket.user.role,
          userPermissions: {
            canSendMessages: this.checkUserPermissions.checkPermission(socket.user.role, 'canSendMessages'),
            canManageChannels: this.checkUserPermissions.checkPermission(socket.user.role, 'canManageChannels'),
            canRemoveUsers: this.checkUserPermissions.checkPermission(socket.user.role, 'canRemoveUsers')
          }
        });
      });

      // =================================================================
      // 🔌 DESCONEXIÓN
      // =================================================================
      
      socket.on('disconnect', (reason) => {
        console.log('🔌 SOCKET: Usuario desconectado:', socket.user?.name, '(Razón:', reason, ')');
        this.handleUserDisconnect(socket);
      });
    });
  }

  // =================================================================
  // 🏠 MÉTODOS DE GESTIÓN DE PROYECTOS
  // =================================================================

  async joinUserRooms(socket) {
    try {
      const Project = require('../models/Project');
      const projects = await Project.find({
        $or: [
          { owner: socket.userId },
          { 'team.user': socket.userId }
        ]
      });

      projects.forEach(project => {
        socket.join(`project_${project._id}`);
        
        // Registrar en mapas de tracking
        if (!this.projectUsers.has(project._id.toString())) {
          this.projectUsers.set(project._id.toString(), new Set());
        }
        this.projectUsers.get(project._id.toString()).add(socket.userId);

        if (!this.userProjects.has(socket.userId)) {
          this.userProjects.set(socket.userId, new Set());
        }
        this.userProjects.get(socket.userId).add(project._id.toString());
      });

      console.log(`👥 Usuario ${socket.user.name} unido a ${projects.length} proyectos`);
    } catch (error) {
      console.error('❌ Error uniendo usuario a salas:', error);
    }
  }

  handleJoinProject(socket, projectId) {
    console.log('🏠 SOCKET: Usuario', socket.user.name, 'uniéndose al proyecto:', projectId);
    
    const roomName = `project_${projectId}`;
    socket.join(roomName);
    socket.currentProject = projectId;
    
    // Registrar en mapas de tracking
    if (!this.projectUsers.has(projectId)) {
      this.projectUsers.set(projectId, new Set());
    }
    this.projectUsers.get(projectId).add(socket.userId);
    
    if (!this.userProjects.has(socket.userId)) {
      this.userProjects.set(socket.userId, new Set());
    }
    this.userProjects.get(socket.userId).add(projectId);
    
    // Notificar a otros usuarios
    socket.to(roomName).emit('user_joined_project', {
      projectId,
      userId: socket.userId,
      userName: socket.user.name,
      userRole: socket.user.role,
      timestamp: new Date()
    });
    
    // Enviar lista de usuarios en línea
    const onlineUsers = this.getProjectOnlineUsers(projectId);
    this.io.to(roomName).emit('project_online_users', {
      projectId,
      users: onlineUsers
    });
    
    console.log('✅ SOCKET: Usuario unido al proyecto exitosamente');
  }

  handleLeaveProject(socket, projectId) {
    console.log('🚪 SOCKET: Usuario', socket.user.name, 'saliendo del proyecto:', projectId);
    
    const roomName = `project_${projectId}`;
    socket.leave(roomName);
    
    // Limpiar tracking
    this.cleanupUserFromProject(socket.userId, projectId);
    
    // Limpiar canal actual si pertenece a este proyecto
    if (socket.currentProject === projectId) {
      socket.currentProject = null;
      this.userChannels.delete(socket.userId);
    }
    
    // Notificar a otros usuarios
    socket.to(roomName).emit('user_left_project', {
      projectId,
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date()
    });
    
    // Enviar lista actualizada
    const onlineUsers = this.getProjectOnlineUsers(projectId);
    this.io.to(roomName).emit('project_online_users', {
      projectId,
      users: onlineUsers
    });
  }

  handleRequestProjectOnlineUsers(socket, projectId) {
    console.log('👥 SOCKET: Solicitando usuarios en línea del proyecto:', projectId);
    const onlineUsers = this.getProjectOnlineUsers(projectId);
    socket.emit('project_online_users', {
      projectId,
      users: onlineUsers
    });
  }

  // =================================================================
  // 💬 MÉTODOS DE GESTIÓN DE CANALES
  // =================================================================

  handleJoinChannel(socket, channelId) {
    console.log('💬 SOCKET: Usuario', socket.user.name, 'uniéndose al canal:', channelId);
    
    // Salir del canal anterior si existe
    const previousChannel = this.userChannels.get(socket.userId);
    if (previousChannel && previousChannel !== channelId) {
      this.handleLeaveChannel(socket, previousChannel);
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
    
    // Confirmar al usuario
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
    
    console.log('✅ SOCKET: Usuario unido al canal exitosamente');
  }

  handleLeaveChannel(socket, channelId) {
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
  }

  // =================================================================
  // 📨 MÉTODOS DE GESTIÓN DE MENSAJES
  // =================================================================

  async handleSendMessage(socket, data) {
    try {
      const { projectId, channelId, message, type = 'text' } = data;
      
      console.log('💬 SOCKET: Enviando mensaje en canal:', channelId);

      // Verificar permisos
      if (!this.checkUserPermissions.checkPermission(socket.user.role, 'canSendMessages')) {
        socket.emit('error', { 
          message: 'No tienes permisos para enviar mensajes' 
        });
        return;
      }

      // Verificar membresía del proyecto
      if (!await this.verifyProjectMembership(socket.userId, projectId)) {
        socket.emit('error', { 
          message: 'Ya no eres miembro de este proyecto' 
        });
        return;
      }

      // Crear objeto de mensaje
      const messageData = {
        _id: require('crypto').randomUUID(),
        content: message,
        sender: {
          _id: socket.userId,
          name: socket.user.name,
          email: socket.user.email,
          role: socket.user.role,
          avatar: socket.user.avatar
        },
        createdAt: new Date(),
        type,
        projectId,
        channelId
      };

      // Emitir mensaje
      this.emitNewMessage(channelId, messageData, projectId);
      
      console.log('✅ SOCKET: Mensaje enviado exitosamente');

    } catch (error) {
      console.error('❌ SOCKET: Error enviando mensaje:', error);
      socket.emit('error', { 
        message: 'Error al enviar mensaje',
        error: error.message 
      });
    }
  }

  async handleDeleteMessage(socket, data) {
    try {
      const { projectId, channelId, messageId } = data;
      
      // Verificar permisos
      if (!this.checkUserPermissions.checkPermission(socket.user.role, 'canDeleteMessages')) {
        socket.emit('error', { 
          message: 'No tienes permisos para eliminar mensajes' 
        });
        return;
      }

      // Emitir eliminación
      const eventData = {
        messageId,
        deletedBy: {
          id: socket.userId,
          name: socket.user.name,
          role: socket.user.role
        },
        timestamp: new Date()
      };

      this.io.to(`channel_${channelId}`).emit('message_deleted', eventData);
      this.io.to(`project_${projectId}`).emit('message_deleted_global', eventData);

      console.log('✅ SOCKET: Mensaje eliminado exitosamente');

    } catch (error) {
      console.error('❌ SOCKET: Error eliminando mensaje:', error);
      socket.emit('error', { 
        message: 'Error al eliminar mensaje',
        error: error.message 
      });
    }
  }

  // =================================================================
  // 👥 MÉTODOS DE GESTIÓN DE MIEMBROS
  // =================================================================

  async handleRemoveUserFromChat(socket, data) {
    try {
      const { projectId, userId, reason = 'removed_from_chat' } = data;
      
      console.log('🗑️ SOCKET: Eliminando usuario del chat:', userId);

      // Verificar permisos
      if (!await this.verifyRemovalPermissions(socket, projectId, userId)) {
        return;
      }

      // Encontrar socket del usuario objetivo
      const targetSocket = this.userSockets.get(userId);

      if (targetSocket) {
        // Expulsar del proyecto
        this.handleLeaveProject(targetSocket, projectId);
        
        // Notificar al usuario eliminado
        targetSocket.emit('removed_from_chat', {
          projectId,
          reason,
          removedBy: socket.user.name,
          message: 'Has sido eliminado del chat del proyecto',
          timestamp: new Date()
        });
      }

      // Notificar a todos los usuarios del proyecto
      socket.to(`project_${projectId}`).emit('user_removed_from_chat', {
        userId,
        projectId,
        removedBy: {
          id: socket.userId,
          name: socket.user.name,
          role: socket.user.role
        },
        reason,
        timestamp: new Date()
      });

      // Confirmar al eliminador
      socket.emit('user_removal_confirmed', {
        userId,
        projectId,
        success: true,
        action: 'removed_from_chat'
      });

      console.log('✅ SOCKET: Usuario eliminado del chat exitosamente');

    } catch (error) {
      console.error('❌ SOCKET: Error eliminando usuario del chat:', error);
      socket.emit('error', { 
        message: 'Error al eliminar usuario del chat',
        error: error.message 
      });
    }
  }

  async handleRemoveProjectMember(socket, data) {
    try {
      const { projectId, memberIdToRemove, reason = 'removed_from_project' } = data;
      
      console.log('🚫 SOCKET: Removiendo miembro del proyecto:', memberIdToRemove);

      // Verificar permisos
      if (!await this.verifyRemovalPermissions(socket, projectId, memberIdToRemove)) {
        return;
      }

      // Actualizar base de datos
      const Project = require('../models/Project');
      const project = await Project.findById(projectId);
      
      if (!project) {
        socket.emit('error', { message: 'Proyecto no encontrado' });
        return;
      }

      // Remover miembro
      const originalTeamSize = project.team.length;
      project.team = project.team.filter(member => member.user.toString() !== memberIdToRemove);
      
      if (project.team.length === originalTeamSize) {
        socket.emit('error', { message: 'El usuario no es miembro de este proyecto' });
        return;
      }

      await project.save();

      // Expulsar si está conectado
      const memberSocket = this.userSockets.get(memberIdToRemove);
      if (memberSocket) {
        this.handleLeaveProject(memberSocket, projectId);
        
        memberSocket.emit('removed_from_project', {
          projectId,
          projectName: project.name,
          removedBy: socket.user.name,
          reason,
          message: 'Has sido eliminado del proyecto',
          timestamp: new Date()
        });
      }

      // Limpiar tracking
      this.cleanupUserFromProject(memberIdToRemove, projectId);

      // Notificar a todos
      this.io.to(`project_${projectId}`).emit('member_removed_from_project', {
        projectId,
        removedMemberId: memberIdToRemove,
        removedBy: {
          _id: socket.userId,
          name: socket.user.name,
          role: socket.user.role
        },
        reason,
        timestamp: new Date()
      });

      console.log('✅ SOCKET: Miembro eliminado del proyecto exitosamente');

    } catch (error) {
      console.error('❌ SOCKET: Error removiendo miembro del proyecto:', error);
      socket.emit('error', { 
        message: 'Error al eliminar miembro del proyecto',
        error: error.message 
      });
    }
  }

  async handleAddMemberToChannel(socket, data) {
    try {
      const { channelId, memberId, projectId } = data;
      
      console.log('➕ SOCKET: Agregando miembro al canal:', { channelId, memberId });

      // Verificar permisos
      if (!this.checkUserPermissions.checkPermission(socket.user.role, 'canManageChannels')) {
        socket.emit('error', { 
          message: 'No tienes permisos para gestionar miembros de canales' 
        });
        return;
      }

      // Emitir evento de miembro agregado
      this.io.to(`project_${projectId}`).emit('member_added_to_channel', {
        channelId,
        memberId,
        addedBy: {
          id: socket.userId,
          name: socket.user.name,
          role: socket.user.role
        },
        timestamp: new Date()
      });

      socket.emit('member_addition_confirmed', {
        channelId,
        memberId,
        success: true
      });

      console.log('✅ SOCKET: Miembro agregado al canal exitosamente');

    } catch (error) {
      console.error('❌ SOCKET: Error agregando miembro al canal:', error);
      socket.emit('error', { 
        message: 'Error al agregar miembro al canal',
        error: error.message 
      });
    }
  }

  async handleRemoveMemberFromChannel(socket, data) {
    try {
      const { channelId, memberId, projectId, reason = 'removed_from_channel' } = data;
      
      console.log('➖ SOCKET: Removiendo miembro del canal:', { channelId, memberId });

      // Verificar permisos
      if (!this.checkUserPermissions.checkPermission(socket.user.role, 'canManageChannels')) {
        socket.emit('error', { 
          message: 'No tienes permisos para gestionar miembros de canales' 
        });
        return;
      }

      // Si el usuario está conectado, sacarlo del canal
      const memberSocket = this.userSockets.get(memberId);
      if (memberSocket && this.userChannels.get(memberId) === channelId) {
        this.handleLeaveChannel(memberSocket, channelId);
        
        memberSocket.emit('removed_from_channel', {
          channelId,
          reason,
          removedBy: socket.user.name,
          message: 'Has sido removido del canal',
          timestamp: new Date()
        });
      }

      // Emitir evento de miembro removido
      this.io.to(`project_${projectId}`).emit('member_removed_from_channel', {
        channelId,
        memberId,
        removedBy: {
          id: socket.userId,
          name: socket.user.name,
          role: socket.user.role
        },
        reason,
        timestamp: new Date()
      });

      socket.emit('member_removal_confirmed', {
        channelId,
        memberId,
        success: true
      });

      console.log('✅ SOCKET: Miembro removido del canal exitosamente');

    } catch (error) {
      console.error('❌ SOCKET: Error removiendo miembro del canal:', error);
      socket.emit('error', { 
        message: 'Error al remover miembro del canal',
        error: error.message 
      });
    }
  }

  // =================================================================
  // 🔒 MÉTODOS DE VERIFICACIÓN DE PERMISOS
  // =================================================================

  async verifyRemovalPermissions(socket, projectId, targetUserId) {
    try {
      const Project = require('../models/Project');
      const project = await Project.findById(projectId);
      
      if (!project) {
        socket.emit('error', { message: 'Proyecto no encontrado' });
        return false;
      }

      // Verificar si es owner del proyecto
      const isOwner = project.owner.toString() === socket.userId;
      
      // Verificar permisos del rol
      const canRemoveUsers = this.checkUserPermissions.checkPermission(socket.user.role, 'canRemoveUsers');
      const canManageMembers = this.checkUserPermissions.checkPermission(socket.user.role, 'canManageProjectMembers');

      if (!isOwner && !canRemoveUsers && !canManageMembers) {
        socket.emit('error', { 
          message: 'No tienes permisos para eliminar miembros de este proyecto',
          requiredPermissions: ['canRemoveUsers', 'canManageProjectMembers', 'project owner']
        });
        return false;
      }

      // No se puede remover al owner
      if (project.owner.toString() === targetUserId) {
        socket.emit('error', { message: 'No se puede eliminar al propietario del proyecto' });
        return false;
      }

      return true;

    } catch (error) {
      console.error('❌ SOCKET: Error verificando permisos:', error);
      socket.emit('error', { message: 'Error verificando permisos' });
      return false;
    }
  }

  async verifyProjectMembership(userId, projectId) {
    try {
      const Project = require('../models/Project');
      const project = await Project.findById(projectId);
      
      if (!project) return false;

      const isOwner = project.owner.toString() === userId;
      const isMember = project.team.some(member => member.user.toString() === userId);
      
      return isOwner || isMember;

    } catch (error) {
      console.error('❌ SOCKET: Error verificando membresía:', error);
      return false;
    }
  }

  // =================================================================
  // 🔔 MÉTODOS PARA NOTIFICACIONES EXISTENTES
  // =================================================================

  handleTaskUpdate(socket, data) {
    this.io.to(`project_${data.projectId}`).emit('task_updated', {
      ...data,
      updatedBy: {
        _id: socket.user.id,
        name: socket.user.name
      }
    });
  }

  handleNewComment(socket, data) {
    this.io.to(`project_${data.projectId}`).emit('comment_added', {
      ...data,
      commentBy: {
        _id: socket.user.id,
        name: socket.user.name
      }
    });
  }

  handleProjectUpdate(socket, data) {
    this.io.to(`project_${data.projectId}`).emit('project_updated', {
      ...data,
      updatedBy: {
        _id: socket.user.id,
        name: socket.user.name
      }
    });
  }

  handleContactUpdate(socket, data) {
    this.io.emit('contact_updated', {
      ...data,
      updatedBy: {
        _id: socket.user.id,
        name: socket.user.name
      }
    });
  }

  // =================================================================
  // 📡 MÉTODOS DE EMISIÓN PRINCIPALES
  // =================================================================

  emitNewMessage(channelId, message, projectId = null) {
    if (!channelId || !message) {
      console.log('❌ SOCKET: Datos de mensaje incompletos');
      return false;
    }

    try {
      const channelRoom = `channel_${channelId}`;
      const usersInChannel = this.channelRooms.get(channelId)?.size || 0;
      
      console.log('📢 SOCKET: Emitiendo mensaje a canal:', channelId, '- Usuarios:', usersInChannel);
      
      // Emitir a nivel de canal
      this.io.to(channelRoom).emit('new_message', {
        channelId,
        message: {
          ...message,
          _id: message._id || message.id,
          content: message.content,
          sender: message.sender,
          createdAt: message.createdAt || new Date(),
          channel: channelId
        },
        timestamp: new Date()
      });
      
      // Emitir a nivel de proyecto para notificaciones globales
      if (projectId) {
        this.io.to(`project_${projectId}`).emit('new_message_global', {
          channelId,
          message: {
            ...message,
            _id: message._id || message.id,
            content: message.content,
            sender: message.sender,
            createdAt: message.createdAt || new Date(),
            channel: channelId
          },
          projectId,
          timestamp: new Date()
        });
      }
      
      console.log('✅ SOCKET: Mensaje emitido exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ SOCKET: Error en emitNewMessage:', error);
      return false;
    }
  }

  emitChannelCreated(projectId, channel, createdBy) {
    console.log('📡 SOCKET: Emitiendo nuevo canal:', channel.name);
    
    this.io.to(`project_${projectId}`).emit('channel_created', {
      projectId,
      channel,
      createdBy: {
        _id: createdBy._id,
        name: createdBy.name,
        email: createdBy.email
      },
      timestamp: new Date()
    });
  }

  emitChannelUpdated(projectId, channel, updatedBy) {
    console.log('📡 SOCKET: Emitiendo canal actualizado:', channel.name);
    
    this.io.to(`project_${projectId}`).emit('channel_updated', {
      projectId,
      channel,
      updatedBy: {
        _id: updatedBy._id,
        name: updatedBy.name
      },
      timestamp: new Date()
    });
  }

  emitChannelDeleted(projectId, channelId, deletedBy) {
    console.log('📡 SOCKET: Emitiendo canal eliminado:', channelId);
    
    this.io.to(`project_${projectId}`).emit('channel_deleted', {
      projectId,
      channelId,
      deletedBy: {
        _id: deletedBy._id,
        name: deletedBy.name
      },
      timestamp: new Date()
    });
  }

  emitToProject(projectId, eventName, data) {
    if (!projectId) {
      console.log('❌ SOCKET: ProjectId no proporcionado');
      return false;
    }
    
    try {
      const roomName = `project_${projectId}`;
      
      this.io.to(roomName).emit(eventName, {
        projectId,
        ...data,
        timestamp: new Date()
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ SOCKET: Error en emitToProject:', error);
      return false;
    }
  }

  emitToUser(userId, eventName, data) {
    try {
      const socket = this.userSockets.get(userId);
      if (socket && socket.connected) {
        socket.emit(eventName, data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ SOCKET: Error en emitToUser:', error);
      return false;
    }
  }

  // =================================================================
  // 🧹 MÉTODOS DE LIMPIEZA Y UTILIDADES
  // =================================================================

  cleanupUserFromProject(userId, projectId) {
    // Remover de tracking del proyecto
    const projectUsersSet = this.projectUsers.get(projectId);
    if (projectUsersSet) {
      projectUsersSet.delete(userId);
      if (projectUsersSet.size === 0) {
        this.projectUsers.delete(projectId);
      }
    }

    // Remover de tracking del usuario
    const userProjectsSet = this.userProjects.get(userId);
    if (userProjectsSet) {
      userProjectsSet.delete(projectId);
      if (userProjectsSet.size === 0) {
        this.userProjects.delete(userId);
      }
    }
  }

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
          userRole: socket.user.role,
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
          isOnline: true,
          currentChannel: this.userChannels.get(userId) || null,
          permissions: {
            canSendMessages: this.checkUserPermissions.checkPermission(socket.user.role, 'canSendMessages'),
            canDeleteMessages: this.checkUserPermissions.checkPermission(socket.user.role, 'canDeleteMessages'),
            canRemoveUsers: this.checkUserPermissions.checkPermission(socket.user.role, 'canRemoveUsers'),
            canManageChannels: this.checkUserPermissions.checkPermission(socket.user.role, 'canManageChannels')
          }
        });
      }
    }

    return onlineUsers;
  }

  // =================================================================
  // 📊 MÉTODOS DE ESTADÍSTICAS Y TESTING
  // =================================================================

  getStats() {
    const totalRooms = this.io.sockets.adapter.rooms.size;
    const totalSockets = this.io.sockets.sockets.size;
    
    return {
      connectedUsers: this.connectedUsers.size,
      totalSockets,
      totalRooms,
      projectUsers: Array.from(this.projectUsers.entries()).map(([projectId, userIds]) => ({
        projectId,
        userCount: userIds.size,
        onlineUsers: this.getProjectOnlineUsers(projectId).length
      })),
      channelRooms: Array.from(this.channelRooms.entries()).map(([channelId, socketIds]) => ({
        channelId,
        userCount: socketIds.size
      })),
      userChannels: Array.from(this.userChannels.entries()).map(([userId, channelId]) => ({
        userId,
        currentChannel: channelId
      }))
    };
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  testConnection() {
    console.log('🧪 SOCKET: Test de conexión completa');
    console.log('   - Usuarios conectados:', this.connectedUsers.size);
    console.log('   - Proyectos activos:', this.projectUsers.size);
    console.log('   - Canales activos:', this.channelRooms.size);
    console.log('   - Sistema de permisos:', !!this.checkUserPermissions);
    return true;
  }
}

module.exports = SocketHandler;