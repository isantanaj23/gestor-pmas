// client/src/components/ProjectTeam.js - Componente completo del equipo

import React, { useState, useEffect } from 'react';
import { getUserProjectPermissions, removeTeamMember } from '../services/projectService';
import { getRoleConfig, USER_ROLES } from '../utils/roles';

const ProjectTeam = ({ project, onProjectUpdate, currentUser }) => {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  // Cargar permisos del usuario actual
  useEffect(() => {
    if (project?._id) {
      loadUserPermissions();
    }
  }, [project]);

  const loadUserPermissions = async () => {
    try {
      const response = await getUserProjectPermissions(project._id);
      if (response.success) {
        setPermissions(response.data);
      }
    } catch (error) {
      console.error('Error cargando permisos:', error);
    }
  };

  // Manejar eliminación de miembro
  const handleRemoveMember = async (member) => {
    // Confirmación
    const memberName = member.user?.name || member.name || 'este usuario';
    const confirmRemove = window.confirm(
      `¿Estás seguro que deseas eliminar a ${memberName} del proyecto?\n\n` +
      `Esta acción no se puede deshacer y el usuario perderá acceso a:\n` +
      `• El proyecto y sus tareas\n` +
      `• El chat del proyecto\n` +
      `• Todos los datos relacionados`
    );

    if (!confirmRemove) return;

    try {
      setRemovingMember(member._id || member.user?._id);
      setLoading(true);

      console.log('🗑️ Eliminando miembro:', member);

      const userId = member.user?._id || member._id;
      const response = await removeTeamMember(project._id, userId);

      if (response.success) {
        console.log('✅ Miembro eliminado exitosamente');
        
        // Actualizar proyecto en el componente padre
        if (onProjectUpdate && response.data.project) {
          onProjectUpdate(response.data.project);
        }

        // Mostrar mensaje de éxito
        alert(`✅ ${memberName} ha sido eliminado del proyecto exitosamente`);
      }

    } catch (error) {
      console.error('❌ Error eliminando miembro:', error);
      alert(`❌ Error al eliminar miembro: ${error.message}`);
    } finally {
      setRemovingMember(null);
      setLoading(false);
    }
  };

  // Verificar si se puede eliminar un miembro
  const canRemoveMember = (member) => {
    const userId = member.user?._id || member._id;
    
    // No se puede eliminar al owner
    if (project.owner?._id === userId || project.owner === userId) {
      return false;
    }

    // No se puede eliminar a sí mismo (opcional, se puede permitir)
    if (currentUser?.id === userId) {
      return false;
    }

    // Verificar permisos
    return permissions.canRemoveMembers;
  };

  if (!project) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const owner = project.owner;
  const team = project.team || [];

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom">
        <div className="d-flex align-items-center">
          <i className="bi bi-people-fill text-primary me-2"></i>
          <h5 className="mb-0">👥 Equipo del Proyecto</h5>
          <span className="badge bg-primary ms-2">{team.length + 1} miembros</span>
        </div>
      </div>

      <div className="card-body">
        {/* PROPIETARIO */}
        <div className="mb-4">
          <h6 className="text-muted mb-3">
            <i className="bi bi-crown-fill text-warning me-1"></i>
            Propietario
          </h6>
          
          <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
            <div className="d-flex align-items-center">
              <div className="avatar-circle bg-warning text-white me-3">
                {owner?.name?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div>
                <div className="fw-semibold">{owner?.name || 'Propietario'}</div>
                <small className="text-muted">{owner?.email}</small>
              </div>
            </div>
            <span className="badge bg-warning">
              <i className="bi bi-crown-fill me-1"></i>
              Propietario
            </span>
          </div>
        </div>

        {/* MIEMBROS DEL EQUIPO */}
        <div>
          <h6 className="text-muted mb-3">
            <i className="bi bi-people me-1"></i>
            Miembros del Equipo
          </h6>

          {team.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-person-plus display-4 mb-3"></i>
              <p>No hay miembros en el equipo aún</p>
              <small>Agrega miembros para empezar a colaborar</small>
            </div>
          ) : (
            <div className="space-y-2">
              {team.map((member, index) => {
                const user = member.user || member;
                const userRole = member.role || USER_ROLES.VIEWER;
                const roleConfig = getRoleConfig(userRole);
                const userId = user._id || user.id;
                const canRemove = canRemoveMember(member);
                const isRemoving = removingMember === userId;

                return (
                  <div 
                    key={userId || index}
                    className="d-flex align-items-center justify-content-between p-3 border rounded hover-shadow transition-all"
                  >
                    <div className="d-flex align-items-center flex-grow-1">
                      {/* Avatar */}
                      <div className={`avatar-circle bg-${roleConfig.color} text-white me-3`}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>

                      {/* Info del usuario */}
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{user.name || 'Usuario'}</div>
                        <small className="text-muted">{user.email}</small>
                      </div>

                      {/* Badge del rol */}
                      <span className={`badge bg-${roleConfig.color} me-2`}>
                        <i className={`${roleConfig.icon} me-1`}></i>
                        {roleConfig.label}
                      </span>
                    </div>

                    {/* Botón eliminar */}
                    {canRemove && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemoveMember(member)}
                        disabled={loading || isRemoving}
                        title={`Eliminar a ${user.name} del proyecto`}
                      >
                        {isRemoving ? (
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Eliminando...</span>
                          </div>
                        ) : (
                          <i className="bi bi-trash"></i>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Información de permisos (solo para debug) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-info bg-opacity-10 rounded">
            <small>
              <strong>Debug - Permisos:</strong> 
              {permissions.canRemoveMembers ? ' ✅ Puede eliminar' : ' ❌ No puede eliminar'} | 
              {permissions.isOwner ? ' 👑 Es owner' : ' 👤 No es owner'} | 
              Rol: {permissions.userRole}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTeam;