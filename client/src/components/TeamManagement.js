// client/src/components/TeamManagement.js - VERSIÓN LIMPIA CON NOTIFICACIONES

import React, { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';

function TeamManagement({ project, onTeamUpdate }) {
  const [team, setTeam] = useState(project?.team || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [newMemberData, setNewMemberData] = useState({ 
    userId: '', 
    role: 'developer',
    permissions: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canManageTeam: false,
      canEditProject: false
    }
  });

  // 🎨 Sistema de notificaciones usando el existente
  const showNotification = (type, title, message, color = 'primary') => {
    // Crear notificación personalizada usando el sistema existente
    const event = new CustomEvent('show-notification', {
      detail: {
        type: type,
        title: title,
        message: message,
        icon: type === 'success' ? 'bi-check-circle' : 
              type === 'error' ? 'bi-x-circle' : 
              type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle',
        color: color
      }
    });
    window.dispatchEvent(event);
  };

  // Sistema de roles y permisos - CORREGIDOS
  const rolePermissions = {
    viewer: {
      canViewTasks: true,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canManageTeam: false,
      canEditProject: false
    },
    developer: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canManageTeam: false,
      canEditProject: false
    },
    designer: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canManageTeam: false,
      canEditProject: false
    },
    tester: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canManageTeam: false,
      canEditProject: false
    },
    manager: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canManageTeam: true,
      canEditProject: true
    },
    admin: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canManageTeam: true,
      canEditProject: true
    },
    client: {
      canViewTasks: true,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canManageTeam: false,
      canEditProject: false
    }
  };

  const roleLabels = {
    viewer: 'Visualizador',
    developer: 'Desarrollador',
    designer: 'Diseñador',
    tester: 'Tester/QA',
    manager: 'Gerente',
    admin: 'Administrador',
    client: 'Cliente'
  };

  // Cargar usuarios disponibles
  useEffect(() => {
    const loadAvailableUsers = async () => {
      try {
        // En el proyecto real, esto vendría de la API
        const users = [
          { _id: 'user1', name: 'Roberto Vega', email: 'roberto@empresa.com' },
          { _id: 'user2', name: 'Carmen Torres', email: 'carmen@empresa.com' },
          { _id: 'user3', name: 'Fernando Ruiz', email: 'fernando@empresa.com' },
          { _id: 'user4', name: 'Patricia Luna', email: 'patricia@empresa.com' }
        ];
        
        const currentTeamIds = team.map(member => member._id);
        const available = users.filter(user => !currentTeamIds.includes(user._id));
        
        setAvailableUsers(available);
      } catch (err) {
        console.error('Error cargando usuarios:', err);
        showNotification('error', 'Error', 'No se pudieron cargar los usuarios disponibles', 'danger');
      }
    };

    if (showAddModal) {
      loadAvailableUsers();
    }
  }, [showAddModal, team]);

  // Actualizar permisos cuando cambia el rol
  useEffect(() => {
    if (newMemberData.role) {
      setNewMemberData(prev => ({
        ...prev,
        permissions: { ...rolePermissions[prev.role] }
      }));
    }
  }, [newMemberData.role]);

  // Agregar miembro
  const handleAddMember = async () => {
    if (!newMemberData.userId) {
      showNotification('warning', 'Atención', 'Por favor selecciona un usuario', 'warning');
      return;
    }

    try {
      const response = await projectService.addMemberToProject(project._id, {
        userId: newMemberData.userId,
        role: newMemberData.role
      });

      if (response.success) {
        const addedUser = availableUsers.find(u => u._id === newMemberData.userId);
        
        // ✅ NOTIFICACIÓN EN LUGAR DE ALERT
        showNotification(
          'success', 
          '¡Miembro agregado!', 
          `${addedUser.name} fue agregado como ${roleLabels[newMemberData.role]} al equipo`,
          'success'
        );

        setTeam(response.data.team || []);
        setShowAddModal(false);
        setNewMemberData({ userId: '', role: 'developer', permissions: rolePermissions.developer });
        
        if (onTeamUpdate) onTeamUpdate(response.data);
      } else {
        showNotification('error', 'Error', response.message || 'No se pudo agregar el miembro', 'danger');
      }
    } catch (error) {
      console.error('Error agregando miembro:', error);
      showNotification('error', 'Error', 'Error del servidor al agregar miembro', 'danger');
    }
  };

  // Remover miembro
  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      const response = await projectService.removeMemberFromProject(project._id, selectedMember._id);

      if (response.success) {
        // ✅ NOTIFICACIÓN EN LUGAR DE ALERT
        showNotification(
          'success',
          'Miembro removido',
          `${selectedMember.name} fue removido del equipo`,
          'info'
        );

        setTeam(prev => prev.filter(member => member._id !== selectedMember._id));
        setShowRemoveModal(false);
        setSelectedMember(null);
        
        if (onTeamUpdate) onTeamUpdate({ team: team.filter(m => m._id !== selectedMember._id) });
      } else {
        showNotification('error', 'Error', response.message || 'No se pudo remover el miembro', 'danger');
      }
    } catch (error) {
      console.error('Error removiendo miembro:', error);
      showNotification('error', 'Error', 'Error del servidor al remover miembro', 'danger');
    }
  };

  // Cambiar rol de miembro
  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      const response = await projectService.updateMemberRole(project._id, memberId, newRole);

      if (response.success) {
        const member = team.find(m => m._id === memberId);
        
        // ✅ NOTIFICACIÓN EN LUGAR DE ALERT
        showNotification(
          'success',
          'Rol actualizado',
          `El rol de ${member.name} fue cambiado a ${roleLabels[newRole]}`,
          'info'
        );

        setTeam(prev => prev.map(member => 
          member._id === memberId 
            ? { ...member, role: newRole, permissions: rolePermissions[newRole] }
            : member
        ));
      } else {
        showNotification('error', 'Error', response.message || 'No se pudo actualizar el rol', 'danger');
      }
    } catch (error) {
      console.error('Error actualizando rol:', error);
      showNotification('error', 'Error', 'Error del servidor al actualizar rol', 'danger');
    }
  };

  const openRemoveModal = (member) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  const openPermissionsModal = (member) => {
    setSelectedMember({
      ...member,
      permissions: rolePermissions[member.role] || {}
    });
    setShowPermissionsModal(true);
  };

  // Construir lista de miembros con owner
  const allMembers = [
    // Owner
    {
      ...project.owner,
      projectRole: 'owner',
      role: 'owner',
      isOwner: true,
      canBeRemoved: false,
      joinedAt: project.createdAt,
      permissions: rolePermissions.admin
    },
    // Team members
    ...team.map(teamMember => ({
      ...teamMember,
      projectRole: teamMember.role,
      isOwner: false,
      canBeRemoved: true,
      permissions: rolePermissions[teamMember.role] || {}
    }))
  ];

  return (
    <div className="team-management">
      {/* Header con botón para agregar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">
            <i className="bi bi-people-fill me-2"></i>
            Miembros del Equipo
          </h5>
          <small className="text-muted">{allMembers.length} miembros</small>
        </div>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-person-plus me-1"></i>
          Agregar Miembro
        </button>
      </div>

      {/* Lista de miembros */}
      <div className="row">
        {allMembers.map(member => (
          <div key={member._id} className="col-md-6 col-lg-4 mb-3">
            <div className="card h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center mb-3">
                  <img
                    src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=50&background=random`}
                    alt={member.name}
                    className="rounded-circle me-3"
                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                  />
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center">
                      <h6 className="mb-0 text-truncate">{member.name}</h6>
                      {member.isOwner && (
                        <span className="badge bg-warning ms-2">Propietario</span>
                      )}
                    </div>
                    <div className="small text-muted text-truncate">{member.email}</div>
                    {member.department && (
                      <div><small className="text-muted">{member.department}</small></div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small">Rol:</label>
                  <select
                    className="form-select form-select-sm"
                    value={member.role}
                    onChange={(e) => handleUpdateMemberRole(member._id, e.target.value)}
                    disabled={member.isOwner}
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <small className="text-muted d-block mb-1">Permisos:</small>
                  <div className="d-flex flex-wrap gap-1">
                    {member.permissions?.canCreateTasks && (
                      <span className="badge bg-success">Crear</span>
                    )}
                    {member.permissions?.canEditTasks && (
                      <span className="badge bg-warning">Editar</span>
                    )}
                    {member.permissions?.canDeleteTasks && (
                      <span className="badge bg-danger">Eliminar</span>
                    )}
                    {member.permissions?.canManageTeam && (
                      <span className="badge bg-info">Gestionar</span>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <button 
                    className="btn btn-sm btn-outline-info"
                    onClick={() => openPermissionsModal(member)}
                  >
                    <i className="bi bi-gear"></i> Permisos
                  </button>
                  {member.canBeRemoved && (
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => openRemoveModal(member)}
                    >
                      <i className="bi bi-person-dash"></i> Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para agregar miembro */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  Agregar Miembro al Equipo
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Usuario</label>
                      <select 
                        className="form-select"
                        value={newMemberData.userId}
                        onChange={(e) => setNewMemberData({...newMemberData, userId: e.target.value})}
                      >
                        <option value="">Seleccionar usuario...</option>
                        {availableUsers.map(user => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Rol</label>
                      <select 
                        className="form-select"
                        value={newMemberData.role}
                        onChange={(e) => setNewMemberData({...newMemberData, role: e.target.value})}
                      >
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <h6>Permisos del rol seleccionado:</h6>
                    <div className="border rounded p-3">
                      {Object.entries(newMemberData.permissions).map(([permission, value]) => (
                        <div key={permission} className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={value}
                            readOnly
                            disabled
                          />
                          <label className="form-check-label small">
                            {permission.replace('can', '').replace(/([A-Z])/g, ' $1')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleAddMember}
                  disabled={!newMemberData.userId}
                >
                  Agregar al Equipo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para remover miembro */}
      {showRemoveModal && selectedMember && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-dash me-2"></i>
                  Remover Miembro
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowRemoveModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>¿Estás seguro?</strong>
                </div>
                <p>
                  Vas a remover a <strong>{selectedMember.name}</strong> del equipo. 
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowRemoveModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleRemoveMember}
                >
                  Remover del Equipo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de permisos */}
      {showPermissionsModal && selectedMember && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Permisos de {selectedMember.name}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPermissionsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-1"></i>
                  Rol actual: <strong>{roleLabels[selectedMember.role]}</strong>
                </div>
                
                <h6>Permisos detallados:</h6>
                {Object.entries(selectedMember.permissions || {}).map(([permission, value]) => (
                  <div key={permission} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span>{permission.replace('can', '').replace(/([A-Z])/g, ' $1')}</span>
                    <span className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}>
                      {value ? 'Permitido' : 'Denegado'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowPermissionsModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;