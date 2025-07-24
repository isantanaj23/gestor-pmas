// server/controllers/socialPostController.js
const SocialPost = require('../models/SocialPost');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// @desc    Crear nueva publicación social
// @route   POST /api/social-posts
// @access  Private
exports.createSocialPost = async (req, res) => {
  try {
    const { projectId, platform, content, scheduledDate, hashtags, media, notes } = req.body;

    console.log('📝 Creando nueva publicación social:', { projectId, platform, content: content?.substring(0, 50) });

    // Verificar que el usuario tiene acceso al proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar que el usuario es miembro del proyecto
    const isMember = project.team.some(member => 
      member.user.toString() === req.user.id
    );
    
    if (!isMember && project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear publicaciones en este proyecto'
      });
    }

    // Crear la publicación
    const socialPost = await SocialPost.create({
      project: projectId,
      author: req.user.id,
      platform,
      content,
      scheduledDate: new Date(scheduledDate),
      hashtags: hashtags || [],
      media: media || [],
      notes,
      status: new Date(scheduledDate) > new Date() ? 'scheduled' : 'draft'
    });

    await socialPost.populate('author', 'name email avatar');

    console.log('✅ Publicación social creada:', socialPost._id);

    // Emitir notificación via socket si está programada
    if (socialPost.status === 'scheduled') {
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        await socketHandler.notifySocialPostScheduled(req.user.id, socialPost);
      }
    }

    res.status(201).json({
      success: true,
      data: socialPost
    });

  } catch (error) {
    console.error('❌ Error al crear publicación social:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear la publicación',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Obtener publicaciones de un proyecto
// @route   GET /api/social-posts/project/:projectId
// @access  Private
exports.getProjectSocialPosts = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, platform, status } = req.query;

    console.log('📋 Obteniendo publicaciones del proyecto:', projectId);

    // Verificar acceso al proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const isMember = project.team.some(member => 
      member.user.toString() === req.user.id
    ) || project.owner.toString() === req.user.id;

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este proyecto'
      });
    }

    // Construir filtros
    let filter = { project: projectId };
    
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }
    
    if (platform) filter.platform = platform;
    if (status) filter.status = status;

    const posts = await SocialPost.find(filter)
      .populate('author', 'name email avatar')
      .sort({ scheduledDate: 1 });

    console.log(`✅ ${posts.length} publicaciones encontradas para proyecto ${projectId}`);

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });

  } catch (error) {
    console.error('❌ Error al obtener publicaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener publicaciones',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Obtener una publicación específica
// @route   GET /api/social-posts/:id
// @access  Private
exports.getSocialPost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id)
      .populate('author', 'name email avatar')
      .populate('project', 'name');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar acceso
    const project = await Project.findById(post.project._id);
    const hasAccess = project.team.some(member => 
      member.user.toString() === req.user.id
    ) || project.owner.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta publicación'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('❌ Error al obtener publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener la publicación',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Actualizar publicación social
// @route   PUT /api/social-posts/:id
// @access  Private
exports.updateSocialPost = async (req, res) => {
  try {
    console.log('✏️ Actualizando publicación:', req.params.id, req.body);

    let post = await SocialPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar permisos (solo autor o owner del proyecto)
    const project = await Project.findById(post.project);
    const canEdit = post.author.toString() === req.user.id || 
                   project.owner.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta publicación'
      });
    }

    // Actualizar campos permitidos
    const allowedFields = ['content', 'platform', 'scheduledDate', 'hashtags', 'media', 'notes'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Actualizar status si cambia la fecha
    if (req.body.scheduledDate) {
      updates.scheduledDate = new Date(req.body.scheduledDate);
      updates.status = updates.scheduledDate > new Date() ? 'scheduled' : 'draft';
    }

    post = await SocialPost.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'name email avatar');

    console.log('✅ Publicación actualizada:', post._id);

    res.status(200).json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('❌ Error al actualizar publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar la publicación',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Eliminar publicación social
// @route   DELETE /api/social-posts/:id
// @access  Private
exports.deleteSocialPost = async (req, res) => {
  try {
    console.log('🗑️ Eliminando publicación:', req.params.id);

    const post = await SocialPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar permisos
    const project = await Project.findById(post.project);
    const canDelete = post.author.toString() === req.user.id || 
                     project.owner.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta publicación'
      });
    }

    await SocialPost.findByIdAndDelete(req.params.id);

    console.log('✅ Publicación eliminada:', req.params.id);

    res.status(200).json({
      success: true,
      message: 'Publicación eliminada correctamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar la publicación',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Cambiar estado de publicación
// @route   PATCH /api/social-posts/:id/status
// @access  Private
exports.updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;
    console.log('🔄 Cambiando estado de publicación:', req.params.id, 'a', status);

    const post = await SocialPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar permisos
    const project = await Project.findById(post.project);
    const hasAccess = post.author.toString() === req.user.id || 
                     project.owner.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado'
      });
    }

    // Validar estados permitidos
    const allowedStatuses = ['draft', 'scheduled', 'published', 'failed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    post.status = status;
    
    if (status === 'published') {
      post.publishedAt = new Date();
      
      // Notificar via socket
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        await socketHandler.notifySocialPostPublished(req.user.id, post);
      }
    }

    await post.save();

    console.log('✅ Estado cambiado:', req.params.id, 'a', status);

    res.status(200).json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('❌ Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Obtener estadísticas de publicaciones
// @route   GET /api/social-posts/stats/:projectId
// @access  Private
exports.getSocialPostStats = async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log('📊 Obteniendo estadísticas del proyecto:', projectId);

    // Verificar acceso al proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const hasAccess = project.team.some(member => 
      member.user.toString() === req.user.id
    ) || project.owner.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este proyecto'
      });
    }

    // Estadísticas por estado
    const stats = await SocialPost.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$analytics.views' },
          totalLikes: { $sum: '$analytics.likes' },
          totalShares: { $sum: '$analytics.shares' }
        }
      }
    ]);

    // Estadísticas por plataforma
    const platformStats = await SocialPost.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          }
        }
      }
    ]);

    // Estadísticas generales
    const totalPosts = await SocialPost.countDocuments({ project: projectId });
    const publishedPosts = await SocialPost.countDocuments({ 
      project: projectId, 
      status: 'published' 
    });
    const scheduledPosts = await SocialPost.countDocuments({ 
      project: projectId, 
      status: 'scheduled' 
    });

    console.log('✅ Estadísticas obtenidas para proyecto:', projectId);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        byPlatform: platformStats,
        summary: {
          total: totalPosts,
          published: publishedPosts,
          scheduled: scheduledPosts,
          draft: totalPosts - publishedPosts - scheduledPosts
        }
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};