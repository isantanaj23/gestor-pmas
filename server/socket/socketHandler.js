// server/socket/socketHandler.js
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
    this.setupMiddleware();
    this.setupEventHandlers();
    
    // Hacer disponible globalmente para usar en otros módulos
    global.socketHandler = this;
    
    console.log('🚀 Socket.io inicializado con notificaciones mejoradas');
  }

  // Middleware de autenticación para sockets
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  // Configurar event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Usuario conectado: ${socket.user.name} (${socket.id})`);
      
      // Registrar usuario conectado
      this.connectedUsers.set(socket.userId, socket.id);
      
      // Unirse a sala personal del usuario para notificaciones
      socket.join(`user_${socket.userId}`);
      
      // Unirse a salas de proyectos del usuario
      this.joinUserRooms(socket);

      // Event handlers existentes
      socket.on('join_project', (projectId) => this.handleJoinProject(socket, projectId));
      socket.on('leave_project', (projectId) => this.handleLeaveProject(socket, projectId));
      socket.on('task_update', (data) => this.handleTaskUpdate(socket, data));
      socket.on('new_comment', (data) => this.handleNewComment(socket, data));
      socket.on('project_update', (data) => this.handleProjectUpdate(socket, data));
      socket.on('contact_update', (data) => this.handleContactUpdate(socket, data));

      // 🆕 Nuevos event handlers para notificaciones
      socket.on('mark_notification_read', (data) => this.handleMarkNotificationRead(socket, data));
      socket.on('request_notification_count', () => this.handleRequestNotificationCount(socket));
      socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
      socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`🔌 Usuario desconectado: ${socket.user.name}`);
        this.connectedUsers.delete(socket.userId);
        
        // Emitir evento de usuario desconectado a otros usuarios relevantes
        socket.broadcast.emit('user_disconnected', {
          userId: socket.userId,
          userName: socket.user.name
        });
      });
    });
  }

  // Unirse a salas de proyectos del usuario
  async joinUserRooms(socket) {
    try {
      const Project = require('../models/Project');
      const userProjects = await Project.find({
        $or: [
          { owner: socket.userId },
          { 'members.user': socket.userId }
        ]
      });
      
      userProjects.forEach(project => {
        socket.join(`project_${project._id}`);
      });
      
      console.log(`👥 ${socket.user.name} unido a ${userProjects.length} proyectos`);
    } catch (error) {
      console.error('Error uniendo a salas de proyectos:', error);
    }
  }

  // Manejar unión a proyecto
  handleJoinProject(socket, projectId) {
    socket.join(`project_${projectId}`);
    socket.to(`project_${projectId}`).emit('user_joined_project', {
      userId: socket.userId,
      userName: socket.user.name,
      projectId
    });
    console.log(`👥 ${socket.user.name} se unió al proyecto ${projectId}`);
  }

  // Manejar salida de proyecto
  handleLeaveProject(socket, projectId) {
    socket.leave(`project_${projectId}`);
    socket.to(`project_${projectId}`).emit('user_left_project', {
      userId: socket.userId,
      userName: socket.user.name,
      projectId
    });
    console.log(`👥 ${socket.user.name} salió del proyecto ${projectId}`);
  }

  // Manejar actualización de tarea
  handleTaskUpdate(socket, data) {
    const { projectId, taskId, update, action } = data;
    
    socket.to(`project_${projectId}`).emit('task_updated', {
      taskId,
      update,
      action,
      updatedBy: {
        id: socket.userId,
        name: socket.user.name
      },
      timestamp: new Date()
    });

    console.log(`📝 Tarea ${action}: ${taskId} en proyecto ${projectId} por ${socket.user.name}`);
  }

  // 🆕 Manejar nuevo comentario con notificaciones automáticas
  async handleNewComment(socket, data) {
    const { projectId, taskId, comment } = data;
    
    try {
      // Emitir a todos los usuarios del proyecto
      socket.to(`project_${projectId}`).emit('new_comment', {
        taskId,
        comment: {
          ...comment,
          user: {
            id: socket.userId,
            name: socket.user.name,
            avatar: socket.user.avatar
          }
        },
        timestamp: new Date()
      });

      // 🔔 Crear notificaciones automáticas para otros miembros del proyecto
      const Project = require('../models/Project');
      const Notification = require('../models/Notification');
      
      const project = await Project.findById(projectId).populate('members.user', '_id name');
      
      if (project) {
        // Obtener todos los miembros excepto quien hizo el comentario
        const membersToNotify = project.members
          .filter(member => member.user._id.toString() !== socket.userId)
          .map(member => member.user._id);

        // Crear notificaciones para cada miembro
        for (const memberId of membersToNotify) {
          const notification = await Notification.createNotification({
            recipient: memberId,
            sender: socket.userId,
            type: 'comment_added',
            title: 'Nuevo comentario',
            message: `${socket.user.name} comentó en una tarea de ${project.name}`,
            data: {
              taskId,
              projectId,
              commentId: comment._id,
              url: `/projects/${projectId}/tasks/${taskId}`
            },
            priority: 'normal'
          });

          // Emitir notificación en tiempo real si el usuario está conectado
          this.emitToUser(memberId, 'new_notification', notification);
        }
      }

      console.log(`💬 Nuevo comentario en tarea ${taskId} por ${socket.user.name}`);
    } catch (error) {
      console.error('Error manejando nuevo comentario:', error);
    }
  }

  // Manejar actualización de proyecto
  handleProjectUpdate(socket, data) {
    const { projectId, update, action } = data;
    
    socket.to(`project_${projectId}`).emit('project_updated', {
      projectId,
      update,
      action,
      updatedBy: {
        id: socket.userId,
        name: socket.user.name
      },
      timestamp: new Date()
    });

    console.log(`🏗️ Proyecto ${action}: ${projectId} por ${socket.user.name}`);
  }

  // Manejar actualización de contacto CRM
  handleContactUpdate(socket, data) {
    const { contactId, update, action } = data;
    
    socket.to(`user_${socket.userId}`).emit('contact_updated', {
      contactId,
      update,
      action,
      timestamp: new Date()
    });

    console.log(`📞 Contacto ${action}: ${contactId} por ${socket.user.name}`);
  }

  // 🆕 Manejar marcar notificación como leída
  async handleMarkNotificationRead(socket, data) {
    try {
      const { notificationId } = data;
      const Notification = require('../models/Notification');
      
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: socket.userId
      });
      
      if (notification) {
        await notification.markAsRead();
        
        // Emitir contador actualizado
        const newCount = await Notification.getUnreadCount(socket.userId);
        socket.emit('notification_count_updated', { count: newCount });
        
        console.log(`✅ Notificación ${notificationId} marcada como leída`);
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  }

  // 🆕 Manejar solicitud de contador de notificaciones
  async handleRequestNotificationCount(socket) {
    try {
      const Notification = require('../models/Notification');
      const count = await Notification.getUnreadCount(socket.userId);
      socket.emit('notification_count_updated', { count });
    } catch (error) {
      console.error('Error obteniendo contador de notificaciones:', error);
    }
  }

  // 🆕 Manejar indicador de escritura
  handleTypingStart(socket, data) {
    const { projectId, taskId } = data;
    socket.to(`project_${projectId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.user.name,
      taskId,
      isTyping: true
    });
  }

  // 🆕 Manejar fin de escritura
  handleTypingStop(socket, data) {
    const { projectId, taskId } = data;
    socket.to(`project_${projectId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.user.name,
      taskId,
      isTyping: false
    });
  }

  // 🆕 MÉTODOS PÚBLICOS PARA NOTIFICACIONES

  // Emitir notificación a un usuario específico
  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Emitir notificación a una sala específica
  emitToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  // 🔔 Emitir notificación general
  emitNotification(userId, notification) {
    const sent = this.emitToUser(userId, 'new_notification', notification);
    if (sent) {
      console.log(`🔔 Notificación enviada a ${userId}: ${notification.title}`);
    }
    return sent;
  }

  // Notificar nueva tarea asignada
  async notifyTaskAssigned(userId, task) {
    try {
      const Notification = require('../models/Notification');
      
      const notification = await Notification.createNotification({
        recipient: userId,
        type: 'task_assigned',
        title: 'Nueva tarea asignada',
        message: `Te han asignado la tarea: ${task.title}`,
        data: {
          taskId: task._id,
          projectId: task.project,
          url: `/projects/${task.project}/tasks/${task._id}`
        },
        priority: 'normal'
      });

      this.emitNotification(userId, notification);
      console.log(`📬 Notificación de tarea asignada enviada a ${userId}`);
    } catch (error) {
      console.error('Error enviando notificación de tarea asignada:', error);
    }
  }

  // Notificar vencimiento de tarea
  async notifyTaskDue(userId, task) {
    try {
      const Notification = require('../models/Notification');
      
      const notification = await Notification.createNotification({
        recipient: userId,
        type: 'task_due',
        title: 'Tarea vencida',
        message: `La tarea "${task.title}" ha vencido`,
        data: {
          taskId: task._id,
          projectId: task.project,
          url: `/projects/${task.project}/tasks/${task._id}`
        },
        priority: 'high'
      });

      this.emitNotification(userId, notification);
      console.log(`⏰ Notificación de tarea vencida enviada a ${userId}`);
    } catch (error) {
      console.error('Error enviando notificación de tarea vencida:', error);
    }
  }

  // Notificar seguimiento de contacto
  async notifyFollowUpDue(userId, contact) {
    try {
      const Notification = require('../models/Notification');
      
      const notification = await Notification.createNotification({
        recipient: userId,
        type: 'followup_due',
        title: 'Seguimiento pendiente',
        message: `Seguimiento pendiente: ${contact.firstName} ${contact.lastName}`,
        data: {
          contactId: contact._id,
          url: `/crm/contacts/${contact._id}`
        },
        priority: 'normal'
      });

      this.emitNotification(userId, notification);
      console.log(`📞 Notificación de seguimiento enviada a ${userId}`);
    } catch (error) {
      console.error('Error enviando notificación de seguimiento:', error);
    }
  }

  // 🆕 Notificar publicación social programada
  async notifySocialPostScheduled(userId, post) {
    try {
      const Notification = require('../models/Notification');
      
      const notification = await Notification.createNotification({
        recipient: userId,
        type: 'social_post_scheduled',
        title: 'Publicación programada',
        message: `Tu publicación para ${post.platform} ha sido programada`,
        data: {
          postId: post._id,
          url: `/social/calendar`
        },
        priority: 'low'
      });

      this.emitNotification(userId, notification);
    } catch (error) {
      console.error('Error enviando notificación de publicación programada:', error);
    }
  }

  // 🆕 Notificar publicación social realizada
  async notifySocialPostPublished(userId, post) {
    try {
      const Notification = require('../models/Notification');
      
      const notification = await Notification.createNotification({
        recipient: userId,
        type: 'social_post_published',
        title: 'Publicación realizada',
        message: `Tu publicación en ${post.platform} ha sido publicada`,
        data: {
          postId: post._id,
          url: `/social/calendar`
        },
        priority: 'normal'
      });

      this.emitNotification(userId, notification);
    } catch (error) {
      console.error('Error enviando notificación de publicación realizada:', error);
    }
  }

  // Notificar a todos los miembros de un proyecto
  notifyProjectMembers(projectId, event, data) {
    this.io.to(`project_${projectId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
    console.log(`📢 Notificación de proyecto ${projectId}: ${event}`);
  }

  // Obtener usuarios conectados
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Verificar si un usuario está conectado
  isUserConnected(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  // Obtener estadísticas de conexión
  getConnectionStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalRooms: this.io.sockets.adapter.rooms.size,
      socketCount: this.io.engine.clientsCount
    };
  }
}

module.exports = SocketHandler;