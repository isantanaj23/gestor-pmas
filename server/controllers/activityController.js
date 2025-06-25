const Activity = require('../models/Activity');
const Contact = require('../models/Contact');

// @desc    Obtener todas las actividades del usuario
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res) => {
  try {
    const { type, status, contact, page = 1, limit = 10 } = req.query;
    
    // Construir query
    let query = { owner: req.user.id };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (contact) query.contact = contact;
    
    // Paginación
    const skip = (page - 1) * limit;
    
    const activities = await Activity.find(query)
      .populate('contact', 'firstName lastName company')
      .populate('owner', 'name email')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Activity.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: activities
    });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener actividades'
    });
  }
};

// @desc    Obtener una actividad específica
// @route   GET /api/activities/:id
// @access  Private
exports.getActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('contact', 'firstName lastName company email phone')
      .populate('owner', 'name email')
      .populate('participants', 'name email');
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Actividad no encontrada'
      });
    }
    
    // Verificar ownership
    if (activity.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta actividad'
      });
    }
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener actividad'
    });
  }
};

// @desc    Crear nueva actividad
// @route   POST /api/activities
// @access  Private
exports.createActivity = async (req, res) => {
  try {
    // Agregar el owner de la actividad
    req.body.owner = req.user.id;
    
    // Verificar que el contacto existe y pertenece al usuario
    const contact = await Contact.findById(req.body.contact);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear actividades para este contacto'
      });
    }
    
    const activity = await Activity.create(req.body);
    
    // Poblar los datos
    await activity.populate([
      { path: 'contact', select: 'firstName lastName company' },
      { path: 'owner', select: 'name email' }
    ]);
    
    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error al crear actividad:', error);
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear actividad'
    });
  }
};

// @desc    Actualizar actividad
// @route   PUT /api/activities/:id
// @access  Private
exports.updateActivity = async (req, res) => {
  try {
    let activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Actividad no encontrada'
      });
    }
    
    // Verificar ownership
    if (activity.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar esta actividad'
      });
    }
    
    activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate([
      { path: 'contact', select: 'firstName lastName company' },
      { path: 'owner', select: 'name email' }
    ]);
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar actividad'
    });
  }
};

// @desc    Eliminar actividad
// @route   DELETE /api/activities/:id
// @access  Private
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Actividad no encontrada'
      });
    }
    
    // Verificar ownership
    if (activity.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta actividad'
      });
    }
    
    await Activity.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Actividad eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar actividad'
    });
  }
};

// @desc    Completar actividad
// @route   PATCH /api/activities/:id/complete
// @access  Private
exports.completeActivity = async (req, res) => {
  try {
    const { outcome, notes } = req.body;
    
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Actividad no encontrada'
      });
    }
    
    // Verificar ownership
    if (activity.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para completar esta actividad'
      });
    }
    
    await activity.complete(outcome, notes);
    await activity.populate([
      { path: 'contact', select: 'firstName lastName company' },
      { path: 'owner', select: 'name email' }
    ]);
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error al completar actividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al completar actividad'
    });
  }
};

// @desc    Reprogramar actividad
// @route   PATCH /api/activities/:id/reschedule
// @access  Private
exports.rescheduleActivity = async (req, res) => {
  try {
    const { newDate } = req.body;
    
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Actividad no encontrada'
      });
    }
    
    // Verificar ownership
    if (activity.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para reprogramar esta actividad'
      });
    }
    
    await activity.reschedule(new Date(newDate));
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error al reprogramar actividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al reprogramar actividad'
    });
  }
};

// @desc    Obtener actividades próximas
// @route   GET /api/activities/upcoming
// @access  Private
exports.getUpcomingActivities = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const activities = await Activity.getUpcomingActivities(req.user.id, Number(days));
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Error al obtener actividades próximas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener actividades próximas'
    });
  }
};

// @desc    Obtener actividades vencidas
// @route   GET /api/activities/overdue
// @access  Private
exports.getOverdueActivities = async (req, res) => {
  try {
    const activities = await Activity.getOverdueActivities(req.user.id);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Error al obtener actividades vencidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener actividades vencidas'
    });
  }
};

// @desc    Obtener estadísticas de actividades
// @route   GET /api/activities/stats
// @access  Private
exports.getActivityStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await Activity.getActivityStats(req.user.id, start, end);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de actividades:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener estadísticas'
    });
  }
};

// @desc    Obtener actividades de un contacto específico
// @route   GET /api/activities/contact/:contactId
// @access  Private
exports.getActivitiesByContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    
    // Verificar que el contacto pertenece al usuario
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }
    
    if (contact.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las actividades de este contacto'
      });
    }
    
    const activities = await Activity.getActivitiesByContact(contactId);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Error al obtener actividades del contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener actividades del contacto'
    });
  }
};