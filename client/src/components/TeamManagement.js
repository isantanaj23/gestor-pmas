import React, { useState, useEffect } from 'react';

function TeamManagement({ project, onTeamUpdate }) {
  const [team, setTeam] = useState(project?.team || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [newMemberData, setNewMemberData] = useState({ 
    userId: '', 
    role: 'viewer',
    permissions: {
      canViewTasks: true,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canManageTeam: false,
      canEditProject: false
    }
  });

  // Sistema de roles y permisos
  const rolePermissions = {
    viewer: {
      canViewTasks: true,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canManageTeam: false,
      canEditProject: false
    },
    collaborator: {
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
      canEditProject: false
    },
    admin: {
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canManageTeam: true,
      canEditProject: true
    }
  };

  const roleLabels = {
    viewer: 'Visualizador',
    collaborator: 'Colaborador',
    manager: 'Gerente',
    admin: 'Administrador'
  };

  // Cargar usuarios disponibles
  useEffect(() => {
    const loadAvailableUsers = async () => {
      try {
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
    try {
      if (!newMemberData.userId) {
        alert('Por favor selecciona un usuario');
        return;
      }

      const selectedUser = availableUsers.find(user => user._id === newMemberData.userId);
      if (!selectedUser) {
        alert('Usuario no encontrado');
        return;
      }

      const newMember = {
        ...selectedUser,
        role: newMemberData.role,
        permissions: newMemberData.permissions,
        joinedAt: new Date().toISOString(),
        status: 'active'
      };

      const updatedTeam = [...team, newMember];
      setTeam(updatedTeam);
      
      if (onTeamUpdate) {
        onTeamUpdate(updatedTeam);
      }

      setShowAddModal(false);
      setNewMemberData({ 
        userId: '', 
        role: 'viewer',
        permissions: { ...rolePermissions.viewer }
      });

      console.log('Miembro agregado:', newMember);

    } catch (err) {
      console.error('Error al agregar miembro:', err);
      alert('Error al agregar miembro al equipo');
    }
  };

  // Cambiar rol
  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      const updatedTeam = team.map(member => 
        member._id === memberId 
          ? { 
              ...member, 
              role: newRole,
              permissions: { ...rolePermissions[newRole] }
            }
          : member
      );
      
      setTeam(updatedTeam);
      
      if (onTeamUpdate) {
        onTeamUpdate(updatedTeam);
      }

      console.log('Rol actualizado para miembro:', memberId);

    } catch (err) {
      console.error('Error al actualizar rol:', err);
      alert('Error al actualizar rol del miembro');
    }
  };

  // Remover miembro
  const handleRemoveMember = async (memberId) => {
    try {
      if (window.confirm('¿Estás seguro de que quieres remover este miembro del equipo?')) {
        const updatedTeam = team.filter(member => member._id !== memberId);
        setTeam(updatedTeam);
        
        if (onTeamUpdate) {
          onTeamUpdate(updatedTeam);
        }

        console.log('Miembro removido:', memberId);
      }
    } catch (err) {
      console.error('Error al remover miembro:', err);
      alert('Error al remover miembro del equipo');
    }
  };

  // Abrir modal de permisos
  const openPermissionsModal = (member) => {
    setSelectedMember(member);
    setShowPermissionsModal(true);
  };

  return (
    <div className="team-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">
          Gestión de Equipo 
          <span className="badge bg-primary ms-2">{team.length} miembros</span>
        </h5>
        <button 
          className="btn btn-success btn-sm"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-person-plus"></i> Agregar Miembro
        </button>
      </div>

      <div className="row">
        {team.map(member => (
          <div key={member._id} className="col-md-6 col-lg-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div 
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: '40px', height: '40px' }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-0">{member.name}</h6>
                    <small className="text-muted">{member.email}</small>
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
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveMember(member._id)}
                  >
                    <i className="bi bi-person-dash"></i> Remover
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {team.length === 0 && (
        <div className="text-center py-4">
          <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
          <h5 className="text-muted mt-3">No hay miembros en el equipo</h5>
          <p className="text-muted">Agrega miembros para colaborar en este proyecto</p>
        </div>
      )}

      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agregar Miembro al Equipo</h5>
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
                      <label className="form-label">Seleccionar Usuario</label>
                      <select 
                        className="form-select"
                        value={newMemberData.userId}
                        onChange={(e) => setNewMemberData({...newMemberData, userId: e.target.value})}
                      >
                        <option value="">Selecciona un usuario...</option>
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