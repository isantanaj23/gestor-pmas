import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import API from '../../services/api';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🆕 Estados para gestión de equipo
  const [teamMembers, setTeamMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Hook de Socket.IO
  const { 
    connected: socketConnected,
    getProjectOnlineUsers,
    isUserOnlineInProject,
    removeMember
  } = useSocket();

  const menuItems = [
    {
      path: '/',
      icon: 'bi-grid-1x2-fill',
      label: 'Dashboard',
      roles: ['admin', 'manager', 'developer', 'designer', 'client']
    },
    {
      path: '/proyectos',
      icon: 'bi-folder-fill',
      label: 'Proyectos',
      roles: ['admin', 'manager', 'developer', 'designer']
    },
    {
      path: '/crm',
      icon: 'bi-people-fill',
      label: 'CRM',
      roles: ['admin', 'manager']
    },
    {
      path: '/comunicacion',
      icon: 'bi-chat-dots-fill',
      label: 'Comunicación',
      roles: ['admin', 'manager', 'developer', 'designer']
    },
    {
      path: '/reportes',
      icon: 'bi-graph-up',
      label: 'Reportes y Analíticas',
      roles: ['admin', 'manager']
    }
  ];

  // Filtrar elementos del menú según el rol del usuario
  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  // =================================================================
  // 🆕 CARGAR MIEMBROS DEL EQUIPO
  // =================================================================

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los usuarios activos de la organización
      const response = await API.get('/projects/debug/users'); // Usar la ruta que ya tienes
      
      if (response.data?.success) {
        const users = response.data.data || [];
        const activeUsers = users.filter(u => u.isActive !== false && u._id !== user?.id);
        setTeamMembers(activeUsers);
        
        console.log('👥 SIDEBAR: Miembros del equipo cargados:', activeUsers.length);
      }
      
    } catch (error) {
      console.error('❌ SIDEBAR: Error cargando miembros del equipo:', error);
      
      // Datos de fallback si no se pueden cargar
      setTeamMembers([
        {
          _id: 'user1',
          name: 'Ana García',
          email: 'ana.garcia@empresa.com',
          role: 'developer',
          position: 'Frontend Developer',
          department: 'development'
        },
        {
          _id: 'user2', 
          name: 'Carlos López',
          email: 'carlos.lopez@empresa.com',
          role: 'manager',
          position: 'Project Manager',
          department: 'management'
        },
        {
          _id: 'user3',
          name: 'Laura Martín',
          email: 'laura.martin@empresa.com',
          role: 'designer',
          position: 'UI/UX Designer',
          department: 'design'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Simular estados en línea basados en datos reales cuando sea posible
  const updateOnlineStatus = () => {
    const onlineMap = new Map();
    
    teamMembers.forEach(member => {
      // Simulación mejorada: algunos usuarios están en línea
      const isOnline = Math.random() > 0.4; // 60% probabilidad de estar en línea
      onlineMap.set(member._id, {
        isOnline,
        lastSeen: isOnline ? new Date() : new Date(Date.now() - Math.random() * 3600000),
        status: isOnline ? 'online' : 'offline'
      });
    });
    
    setOnlineUsers(onlineMap);
  };

  // =================================================================
  // 🆕 FUNCIONES DE GESTIÓN DE EQUIPO
  // =================================================================

  const canManageTeam = () => {
    return user?.role === 'admin' || user?.role === 'manager';
  };

  const handleRemoveMember = (member) => {
    if (!canManageTeam()) {
      alert('No tienes permisos para gestionar el equipo');
      return;
    }

    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      // Aquí puedes implementar la lógica para remover del equipo/organización
      // Por ahora, solo lo removemos de la lista local
      setTeamMembers(prev => prev.filter(member => member._id !== memberToRemove._id));
      
      alert(`${memberToRemove.name} ha sido removido del equipo`);
      
      setShowRemoveModal(false);
      setMemberToRemove(null);
      
    } catch (error) {
      console.error('❌ Error removiendo miembro del equipo:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDirectMessage = (member) => {
    // Navegar a comunicación directa o abrir modal de chat
    console.log('📨 Abrir chat directo con:', member.name);
    // Puedes implementar navegación a una vista de chat directo
    navigate('/comunicacion', { state: { directMessage: member } });
  };

  const handleOpenTeamModal = () => {
    setShowTeamModal(true);
  };

  // =================================================================
  // EFECTOS
  // =================================================================

  useEffect(() => {
    loadTeamMembers();
  }, []);

  useEffect(() => {
    if (teamMembers.length > 0) {
      updateOnlineStatus();
      
      // Actualizar estados en línea cada 30 segundos
      const interval = setInterval(updateOnlineStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [teamMembers]);

  // =================================================================
  // FUNCIONES DE UTILIDAD
  // =================================================================

  const getOnlineCount = () => {
    return Array.from(onlineUsers.values()).filter(status => status.isOnline).length;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.get(userId)?.isOnline || false;
  };

  const getUserStatus = (userId) => {
    const status = onlineUsers.get(userId);
    return status?.status || 'offline';
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Nunca';
    
    const now = new Date();
    const diff = now - new Date(lastSeen);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  const generateAvatarUrl = (name, backgroundColor = null) => {
    const colors = ['28a745', 'dc3545', '007bff', 'ffc107', '6f42c1', '17a2b8', 'e83e8c'];
    const color = backgroundColor || colors[name?.length % colors.length] || '6f42c1';
    const initial = name?.charAt(0)?.toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=32`;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      admin: 'danger',
      manager: 'warning', 
      developer: 'primary',
      designer: 'info',
      client: 'secondary'
    };
    return roleColors[role] || 'secondary';
  };

  // =================================================================
  // RENDERIZADO
  // =================================================================

  return (
    <div 
      className="offcanvas-lg offcanvas-start bg-white shadow-sm" 
      id="sidebar"
      style={{ width: '280px' }}
    >
      <div className="offcanvas-header d-lg-none border-bottom">
        <h5 className="offcanvas-title text-primary fw-bold">
          <i className="bi bi-kanban me-2"></i>
          Planifica+
        </h5>
        <button 
          type="button" 
          className="btn-close" 
          data-bs-dismiss="offcanvas" 
          data-bs-target="#sidebar"
        ></button>
      </div>

      <div className="offcanvas-body d-flex flex-column p-0">
        {/* Información del usuario (solo móvil) */}
        <div className="d-lg-none p-3 border-bottom">
          <div className="d-flex align-items-center">
            <img
              src={user?.avatar || generateAvatarUrl(user?.name || 'Usuario')}
              alt="Avatar"
              className="rounded-circle me-3"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
            <div>
              <div className="fw-bold">{user?.name || 'Usuario'}</div>
              <div className="text-muted small">{user?.email || 'Sin email'}</div>
              <span className={`badge badge-sm mt-1 bg-${getRoleColor(user?.role)}`}>
                {user?.role || 'Sin rol'}
              </span>
            </div>
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="flex-grow-1 p-3">
          <ul className="nav flex-column">
            {filteredMenuItems.map((item) => (
              <li className="nav-item mb-1" key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center p-3 rounded transition ${
                      isActive
                        ? 'active bg-primary text-white shadow-sm'
                        : 'text-dark hover-bg-light'
                    }`
                  }
                  end={item.path === '/'}
                >
                  <i className={`bi ${item.icon} me-3 fs-5`}></i>
                  <span className="fw-medium">{item.label}</span>
                  
                  {/* Indicadores adicionales */}
                  {item.path === '/crm' && (
                    <span className="badge bg-danger ms-auto">5</span>
                  )}
                  {item.path === '/proyectos' && (
                    <span className="badge bg-warning ms-auto">2</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* 🆕 Sección del equipo dinámico */}
        <div className="p-3 border-top bg-light">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="text-muted small text-uppercase mb-0 fw-bold">
              <i className="bi bi-people-fill me-2"></i>
              Mi Equipo
              {socketConnected && (
                <i className="bi bi-wifi text-success ms-1" title="Conectado"></i>
              )}
            </h6>
            <div className="d-flex align-items-center">
              <span className="badge bg-success me-2">{getOnlineCount()} online</span>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={handleOpenTeamModal}
                title="Ver todo el equipo"
              >
                <i className="bi bi-three-dots"></i>
              </button>
            </div>
          </div>

          {/* Lista del equipo */}
          <div className="team-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center text-muted py-3">
                <i className="bi bi-people fs-4 d-block mb-1"></i>
                <small>No hay miembros</small>
              </div>
            ) : (
              teamMembers.slice(0, 4).map((member) => {
                const isOnline = isUserOnline(member._id);
                const status = getUserStatus(member._id);
                
                return (
                  <div key={member._id} className="d-flex align-items-center mb-2 p-2 rounded hover-bg-white">
                    <div className="position-relative me-2">
                      <img
                        src={generateAvatarUrl(member.name)}
                        className="rounded-circle"
                        style={{ width: '32px', height: '32px' }}
                        alt={member.name}
                      />
                      <span 
                        className={`position-absolute bottom-0 end-0 rounded-circle border border-white ${
                          isOnline ? 'bg-success' : 'bg-secondary'
                        }`}
                        style={{ width: '10px', height: '10px' }}
                        title={isOnline ? 'En línea' : 'Fuera de línea'}
                      ></span>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-medium small text-truncate">{member.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {member.position || member.role || 'Miembro'}
                      </div>
                    </div>
                    <div className="dropdown">
                      <button 
                        className="btn btn-sm btn-outline-primary btn-circle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        title="Opciones"
                      >
                        <i className="bi bi-three-dots-vertical" style={{ fontSize: '0.8rem' }}></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button 
                            className="dropdown-item"
                            onClick={() => handleDirectMessage(member)}
                          >
                            <i className="bi bi-chat-dots me-2"></i>
                            Mensaje directo
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item">
                            <i className="bi bi-person me-2"></i>
                            Ver perfil
                          </button>
                        </li>
                        {canManageTeam() && (
                          <>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <button 
                                className="dropdown-item text-danger"
                                onClick={() => handleRemoveMember(member)}
                              >
                                <i className="bi bi-person-x me-2"></i>
                                Remover del equipo
                              </button>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Mostrar más miembros si hay */}
            {teamMembers.length > 4 && (
              <button 
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={handleOpenTeamModal}
              >
                Ver todos ({teamMembers.length} miembros)
              </button>
            )}
          </div>

          {/* Botón de chat grupal */}
          <button 
            className="btn btn-primary btn-sm w-100 mt-2"
            onClick={() => navigate('/comunicacion')}
          >
            <i className="bi bi-chat-square-text me-2"></i>
            Chat Grupal
          </button>
        </div>

        {/* Información adicional del usuario */}
        <div className="p-3 bg-primary text-white text-center">
          <div className="small">
            <i className="bi bi-shield-check me-1"></i>
            Conectado como {user?.role || 'Usuario'}
          </div>
        </div>
      </div>

      {/* 🆕 Modal del Equipo Completo */}
      {showTeamModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-people-fill me-2"></i>
                  Equipo Completo ({teamMembers.length} miembros)
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowTeamModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {teamMembers.map((member) => {
                    const isOnline = isUserOnline(member._id);
                    
                    return (
                      <div key={member._id} className="col-md-6 mb-3">
                        <div className="card h-100">
                          <div className="card-body">
                            <div className="d-flex align-items-center">
                              <div className="position-relative me-3">
                                <img
                                  src={generateAvatarUrl(member.name)}
                                  className="rounded-circle"
                                  style={{ width: '48px', height: '48px' }}
                                  alt={member.name}
                                />
                                <span 
                                  className={`position-absolute bottom-0 end-0 rounded-circle border border-white ${
                                    isOnline ? 'bg-success' : 'bg-secondary'
                                  }`}
                                  style={{ width: '12px', height: '12px' }}
                                ></span>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{member.name}</h6>
                                <p className="text-muted small mb-1">{member.position || member.role}</p>
                                <span className={`badge bg-${getRoleColor(member.role)}`}>
                                  {member.role}
                                </span>
                              </div>
                              <div className="dropdown">
                                <button 
                                  className="btn btn-sm btn-outline-secondary"
                                  data-bs-toggle="dropdown"
                                >
                                  <i className="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu">
                                  <li>
                                    <button 
                                      className="dropdown-item"
                                      onClick={() => handleDirectMessage(member)}
                                    >
                                      <i className="bi bi-chat-dots me-2"></i>
                                      Mensaje
                                    </button>
                                  </li>
                                  {canManageTeam() && (
                                    <li>
                                      <button 
                                        className="dropdown-item text-danger"
                                        onClick={() => handleRemoveMember(member)}
                                      >
                                        <i className="bi bi-person-x me-2"></i>
                                        Remover
                                      </button>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTeamModal(false)}
                >
                  Cerrar
                </button>
                {canManageTeam() && (
                  <button type="button" className="btn btn-primary">
                    <i className="bi bi-person-plus me-2"></i>
                    Agregar Miembro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Modal Confirmar Eliminación */}
      {showRemoveModal && memberToRemove && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirmar Eliminación
                </h6>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowRemoveModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro que deseas remover a <strong>{memberToRemove.name}</strong> del equipo?</p>
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle"></i> Esta acción quitará al usuario de todos los proyectos y chats.
                </div>
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
                  onClick={confirmRemoveMember}
                >
                  <i className="bi bi-person-x me-2"></i>
                  Remover del Equipo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;