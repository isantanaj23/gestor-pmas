import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // 🆕 Importar contexto de auth
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import ProjectConfigModal from '../modals/ProjectConfigModal';
import ProjectTeam from '../ProjectTeam'; // 🆕 Importar el nuevo componente
import '../ProjectTeam.css'; // 🆕 Importar estilos

// 🆕 Importar sistema de roles
import { 
  USER_ROLES, 
  checkPermission, 
  getRoleConfig, 
  getPermissions 
} from '../../utils/roles';

// Componentes de las pestañas
import KanbanBoard from '../project-tabs/KanbanBoard';
import ProjectCommunication from '../project-tabs/ProjectCommunication';
import ProjectSocial from '../project-tabs/ProjectSocial';
import ProjectReports from '../project-tabs/ProjectReports';

function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // 🆕 Obtener usuario actual
  const [activeTab, setActiveTab] = useState('tablero');
  
  // Estados para datos dinámicos
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🆕 Estados para permisos del usuario
  const [userPermissions, setUserPermissions] = useState({});
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [isProjectMember, setIsProjectMember] = useState(false);

  // Estados para gestión de equipo
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [newMemberData, setNewMemberData] = useState({ userId: '', role: 'developer' });

  const [showConfigModal, setShowConfigModal] = useState(false);

  // 🆕 Verificar permisos del usuario
  useEffect(() => {
    if (user && project) {
      // Verificar si es owner
      const isOwner = project.owner?._id === user.id || project.owner === user.id;
      setIsProjectOwner(isOwner);

      // Verificar si es miembro del equipo
      const isMember = project.team?.some(member => 
        (member.user?._id === user.id || member.user === user.id) ||
        (member._id === user.id)
      );
      setIsProjectMember(isMember);

      // Obtener permisos del rol del usuario
      const permissions = getPermissions(user.role);
      setUserPermissions(permissions);

      console.log('🔐 Permisos calculados:', {
        isOwner,
        isMember,
        userRole: user.role,
        permissions: permissions
      });
    }
  }, [user, project]);

  // 🔥 FUNCIÓN PARA CARGAR PROYECTO DESDE API REAL
  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Cargando proyecto con ID:', projectId);
      
      // 🎯 LLAMADA REAL A LA API
      const response = await projectService.getProject(projectId);
      
      console.log('✅ Respuesta del servidor:', response);
      
      if (response.success && response.data) {
        setProject(response.data);
        console.log('✅ Proyecto cargado:', response.data.name);
        
        // Cargar tareas del proyecto
        await loadProjectTasks(projectId);
      } else {
        throw new Error(response.message || 'No se pudo cargar el proyecto');
      }
      
    } catch (err) {
      console.error('❌ Error al cargar proyecto:', err);
      setError(err.message || 'Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNCIÓN PARA CARGAR TAREAS DEL PROYECTO
  const loadProjectTasks = async (projectId) => {
    try {
      console.log('📋 Cargando tareas para proyecto:', projectId);
      
      // Llamada real a la API de tareas
      const tasksResponse = await taskService.getTasksByProject(projectId);
      
      if (tasksResponse.success && tasksResponse.data) {
        setTasks(tasksResponse.data);
        console.log('✅ Tareas cargadas:', tasksResponse.data.length);
      } else {
        console.log('ℹ️ No se encontraron tareas para este proyecto');
        setTasks([]);
      }
    } catch (err) {
      console.error('❌ Error al cargar tareas:', err);
      // No marcamos como error fatal, solo log
      setTasks([]);
    }
  };

  // 🔥 CARGAR USUARIOS DISPONIBLES PARA AGREGAR AL EQUIPO
  const loadAvailableUsers = async () => {
    try {
      console.log('👥 Cargando usuarios disponibles...');
      
      // 🔥 USAR LA URL COMPLETA CON EL PUERTO CORRECTO
      const response = await fetch('http://localhost:3001/api/projects/debug/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('planifica_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📋 Datos recibidos:', data);
      
      if (data.success) {
        console.log('✅ Usuarios cargados:', data.data.length);
        
        // Filtrar usuarios que NO están ya en el equipo
        const currentTeamEmails = project.team.map(member => 
          member.user?.email || member.email
        );
        
        const availableUsers = data.data.filter(user => 
          !currentTeamEmails.includes(user.email)
        );
        
        setAvailableUsers(availableUsers);
        console.log('📋 Usuarios disponibles para agregar:', availableUsers.length);
        
        if (availableUsers.length === 0) {
          console.log('⚠️ Todos los usuarios ya están en el equipo');
        }
      } else {
        throw new Error(data.message || 'Error cargando usuarios');
      }
      
    } catch (err) {
      console.error('❌ Error cargando usuarios:', err);
      
      // Si no hay usuarios, ofrecer crear usuarios de prueba
      const shouldCreateUsers = window.confirm(
        'No se pudieron cargar usuarios o no existen usuarios disponibles. ¿Quieres crear usuarios de prueba?'
      );
      
      if (shouldCreateUsers) {
        try {
          console.log('🔄 Creando usuarios de prueba...');
          
          // 🔥 USAR LA URL COMPLETA CON EL PUERTO CORRECTO
          const createResponse = await fetch('http://localhost:3001/api/projects/debug/create-test-users', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('planifica_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📥 Create response status:', createResponse.status);
          
          if (createResponse.ok) {
            const createData = await createResponse.json();
            console.log('✅ Usuarios de prueba creados:', createData);
            alert(`✅ ${createData.created} usuarios de prueba creados`);
            
            // Recargar usuarios después de crearlos
            setTimeout(() => loadAvailableUsers(), 1000);
          } else {
            const errorText = await createResponse.text();
            console.error('❌ Error creating users:', errorText);
            throw new Error(`Error ${createResponse.status}: ${errorText}`);
          }
        } catch (createErr) {
          console.error('❌ Error creando usuarios de prueba:', createErr);
          alert('Error creando usuarios de prueba: ' + createErr.message);
        }
      }
    }
  };

  // 🔥 AGREGAR MIEMBRO AL EQUIPO
  const handleAddMember = async () => {
    try {
      console.log('👥 Intentando agregar miembro...');
      console.log('📋 Datos del formulario:', newMemberData);
      console.log('📋 Proyecto actual:', project._id);
      
      // 🆕 Verificar permisos antes de agregar
      if (!checkPermission(user.role, 'canManageProjectMembers') && !isProjectOwner) {
        alert('❌ No tienes permisos para agregar miembros al equipo');
        return;
      }
      
      // Validar datos
      if (!newMemberData.userId || !newMemberData.role) {
        alert('Por favor selecciona un usuario y un rol');
        return;
      }

      // Preparar datos para enviar
      const memberData = {
        userId: newMemberData.userId,
        role: newMemberData.role
      };
      
      console.log('📤 Enviando al servidor:', memberData);

      // Llamada real a la API
      const response = await projectService.addTeamMember(project._id, memberData);
      
      console.log('📥 Respuesta del servidor:', response);

      if (response.success) {
        console.log('✅ Miembro agregado exitosamente');
        
        // Recargar el proyecto para obtener los datos actualizados
        await loadProject();
        
        // Cerrar modal y resetear
        setShowAddMemberModal(false);
        setNewMemberData({ userId: '', role: 'developer' });
        
        alert('✅ Miembro agregado exitosamente!');
      } else {
        throw new Error(response.message || 'Error al agregar miembro');
      }
    } catch (err) {
      console.error('❌ Error completo:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      alert('Error al agregar miembro: ' + err.message);
    }
  };

  // 🆕 REMOVER MIEMBRO - AHORA CON FUNCIONALIDAD REAL
  const handleRemoveMember = async (member) => {
    try {
      console.log('🗑️ Intentando remover miembro:', member);
      
      // 🆕 Verificar permisos
      if (!checkPermission(user.role, 'canRemoveUsers') && !isProjectOwner) {
        alert('❌ No tienes permisos para eliminar miembros del equipo');
        return;
      }

      const memberId = member.user?._id || member._id;
      const memberName = member.user?.name || member.name || 'este usuario';

      // Confirmación
      const confirmRemove = window.confirm(
        `¿Estás seguro que deseas eliminar a ${memberName} del proyecto?\n\n` +
        `Esta acción no se puede deshacer y el usuario perderá acceso a:\n` +
        `• El proyecto y sus tareas\n` +
        `• El chat del proyecto\n` +
        `• Todos los datos relacionados`
      );

      if (!confirmRemove) return;

      // 🆕 Llamada a la API para eliminar miembro
      const response = await projectService.removeTeamMember(project._id, memberId);
      
      if (response.success) {
        console.log('✅ Miembro eliminado exitosamente');
        
        // Recargar proyecto para obtener datos actualizados
        await loadProject();
        
        alert(`✅ ${memberName} ha sido eliminado del proyecto exitosamente`);
      } else {
        throw new Error(response.message || 'Error al eliminar miembro');
      }

    } catch (err) {
      console.error('❌ Error eliminando miembro:', err);
      alert(`❌ Error al eliminar miembro: ${err.message}`);
    }
  };

  const handleProjectUpdate = (updatedProject) => {
    console.log('✅ Proyecto actualizado:', updatedProject);
    setProject(updatedProject);

    if (updatedProject.status === 'completed' || updatedProject.status === 'cancelled') {
      // Opcional: recargar tareas o mostrar mensaje
      console.log('📋 Proyecto cambió de estado, considera recargar tareas');
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // Cargar usuarios disponibles cuando se abra el modal
  useEffect(() => {
    if (showAddMemberModal && project) {
      loadAvailableUsers();
    }
  }, [showAddMemberModal, project]);

  // Calcular progreso basado en tareas
  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return project?.progress || 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // 🆕 Pestañas con verificación de permisos
  const tabs = [
    { id: 'tablero', label: 'Tablero', icon: 'bi-kanban' },
    { id: 'comunicacion', label: 'Comunicación', icon: 'bi-chat-left-dots-fill' },
    { 
      id: 'equipo', 
      label: 'Equipo', 
      icon: 'bi-people-fill',
      show: isProjectOwner || isProjectMember || checkPermission(user?.role, 'canManageProjectMembers')
    }, // 🆕 Nueva pestaña con permisos
    { id: 'social', label: 'Calendario Social', icon: 'bi-calendar-event' },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: 'bi-file-earmark-text',
      show: checkPermission(user?.role, 'canViewReports') || isProjectOwner
    },
  ].filter(tab => tab.show !== false); // Filtrar pestañas basado en permisos

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tablero':
        return <KanbanBoard projectId={projectId} project={project} tasks={tasks} onTasksUpdate={setTasks} />;
      
      case 'comunicacion':
        // 🆕 Verificar permisos para chat
        if (!checkPermission(user?.role, 'canSendMessages') && !isProjectMember) {
          return (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No tienes permisos para acceder al chat del proyecto.
            </div>
          );
        }
        return <ProjectCommunication projectId={projectId} project={project} />;
      
      case 'equipo': // 🆕 Nueva pestaña
        return (
          <ProjectTeam 
            project={project}
            onProjectUpdate={handleProjectUpdate}
            currentUser={user}
            userPermissions={userPermissions}
            isProjectOwner={isProjectOwner}
            onRemoveMember={handleRemoveMember}
          />
        );
      
      case 'social':
        return <ProjectSocial projectId={projectId} project={project} />;
      
      case 'reportes':
        if (!checkPermission(user?.role, 'canViewReports') && !isProjectOwner) {
          return (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No tienes permisos para ver los reportes del proyecto.
            </div>
          );
        }
        return <ProjectReports projectId={projectId} project={project} tasks={tasks} />;
      
      default:
        return <KanbanBoard projectId={projectId} project={project} tasks={tasks} onTasksUpdate={setTasks} />;
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando proyecto...</span>
          </div>
          <div className="ms-3">
            <h5>Cargando proyecto...</h5>
            <p className="text-muted">ID: {projectId}</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">❌ Error al cargar proyecto</h4>
          <p><strong>Error:</strong> {error}</p>
          <p><strong>ID del proyecto:</strong> {projectId}</p>
          <hr />
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-danger" 
              onClick={() => navigate('/proyectos')}
            >
              ← Volver a Proyectos
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar proyecto no encontrado
  if (!project) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">⚠️ Proyecto no encontrado</h4>
          <p>El proyecto que buscas no existe o no tienes permisos para verlo.</p>
          <p><strong>ID buscado:</strong> {projectId}</p>
          <hr />
          <button className="btn btn-outline-warning" onClick={() => navigate('/proyectos')}>
            ← Volver a Proyectos
          </button>
        </div>
      </div>
    );
  }

  const currentProgress = calculateProgress();

  return (
    <div className="container-fluid p-4">
      {/* Header del proyecto */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <button 
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => navigate('/proyectos')}
                    >
                      Proyectos
                    </button>
                  </li>
                  <li className="breadcrumb-item active">{project.name}</li>
                </ol>
              </nav>
              <h1 className="display-6 fw-bold text-primary mb-2">{project.name}</h1>
              <p className="text-muted mb-3">{project.description}</p>
              
              {/* 🆕 Mostrar información de permisos del usuario */}
              {user && (
                <div className="mb-2">
                  <span className="badge bg-secondary me-2">
                    <i className={`${getRoleConfig(user.role).icon} me-1`}></i>
                    {getRoleConfig(user.role).label}
                  </span>
                  {isProjectOwner && (
                    <span className="badge bg-warning">
                      <i className="bi bi-crown-fill me-1"></i>
                      Propietario
                    </span>
                  )}
                  {isProjectMember && !isProjectOwner && (
                    <span className="badge bg-info">
                      <i className="bi bi-person-check me-1"></i>
                      Miembro
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="d-flex gap-2">
              {/* 🆕 Botón configurar solo para owners y managers */}
              {(isProjectOwner || checkPermission(user?.role, 'canEditProjects')) && (
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setShowConfigModal(true)}
                >
                  <i className="bi bi-gear"></i> Configurar
                </button>
              )}
              
              {/* 🆕 Botón agregar miembro solo para usuarios con permisos */}
              {(isProjectOwner || checkPermission(user?.role, 'canManageProjectMembers')) && (
                <button 
                  className="btn btn-success"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  <i className="bi bi-person-plus"></i> Agregar Miembro
                </button>
              )}
            </div>
          </div>

          {/* Modal de Configuración del Proyecto */}
          <ProjectConfigModal
            show={showConfigModal}
            onHide={() => setShowConfigModal(false)}
            project={project}
            onProjectUpdate={handleProjectUpdate}
          />

          {/* Métricas del proyecto */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title text-primary">Progreso</h5>
                  <div className="progress mb-2">
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ width: `${currentProgress}%` }}
                    ></div>
                  </div>
                  <span className="fw-bold">{currentProgress}%</span>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title text-success">Tareas</h5>
                  <h3 className="fw-bold text-success">{tasks.length}</h3>
                  <small className="text-muted">Total</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title text-info">Equipo</h5>
                  <h3 className="fw-bold text-info">{project.team?.length || 0}</h3>
                  <small className="text-muted">Miembros</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title text-warning">Estado</h5>
                  <span className={`badge bg-${project.status === 'active' ? 'success' : 'warning'} fs-6`}>
                    {project.status === 'active' ? 'Activo' : project.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 🆕 Vista rápida del equipo mejorada */}
          {project.team && project.team.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-people"></i> Equipo del Proyecto
                  <span className="badge bg-primary ms-2">{project.team.length + 1} miembros</span>
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {/* Mostrar owner */}
                  <div className="col-md-4 mb-3">
                    <div className="d-flex align-items-center">
                      <div className="avatar-placeholder bg-warning text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                        {project.owner?.name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-0">{project.owner?.name || 'Propietario'}</h6>
                        <small className="text-muted">
                          <i className="bi bi-crown-fill text-warning me-1"></i>
                          Propietario
                        </small>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mostrar miembros del equipo */}
                  {project.team.map((member, index) => {
                    const memberRole = member.role || 'developer';
                    const roleConfig = getRoleConfig(memberRole);
                    
                    return (
                      <div key={member._id || index} className="col-md-4 mb-3">
                        <div className="d-flex align-items-center">
                          <div className={`avatar-placeholder bg-${roleConfig.color} text-white rounded-circle d-flex align-items-center justify-content-center me-3`} style={{width: '40px', height: '40px'}}>
                            {member.user?.name?.charAt(0) || member.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0">{member.user?.name || member.name || 'Usuario'}</h6>
                            <small className="text-muted">
                              <i className={`${roleConfig.icon} me-1`}></i>
                              {roleConfig.label}
                            </small>
                          </div>
                          {/* 🆕 Botón eliminar solo para usuarios con permisos */}
                          {(isProjectOwner || checkPermission(user?.role, 'canRemoveUsers')) && (
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleRemoveMember(member)}
                              title={`Eliminar a ${member.user?.name || member.name} del proyecto`}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-pills nav-fill bg-light rounded p-2">
            {tabs.map(tab => (
              <li className="nav-item" key={tab.id}>
                <button 
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`bi ${tab.icon} me-2`}></i>
                  {tab.label}
                  {/* Badge especial para equipo */}
                  {tab.id === 'equipo' && project.team && (
                    <span className="badge bg-white text-primary ms-2">
                      {project.team.length + 1}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Contenido dinámico de las pestañas */}
      <div className="row">
        <div className="col-12">
          {renderTabContent()}
        </div>
      </div>

      {/* 🆕 Modal para agregar miembro mejorado con roles */}
      {showAddMemberModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  Agregar Miembro al Equipo
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowAddMemberModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-person me-1"></i>
                      Usuario
                    </label>
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
                    {availableUsers.length === 0 && (
                      <small className="text-muted">
                        No hay usuarios disponibles para agregar
                      </small>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-shield-check me-1"></i>
                      Rol
                    </label>
                    <select 
                      className="form-select"
                      value={newMemberData.role}
                      onChange={(e) => setNewMemberData({...newMemberData, role: e.target.value})}
                    >
                      <option value="viewer">👁️ Viewer - Solo lectura y chat</option>
                      <option value="developer">💻 Developer - Desarrollo</option>
                      <option value="designer">🎨 Designer - Diseño</option>
                      <option value="tester">🐛 Tester - Testing y QA</option>
                      {/* Solo owners y admins pueden asignar manager */}
                      {(isProjectOwner || user?.role === 'admin') && (
                        <option value="manager">👨‍💼 Manager - Gestión</option>
                      )}
                    </select>
                    <small className="text-muted">
                      El rol determina qué acciones puede realizar el usuario
                    </small>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddMemberModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddMember}
                  disabled={!newMemberData.userId}
                >
                  <i className="bi bi-person-plus me-1"></i>
                  Agregar Miembro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailPage;