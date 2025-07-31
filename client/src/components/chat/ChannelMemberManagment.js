// client/src/components/chat/ChannelMemberManagement.js

import React, { useState, useEffect } from 'react';
import useSocket from '../../hooks/useSocket';
import API from '../../services/api';

const ChannelMemberManagement = ({
  channelId,
  channelName,
  projectId,
  projectMembers = [],
  channelMembers = [],
  onMemberAdded,
  onMemberRemoved,
  currentUser,
  canManage = false
}) => {
  const { 
    connected: socketConnected, 
    addMemberToChannel, 
    removeMemberFromChannel 
  } = useSocket();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 🎨 Función para mostrar notificaciones
  const showNotification = (type, title, message, color = 'primary') => {
    const event = new CustomEvent('show-notification', {
      detail: { type, title, message, color }
    });
    window.dispatchEvent(event);
  };

  // 🔍 Filtrar miembros disponibles para agregar
  const availableMembers = projectMembers.filter(member => 
    !channelMembers.some(channelMember => channelMember._id === member._id) &&
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔍 Filtrar miembros actuales del canal
  const currentChannelMembers = channelMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ➕ Agregar miembro al canal
  const handleAddMember = async (member) => {
    if (!canManage) {
      showNotification('warning', 'Sin permisos', 'No tienes permisos para gestionar este canal', 'warning');
      return;
    }

    setLoading(true);
    
    try {
      // Usar Socket.IO si está conectado
      if (socketConnected) {
        const success = addMemberToChannel(channelId, member._id, projectId);
        if (!success) {
          throw new Error('No se pudo enviar la solicitud via Socket.IO');
        }
      }

      // También hacer llamada REST API
      const response = await API.post(`/channels/${channelId}/members`, {
        memberId: member._id
      });

      if (response.data?.success) {
        showNotification('success', 'Miembro agregado', `${member.name} fue agregado al canal #${channelName}`, 'success');
        if (onMemberAdded) {
          onMemberAdded(member);
        }
      }

    } catch (error) {
      console.error('❌ Error agregando miembro al canal:', error);
      showNotification('error', 'Error', `No se pudo agregar a ${member.name}: ${error.response?.data?.message || error.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ➖ Remover miembro del canal
  const handleRemoveMember = async (member, reason = 'removed_by_admin') => {
    if (!canManage) {
      showNotification('warning', 'Sin permisos', 'No tienes permisos para gestionar este canal', 'warning');
      return;
    }

    if (member._id === currentUser?.id) {
      showNotification('warning', 'No permitido', 'No puedes removerte a ti mismo del canal', 'warning');
      return;
    }

    // Confirmar acción
    const confirmed = window.confirm(`¿Estás seguro que deseas remover a ${member.name} del canal #${channelName}?`);
    if (!confirmed) return;

    setLoading(true);

    try {
      // Usar Socket.IO si está conectado
      if (socketConnected) {
        const success = removeMemberFromChannel(channelId, member._id, projectId, reason);
        if (!success) {
          throw new Error('No se pudo enviar la solicitud via Socket.IO');
        }
      }

      // También hacer llamada REST API
      const response = await API.delete(`/channels/${channelId}/members/${member._id}`, {
        data: { reason }
      });

      if (response.data?.success) {
        showNotification('success', 'Miembro removido', `${member.name} fue removido del canal #${channelName}`, 'success');
        if (onMemberRemoved) {
          onMemberRemoved(member._id);
        }
      }

    } catch (error) {
      console.error('❌ Error removiendo miembro del canal:', error);
      showNotification('error', 'Error', `No se pudo remover a ${member.name}: ${error.response?.data?.message || error.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Generar avatar
  const generateAvatarUrl = (name) => {
    const initial = name?.charAt(0)?.toUpperCase() || 'U';
    const colors = ['28a745', 'dc3545', '007bff', 'ffc107', '6f42c1', '17a2b8'];
    const colorIndex = name?.length % colors.length || 0;
    return `https://placehold.co/32x32/${colors[colorIndex]}/white?text=${initial}`;
  };

  return (
    <div className="channel-member-management">
      {/* 🔍 Barra de búsqueda */}
      <div className="mb-3">
        <div className="input-group input-group-sm">
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar miembros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 📊 Estadísticas del canal */}
      <div className="mb-3">
        <div className="row text-center">
          <div className="col-4">
            <div className="small text-muted">En canal</div>
            <div className="fw-bold text-primary">{currentChannelMembers.length}</div>
          </div>
          <div className="col-4">
            <div className="small text-muted">Disponibles</div>
            <div className="fw-bold text-success">{availableMembers.length}</div>
          </div>
          <div className="col-4">
            <div className="small text-muted">Total</div>
            <div className="fw-bold text-secondary">{projectMembers.length}</div>
          </div>
        </div>
      </div>

      {/* 👥 Miembros actuales del canal */}
      <div className="mb-4">
        <h6 className="text-primary border-bottom pb-2">
          <i className="bi bi-people-fill me-2"></i>
          En el canal #{channelName} ({currentChannelMembers.length})
        </h6>
        
        {currentChannelMembers.length === 0 ? (
          <div className="text-center text-muted py-3">
            <i className="bi bi-people fs-4 d-block mb-2 opacity-50"></i>
            <p className="small">No hay miembros en este canal</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {currentChannelMembers.map((member) => {
              const isCurrentUser = member._id === currentUser?.id;
              const canRemoveThisMember = canManage && !member.isOwner && !isCurrentUser;
              
              return (
                <div key={member._id} className="list-group-item px-0 py-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center flex-grow-1">
                      <img 
                        src={generateAvatarUrl(member.name)}
                        className="rounded-circle me-3"
                        style={{ width: '32px', height: '32px' }}
                        alt={member.name}
                      />
                      <div className="flex-grow-1 min-width-0">
                        <div className="fw-semibold text-truncate">
                          {member.name}
                          {isCurrentUser && <span className="text-muted small"> (Tú)</span>}
                          {member.isOwner && <span className="badge bg-warning text-dark ms-2">Owner</span>}
                        </div>
                        <small className="text-muted">
                          {member.email} • {member.role || 'Miembro'}
                        </small>
                      </div>
                    </div>
                    
                    {canRemoveThisMember && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveMember(member)}
                        disabled={loading}
                        title={`Remover ${member.name} del canal`}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ➕ Miembros disponibles para agregar */}
      {canManage && (
        <div>
          <h6 className="text-success border-bottom pb-2">
            <i className="bi bi-person-plus-fill me-2"></i>
            Agregar miembros ({availableMembers.length})
          </h6>
          
          {availableMembers.length === 0 ? (
            <div className="text-center text-muted py-3">
              <i className="bi bi-check-all fs-4 d-block mb-2 opacity-50"></i>
              <p className="small">
                {searchTerm ? 'No se encontraron miembros con ese nombre' : 'Todos los miembros ya están en el canal'}
              </p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {availableMembers.map((member) => (
                <div key={member._id} className="list-group-item px-0 py-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center flex-grow-1">
                      <img 
                        src={generateAvatarUrl(member.name)}
                        className="rounded-circle me-3"
                        style={{ width: '32px', height: '32px' }}
                        alt={member.name}
                      />
                      <div className="flex-grow-1 min-width-0">
                        <div className="fw-semibold text-truncate">
                          {member.name}
                          {member.isOwner && <span className="badge bg-warning text-dark ms-2">Owner</span>}
                        </div>
                        <small className="text-muted">
                          {member.email} • {member.role || 'Miembro'}
                        </small>
                      </div>
                    </div>
                    
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleAddMember(member)}
                      disabled={loading}
                      title={`Agregar ${member.name} al canal`}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🔄 Indicador de carga */}
      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <small className="text-muted">Procesando...</small>
        </div>
      )}

      {/* ⚠️ Mensaje de permisos */}
      {!canManage && (
        <div className="alert alert-info alert-sm mt-3">
          <i className="bi bi-info-circle me-2"></i>
          <small>Solo los administradores pueden gestionar miembros de canales.</small>
        </div>
      )}

      {/* 🔌 Estado de conexión */}
      {!socketConnected && (
        <div className="alert alert-warning alert-sm mt-3">
          <i className="bi bi-wifi-off me-2"></i>
          <small>Desconectado - Los cambios pueden no sincronizarse en tiempo real.</small>
        </div>
      )}
    </div>
  );
};

export default ChannelMemberManagement;