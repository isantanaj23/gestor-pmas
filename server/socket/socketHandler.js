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
      
      // Unirse a salas de proyectos del usuario
      this.joinUserRooms(socket);

      // Event handlers
      socket.on('join_project', (projectId) => this.handleJoinProject(socket, projectId));
      socket.on('leave_project', (projectId) => this.handleLeaveProject(socket, projectId));
      socket.on('task_update', (data) => this.handleTaskUpdate(socket, data));
      socket.on('new_comment', (data) => this.handleNewComment(socket, data));
      socket.on('project_update', (data) => this.handleProjectUpdate(socket, data));
      socket.on('contact_update', (data) => this.handleContactUpdate(socket, data));
      
      // Desconexión
      socket.on('disconnect', () => {
        console.log(`❌ Usuario desconectado: ${socket.user.name}`);
        this.connectedUsers.delete(socket.userId);
      });
    });
  }

  // Unir usuario a salas de sus proyectos
  async joinUserRooms(socket) {
    try {
      const Project = require('../models/Project');
      const projects = await Project.find({
        $or: [
          { owner: socket.userId },
          { 'team.user': socket.userId }
        ]
      }).select('_id');

      projects.forEach(project => {
        socket.join(`project_${project._id}`);
      });

      // Unirse a sala personal
      socket.join(`user_${socket.userId}`);
      
      console.log(`📡 ${socket.user.name} unido a ${projects.length} proyectos`);
    } catch (error) {
      console.error('Error joining rooms:', error);
    }
  }

  // Manejar unión a proyecto específico
  handleJoinProject(socket, projectId) {
    socket.join(`project_${projectId}`);
    console.log(`👥 ${socket.user.name} se unió al proyecto ${projectId}`);
  }

  // Manejar salida de proyecto
  handleLeaveProject(socket, projectId) {
    socket.leave(`project_${projectId}`);
    console.log(`👋 ${socket.user.name} salió del proyecto ${projectId}`);
  }

  // Manejar actualización de tarea
  handleTaskUpdate(socket, data) {
    const { projectId, taskId, update, action } = data;
    
    // Emitir a todos los usuarios del proyecto excepto el que hizo el cambio
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

  // Manejar nuevo comentario
  handleNewComment(socket, data) {
    const { projectId, taskId, comment } = data;
    
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

    console.log(`💬 Nuevo comentario en tarea ${taskId} por ${socket.user.name}`);
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
    
    // Emitir solo al usuario propietario del contacto
    socket.to(`user_${socket.userId}`).emit('contact_updated', {
      contactId,
      update,
      action,
      timestamp: new Date()
    });

    console.log(`📞 Contacto ${action}: ${contactId} por ${socket.user.name}`);
  }

  // Métodos públicos para emitir eventos desde controladores
  
  // Notificar nueva tarea asignada
  notifyTaskAssigned(userId, task) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit('task_assigned', {
        task,
        message: `Te han asignado una nueva tarea: ${task.title}`,
        timestamp: new Date()
      });
      console.log(`📬 Notificación de tarea asignada enviada a ${userId}`);
    }
  }

  // Notificar vencimiento de tarea
  notifyTaskDue(userId, task) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit('task_due', {
        task,
        message: `Tarea vencida: ${task.title}`,
        timestamp: new Date()
      });
      console.log(`⏰ Notificación de tarea vencida enviada a ${userId}`);
    }
  }

  // Notificar seguimiento de contacto
  notifyFollowUpDue(userId, contact) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit('followup_due', {
        contact,
        message: `Seguimiento pendiente: ${contact.firstName} ${contact.lastName}`,
        timestamp: new Date()
      });
      console.log(`📞 Notificación de seguimiento enviada a ${userId}`);
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
}

module.exports = SocketHandler;