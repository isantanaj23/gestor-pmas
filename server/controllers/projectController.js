// @desc    Agregar miembro al equipo
// @route   POST /api/projects/:id/team
// @access  Private
exports.addTeamMember = async (req, res) => {
  try {
    const { userId, role = 'developer' } = req.body; // 🔥 AGREGAR role con valor por defecto
    
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

    // 🔥 USAR EL MÉTODO DEL MODELO QUE YA TIENES
    await project.addTeamMember(userId, role);
    
    // Poblar datos del equipo actualizado
    await project.populate('owner', 'name email avatar');
    await project.populate('team.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Miembro agregado al equipo exitosamente',
      data: project
    });
  } catch (error) {
    console.error('Error al agregar miembro al equipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al agregar miembro al equipo'
    });
  }
};