// client/src/components/RoleTestingPanel.js - Panel para probar roles

import React, { useState, useEffect } from 'react';
import { 
  USER_ROLES, 
  getPermissions, 
  getAllRoles, 
  checkPermission,
  getRoleConfig 
} from '../utils/roles';

const RoleTestingPanel = ({ currentUser, project }) => {
  const [selectedRole, setSelectedRole] = useState(currentUser?.role || USER_ROLES.VIEWER);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (selectedRole) {
      const rolePermissions = getPermissions(selectedRole);
      setPermissions(rolePermissions);
    }
  }, [selectedRole]);

  const allRoles = getAllRoles();
  const roleConfig = getRoleConfig(selectedRole);

  // Test functions para verificar cada permiso
  const testPermissions = [
    { key: 'canCreateProjects', label: 'Crear Proyectos', icon: 'bi-plus-circle' },
    { key: 'canEditProjects', label: 'Editar Proyectos', icon: 'bi-pencil' },
    { key: 'canDeleteProjects', label: 'Eliminar Proyectos', icon: 'bi-trash' },
    { key: 'canViewAllProjects', label: 'Ver Todos los Proyectos', icon: 'bi-eye' },
    { key: 'canManageProjectMembers', label: 'Gestionar Miembros', icon: 'bi-people' },
    { key: 'canManageTeam', label: 'Gestionar Equipo', icon: 'bi-person-gear' },
    { key: 'canRemoveUsers', label: 'Eliminar Usuarios', icon: 'bi-person-dash' },
    { key: 'canChangeUserRoles', label: 'Cambiar Roles', icon: 'bi-shield-check' },
    { key: 'canViewAllUsers', label: 'Ver Todos los Usuarios', icon: 'bi-people-fill' },
    { key: 'canCreateChannels', label: 'Crear Canales', icon: 'bi-chat-square-dots' },
    { key: 'canDeleteChannels', label: 'Eliminar Canales', icon: 'bi-chat-square-x' },
    { key: 'canManageChannels', label: 'Gestionar Canales', icon: 'bi-chat-square-text' },
    { key: 'canSendMessages', label: 'Enviar Mensajes', icon: 'bi-chat-left-text' },
    { key: 'canDeleteMessages', label: 'Eliminar Mensajes', icon: 'bi-chat-left-x' },
    { key: 'canViewReports', label: 'Ver Reportes', icon: 'bi-graph-up' },
    { key: 'canExportData', label: 'Exportar Datos', icon: 'bi-download' },
    { key: 'canManageCRM', label: 'Gestionar CRM', icon: 'bi-person-rolodex' },
    { key: 'canViewCRM', label: 'Ver CRM', icon: 'bi-eye-fill' }
  ];

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-shield-check me-2"></i>
          🧪 Panel de Verificación de Roles
        </h5>
      </div>
      
      <div className="card-body">
        {/* Selector de Rol */}
        <div className="row mb-4">
          <div className="col-md-6">
            <label className="form-label fw-bold">
              <i className="bi bi-person-badge me-1"></i>
              Seleccionar Rol para Probar:
            </label>
            <select 
              className="form-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {allRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-md-6">
            <label className="form-label fw-bold">Información del Rol:</label>
            <div className="d-flex align-items-center">
              <span className={`badge bg-${roleConfig.color} me-2`}>
                <i className={`${roleConfig.icon} me-1`}></i>
                {roleConfig.label}
              </span>
              <small className="text-muted">{roleConfig.description}</small>
            </div>
          </div>
        </div>

        {/* Grid de Permisos */}
        <div className="row">
          <div className="col-12">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-list-check me-1"></i>
              Permisos del Rol: <span className="text-primary">{roleConfig.label}</span>
            </h6>
            
            <div className="row">
              {testPermissions.map(permission => {
                const hasPermission = checkPermission(selectedRole, permission.key);
                return (
                  <div key={permission.key} className="col-md-6 col-lg-4 mb-2">
                    <div className={`d-flex align-items-center p-2 rounded ${hasPermission ? 'bg-success bg-opacity-10 border border-success border-opacity-25' : 'bg-danger bg-opacity-10 border border-danger border-opacity-25'}`}>
                      <i className={`${permission.icon} me-2 ${hasPermission ? 'text-success' : 'text-danger'}`}></i>
                      <span className={`small ${hasPermission ? 'text-success' : 'text-danger'}`}>
                        {permission.label}
                      </span>
                      <i className={`ms-auto ${hasPermission ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`}></i>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Casos de Uso Específicos */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="border-top pt-3">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-lightbulb me-1"></i>
                📋 Casos de Uso para el Rol {roleConfig.label}:
              </h6>
              
              {selectedRole === USER_ROLES.VIEWER && (
                <div className="alert alert-info">
                  <h6><i className="bi bi-eye me-1"></i> Rol VIEWER - Solo Lectura + Chat:</h6>
                  <ul className="mb-0">
                    <li>✅ Puede <strong>ver</strong> proyectos asignados</li>
                    <li>✅ Puede <strong>enviar mensajes</strong> en el chat</li>
                    <li>❌ <strong>NO puede</strong> crear, editar o eliminar proyectos</li>
                    <li>❌ <strong>NO puede</strong> gestionar miembros del equipo</li>
                    <li>❌ <strong>NO puede</strong> ver reportes o exportar datos</li>
                    <li>🎯 <strong>Ideal para:</strong> Clientes, stakeholders, observadores</li>
                  </ul>
                </div>
              )}

              {selectedRole === USER_ROLES.DEVELOPER && (
                <div className="alert alert-primary">
                  <h6><i className="bi bi-code-slash me-1"></i> Rol DEVELOPER - Trabajo en Proyectos:</h6>
                  <ul className="mb-0">
                    <li>✅ Puede <strong>enviar mensajes</strong> y colaborar</li>
                    <li>✅ Puede <strong>ver usuarios</strong> del equipo</li>
                    <li>❌ <strong>NO puede</strong> gestionar proyectos o miembros</li>
                    <li>🎯 <strong>Ideal para:</strong> Desarrolladores, programadores</li>
                  </ul>
                </div>
              )}

              {selectedRole === USER_ROLES.MANAGER && (
                <div className="alert alert-warning">
                  <h6><i className="bi bi-person-gear me-1"></i> Rol MANAGER - Gestión de Proyectos:</h6>
                  <ul className="mb-0">
                    <li>✅ Puede <strong>crear y gestionar</strong> proyectos</li>
                    <li>✅ Puede <strong>gestionar miembros</strong> del equipo</li>
                    <li>✅ Puede <strong>ver reportes</strong> y exportar datos</li>
                    <li>❌ <strong>NO puede</strong> cambiar roles de usuario</li>
                    <li>🎯 <strong>Ideal para:</strong> Project managers, team leads</li>
                  </ul>
                </div>
              )}

              {selectedRole === USER_ROLES.ADMIN && (
                <div className="alert alert-danger">
                  <h6><i className="bi bi-shield-fill me-1"></i> Rol ADMIN - Control Total:</h6>
                  <ul className="mb-0">
                    <li>✅ <strong>TODOS</strong> los permisos habilitados</li>
                    <li>✅ Puede <strong>cambiar roles</strong> de usuarios</li>
                    <li>✅ Puede <strong>eliminar usuarios</strong> del sistema</li>
                    <li>🎯 <strong>Ideal para:</strong> Administradores del sistema</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div className="row mt-3">
          <div className="col-12">
            <button 
              className="btn btn-outline-primary"
              onClick={() => {
                console.log('🧪 Testing Role:', selectedRole);
                console.log('🧪 Permissions:', permissions);
                alert(`Rol ${roleConfig.label} verificado. Revisa la consola para detalles.`);
              }}
            >
              <i className="bi bi-play-circle me-1"></i>
              Probar Rol en Consola
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleTestingPanel;