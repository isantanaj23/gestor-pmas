const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(protect);

// =================================================================
// RUTAS BÁSICAS QUE FUNCIONAN - SIN IMPORTAR CONTROLADORES EXTERNOS
// =================================================================

// 🔥 GET /api/projects - Obtener todos los proyectos
router.get('/', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    // Usar el método estático que sabemos que existe
    const projects = await Project.getProjectsByUser(req.user.id);
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener proyectos'
    });
  }
});

// 🔥 GET /api/projects/:id - Obtener un proyecto específico
router.get('/:id', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('team.user', 'name email avatar role');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar que el usuario tiene acceso al proyecto
    const hasAccess = project.owner._id.toString() === req.user.id ||
                     project.team.some(member => member.user._id.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este proyecto'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error obteniendo proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener proyecto'
    });
  }
});

// 🔥 GET /api/projects/:id/tasks - Obtener tareas de un proyecto
router.get('/:id/tasks', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Task = require('../models/Task');
    
    // Verificar que el proyecto existe
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar acceso al proyecto
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las tareas de este proyecto'
      });
    }

    // Obtener tareas usando el método estático
    const tasks = await Task.getTasksByProject(req.params.id);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener tareas'
    });
  }
});

// 🔥 POST /api/projects - Crear nuevo proyecto
router.post('/', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    // Agregar el owner del proyecto
    req.body.owner = req.user.id;

    const project = await Project.create(req.body);

    // Poblar los datos del owner
    await project.populate('owner', 'name email avatar');

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error creando proyecto:', error);
    
    // Errores de validación
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear proyecto'
    });
  }
});

// 🔥 POST /api/projects/:id/team - Agregar miembro al equipo
router.post('/:id/team', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const User = require('../models/User');
    
    const { userId, role = 'developer' } = req.body;
    
    console.log('👥 Agregando miembro al proyecto:', {
      projectId: req.params.id,
      userId: userId,
      role: role,
      requestUser: req.user.id
    });
    
    // Validar que se envió userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del usuario es requerido'
      });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar permisos (solo owner o admin)
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para agregar miembros a este proyecto'
      });
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el usuario no está ya en el equipo
    const existingMember = project.team.find(member => member.user.toString() === userId);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es miembro de este proyecto'
      });
    }

    // 🔥 AGREGAR MIEMBRO DIRECTAMENTE (sin usar método del modelo)
    project.team.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });

    await project.save();

    // Poblar datos del equipo actualizado
    await project.populate('owner', 'name email avatar');
    await project.populate('team.user', 'name email avatar');

    console.log('✅ Miembro agregado exitosamente');

    res.status(200).json({
      success: true,
      message: 'Miembro agregado al equipo exitosamente',
      data: project
    });
  } catch (error) {
    console.error('❌ Error al agregar miembro al equipo:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar miembro al equipo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔥 PATCH /api/projects/:id/progress - Actualizar progreso
router.patch('/:id/progress', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const { progress } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar acceso al proyecto
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.team.some(member => member.user.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este proyecto'
      });
    }

    // Usar el método del modelo
    await project.updateProgress(progress);

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar progreso'
    });
  }
});

// 🔥 RUTA TEMPORAL PARA DEBUG - Ver todos los proyectos con sus IDs reales
router.get('/debug/list', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    const projects = await Project.find({})
      .populate('owner', 'name email')
      .select('_id name description status progress');

    res.status(200).json({
      success: true,
      message: 'Lista de proyectos para debug',
      count: projects.length,
      data: projects.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        progress: p.progress,
        owner: p.owner?.name || 'No owner'
      }))
    });
  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({
      success: false,
      message: 'Error en debug',
      error: error.message
    });
  }
});

