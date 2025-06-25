const Contact = require('../models/Contact');
const Activity = require('../models/Activity');

// @desc    Obtener todos los contactos del usuario
// @route   GET /api/contacts
// @access  Private
exports.getContacts = async (req, res) => {
  try {
    const { stage, search, page = 1, limit = 10 } = req.query;
    
    // Construir query
    let query = { owner: req.user.id, isActive: true };
    
    // Filtrar por stage si se especifica
    if (stage && stage !== 'all') {
      query.stage = stage;
    }
    
    // Búsqueda por nombre, empresa o email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Paginación
    const skip = (page - 1) * limit;
    
    const contacts = await Contact.find(query)
      .sort({ lastContactDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Contact.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: contacts
    });
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener contactos'
    });
  }
};

// @desc    Obtener un contacto específico
// @route   GET /api/contacts/:id
// @access  Private
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    // Verificar ownership
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este contacto'
      });
    }
    
    // Obtener actividades del contacto
    const activities = await Activity.getActivitiesByContact(contact._id);
    
    res.status(200).json({
      success: true,
      data: {
        contact,
        activities
      }
    });
  } catch (error) {
    console.error('Error al obtener contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener contacto'
    });
  }
};

// @desc    Crear nuevo contacto
// @route   POST /api/contacts
// @access  Private
exports.createContact = async (req, res) => {
  try {
    // Agregar el owner del contacto
    req.body.owner = req.user.id;
    
    const contact = await Contact.create(req.body);
    
    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error al crear contacto:', error);
    
    // Error de duplicado (email único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un contacto con este email'
      });
    }
    
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
      message: 'Error del servidor al crear contacto'
    });
  }
};

// @desc    Actualizar contacto
// @route   PUT /api/contacts/:id
// @access  Private
exports.updateContact = async (req, res) => {
  try {
    let contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    // Verificar ownership
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este contacto'
      });
    }
    
    contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error al actualizar contacto:', error);
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar contacto'
    });
  }
};

// @desc    Eliminar contacto
// @route   DELETE /api/contacts/:id
// @access  Private
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    // Verificar ownership
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este contacto'
      });
    }
    
    // Soft delete - marcar como inactivo
    await Contact.findByIdAndUpdate(req.params.id, { isActive: false });
    
    res.status(200).json({
      success: true,
      message: 'Contacto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar contacto'
    });
  }
};

// @desc    Mover contacto a nueva etapa del pipeline
// @route   PATCH /api/contacts/:id/stage
// @access  Private
exports.moveToStage = async (req, res) => {
  try {
    const { stage } = req.body;
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    // Verificar ownership
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para mover este contacto'
      });
    }
    
    await contact.moveToStage(stage);
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error al mover contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al mover contacto'
    });
  }
};

// @desc    Agregar nota al contacto
// @route   POST /api/contacts/:id/notes
// @access  Private
exports.addNote = async (req, res) => {
  try {
    const { note } = req.body;
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    // Verificar ownership
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para agregar notas a este contacto'
      });
    }
    
    await contact.addNote(note);
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error al agregar nota:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar nota'
    });
  }
};

// @desc    Programar seguimiento
// @route   POST /api/contacts/:id/follow-up
// @access  Private
exports.scheduleFollowUp = async (req, res) => {
  try {
    const { date } = req.body;
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    // Verificar ownership
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para programar seguimiento a este contacto'
      });
    }
    
    await contact.scheduleFollowUp(new Date(date));
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error al programar seguimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al programar seguimiento'
    });
  }
};

// @desc    Obtener estadísticas del pipeline
// @route   GET /api/contacts/pipeline-stats
// @access  Private
exports.getPipelineStats = async (req, res) => {
  try {
    const stats = await Contact.getPipelineStats(req.user.id);
    
    // Formatear estadísticas
    const formattedStats = {
      total: 0,
      totalValue: 0,
      stages: {}
    };
    
    stats.forEach(stat => {
      formattedStats.stages[stat._id] = {
        count: stat.count,
        totalValue: stat.totalValue,
        avgProbability: Math.round(stat.avgProbability)
      };
      formattedStats.total += stat.count;
      formattedStats.totalValue += stat.totalValue;
    });
    
    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener estadísticas'
    });
  }
};

// @desc    Obtener contactos por etapa (para el pipeline visual)
// @route   GET /api/contacts/by-stage/:stage
// @access  Private
exports.getContactsByStage = async (req, res) => {
  try {
    const { stage } = req.params;
    
    const contacts = await Contact.getContactsByStage(req.user.id, stage);
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error al obtener contactos por etapa:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener contactos por etapa'
    });
  }
};

// @desc    Obtener seguimientos vencidos
// @route   GET /api/contacts/overdue-followups
// @access  Private
exports.getOverdueFollowUps = async (req, res) => {
  try {
    const contacts = await Contact.getOverdueFollowUps(req.user.id);
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error al obtener seguimientos vencidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener seguimientos vencidos'
    });
  }
};