// 🔥 RUTA TEMPORAL PARA CREAR PROYECTOS DE PRUEBA
router.post('/debug/create-samples', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const User = require('../models/User');
    
    // Buscar un usuario existente para ser el owner
    const user = await User.findOne({});
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No hay usuarios en la base de datos. Crea un usuario primero.'
      });
    }

    // Proyectos de prueba
    const sampleProjects = [
      {
        name: 'Proyecto Alpha',
        description: 'Sistema de gestión empresarial con módulos de CRM y facturación',
        status: 'active',
        priority: 'high',
        progress: 75,
        owner: user._id,
        budget: {
          allocated: 50000,
          used: 35000
        }
      },
      {
        name: 'E-commerce Beta',
        description: 'Plataforma de comercio electrónico con sistema de pagos integrado',
        status: 'active',
        priority: 'medium',
        progress: 45,
        owner: user._id,
        budget: {
          allocated: 30000,
          used: 15000
        }
      },
      {
        name: 'App Móvil',
        description: 'Aplicación móvil multiplataforma con React Native',
        status: 'active',
        priority: 'high',
        progress: 95,
        owner: user._id,
        budget: {
          allocated: 25000,
          used: 23000
        }
      },
      {
        name: 'Marketing Q3',
        description: 'Campaña de marketing digital para el tercer trimestre',
        status: 'active',
        priority: 'low',
        progress: 25,
        owner: user._id,
        budget: {
          allocated: 15000,
          used: 3000
        }
      }
    ];

    // Eliminar proyectos existentes del usuario (opcional)
    await Project.deleteMany({ owner: user._id });

    // Crear proyectos de prueba
    const createdProjects = await Project.create(sampleProjects);

    // Poblar los datos
    const populatedProjects = await Project.find({ owner: user._id })
      .populate('owner', 'name email');

    res.status(201).json({
      success: true,
      message: 'Proyectos de prueba creados exitosamente',
      count: createdProjects.length,
      data: populatedProjects.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        progress: p.progress,
        owner: p.owner
      }))
    });

  } catch (error) {
    console.error('Error creando proyectos de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando proyectos de prueba',
      error: error.message
    });
  }
});

// 🔥 RUTA TEMPORAL PARA DEBUG - Ver todos los proyectos con sus IDs reales
router.get('/debug/list', async (req, res) => {
  try {
    const Project = require('../models/Project');
    
    const projects = await Project.find({})
      .populate('owner', 'name email')
      .select('_id name description status progress');

    res.status(200).json({
      success: true,
      message: 'Lista de proyectos para debug',
      count: projects.length,
      data: projects.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        progress: p.progress,
        owner: p.owner?.name || 'No owner'
      }))
    });
  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({
      success: false,
      message: 'Error en debug',
      error: error.message
    });
  }
});


// 🔥 AGREGAR esta ruta temporal al final de server/routes/projects.js (antes de module.exports)
// 🔥 RUTA TEMPORAL PARA CREAR USUARIOS DE PRUEBA
router.post('/debug/create-test-users', async (req, res) => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcrypt');
    
    // Usuarios de prueba
    const testUsers = [
      {
        name: 'Ana García',
        email: 'ana.garcia@empresa.com',
        password: await bcrypt.hash('123456', 10),
        role: 'developer',
        position: 'Frontend Developer',
        department: 'development',
        isActive: true
      },
      {
        name: 'Carlos López',
        email: 'carlos.lopez@empresa.com',
        password: await bcrypt.hash('123456', 10),
        role: 'developer',
        position: 'Backend Developer',
        department: 'development',
        isActive: true
      },
      {
        name: 'María Sánchez',
        email: 'maria.sanchez@empresa.com',
        password: await bcrypt.hash('123456', 10),
        role: 'designer',
        position: 'UI/UX Designer',
        department: 'design',
        isActive: true
      },
      {
        name: 'Diego Ruiz',
        email: 'diego.ruiz@empresa.com',
        password: await bcrypt.hash('123456', 10),
        role: 'manager',
        position: 'Project Manager',
        department: 'management',
        isActive: true
      }
    ];

    // Crear solo usuarios que no existan
    const createdUsers = [];
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = await User.create(userData);
        createdUsers.push(user);
      }
    }

    // Obtener todos los usuarios para devolver
    const allUsers = await User.find({}, 'name email role position department isActive');

    res.status(201).json({
      success: true,
      message: `${createdUsers.length} usuarios de prueba creados`,
      created: createdUsers.length,
      total: allUsers.length,
      data: allUsers
    });

  } catch (error) {
    console.error('Error creando usuarios de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando usuarios de prueba',
      error: error.message
    });
  }
});

// 🔥 RUTA PARA LISTAR USUARIOS (para debug)
router.get('/debug/users', async (req, res) => {
  try {
    const User = require('../models/User');
    
    const users = await User.find({}, 'name email role position department isActive')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error listando usuarios'
    });
  }
});

// @desc    Actualizar proyecto
// @route   PUT /api/projects/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const {
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      budget,
      settings
    } = req.body;

    console.log('📝 === ACTUALIZANDO PROYECTO ===');
    console.log('📝 Project ID:', projectId);
    console.log('📝 Usuario:', req.user.id);
    console.log('📝 Datos recibidos:', JSON.stringify(req.body, null, 2));

    const Project = require('../models/Project');
    
    // Verificar que el proyecto existe
    const project = await Project.findById(projectId);
    
    if (!project) {
      console.log('❌ Proyecto no encontrado:', projectId);
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    console.log('✅ Proyecto encontrado:', project.name);

    // Verificar permisos (solo owner o admin)
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log('❌ Sin permisos. Owner:', project.owner.toString(), 'User:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este proyecto'
      });
    }

    console.log('✅ Permisos verificados');

    // Actualizar campos básicos
    if (name !== undefined) {
      console.log('📝 Actualizando name:', name);
      project.name = name;
    }
    if (description !== undefined) {
      console.log('📝 Actualizando description:', description);
      project.description = description;
    }
    if (status !== undefined) {
      console.log('📝 Actualizando status:', status);
      project.status = status;
    }
    if (priority !== undefined) {
      console.log('📝 Actualizando priority:', priority);
      project.priority = priority;
    }
    if (startDate !== undefined) {
      console.log('📝 Actualizando startDate:', startDate);
      project.startDate = startDate;
    }
    if (endDate !== undefined) {
      console.log('📝 Actualizando endDate:', endDate);
      project.endDate = endDate;
    }
    
    // Actualizar presupuesto
    if (budget) {
      console.log('📝 Actualizando budget:', budget);
      if (!project.budget) project.budget = {};
      if (budget.allocated !== undefined) project.budget.allocated = budget.allocated;
      if (budget.used !== undefined) project.budget.used = budget.used;
    }
    
    // Actualizar configuraciones
    if (settings) {
      console.log('📝 Actualizando settings:', settings);
      if (!project.settings) project.settings = {};
      
      if (settings.allowTaskCreation !== undefined) {
        project.settings.allowTaskCreation = settings.allowTaskCreation;
      }
      if (settings.requireApproval !== undefined) {
        project.settings.requireApproval = settings.requireApproval;
      }
      if (settings.autoAssignTasks !== undefined) {
        project.settings.autoAssignTasks = settings.autoAssignTasks;
      }
      if (settings.enableNotifications !== undefined) {
        project.settings.enableNotifications = settings.enableNotifications;
      }
      if (settings.publicProject !== undefined) {
        project.settings.publicProject = settings.publicProject;
      }
    }

    // Actualizar fecha de modificación
    project.updatedAt = new Date();

    console.log('💾 Guardando proyecto...');
    
    // Guardar cambios
    await project.save();

    console.log('✅ Proyecto guardado');

    // Poblar datos para la respuesta
    await project.populate('owner', 'name email avatar');
    await project.populate('team.user', 'name email avatar');

    console.log('✅ Proyecto actualizado exitosamente');

    res.status(200).json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: project
    });

  } catch (error) {
    console.error('❌ Error actualizando proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar proyecto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }


  // 🧪 RUTA TEMPORAL DE DEBUG
router.put('/:id/debug', async (req, res) => {
  try {
    console.log('🧪 === DEBUG ROUTE ===');
    console.log('🧪 Project ID:', req.params.id);
    console.log('🧪 Usuario:', req.user?.id);
    console.log('🧪 Body:', req.body);
    
    res.status(200).json({
      success: true,
      message: 'Debug route funcionando correctamente',
      data: {
        projectId: req.params.id,
        userId: req.user?.id,
        bodyReceived: req.body,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('🧪 Error en debug route:', error);
    res.status(500).json({
      success: false,
      message: 'Error en debug route',
      error: error.message
    });
  }
});


  
});

module.exports = router;