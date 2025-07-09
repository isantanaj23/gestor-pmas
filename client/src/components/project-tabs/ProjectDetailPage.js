// client/src/components/pages/ProjectDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Servicios reales
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';

// Componentes de las pestañas
import KanbanBoard from '../project-tabs/KanbanBoard';
import ProjectCommunication from '../project-tabs/ProjectCommunication';
import ProjectSocial from '../project-tabs/ProjectSocial';
import ProjectReports from '../project-tabs/ProjectReports';

function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('🚀 ProjectDetailPage ACTUALIZADO - Usando API REAL');
  console.log('🔍 ProjectId desde URL:', projectId);
  
  // Estados principales
  const [activeTab, setActiveTab] = useState('tablero');
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para gestión de equipo
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [newMemberData, setNewMemberData] = useState({ 
    userId: '', 
    role: 'developer' 
  });

  // 🔥 FUNCIÓN REAL PARA CARGAR PROYECTO DESDE LA API
  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 LLAMANDO A API REAL - projectService.getProject:', projectId);
      
      // Verificar que el ID sea válido
      if (!projectId || projectId.length !== 24) {
        throw new Error('ID de proyecto inválido');
      }

      // ⭐ LLAMADA REAL A LA API - AQUÍ ESTÁ LA DIFERENCIA CLAVE
      const response = await projectService.getProject(projectId);
      
      console.log('📥 RESPUESTA DE LA API REAL:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Error cargando proyecto desde API');
      }

      console.log('✅ PROYECTO CARGADO DESDE API REAL:', response.data.name);
      setProject(response.data);
      
    } catch (err) {
      console.error('❌ ERROR AL CARGAR PROYECTO DESDE API:', err);
      setError(err.message);
      
      // Si el proyecto no existe, redirigir después de 3 segundos
      if (err.message.includes('no encontrado') || err.message.includes('inválido')) {
        console.log('⏰ Redirigiendo a /proyectos en 3 segundos...');
        setTimeout(() => {
          navigate('/proyectos');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNCIÓN REAL PARA CARGAR TAREAS DESDE LA API
  const loadTasks = async () => {
    try {
      console.log('📋 CARGANDO TAREAS DESDE API REAL para proyecto:', projectId);
      
      // Llamada real a la API de tareas
      const result = await taskService.getTasksByProject(projectId);
      
      if (result.success) {
        console.log('✅ TAREAS CARGADAS DESDE API REAL:', result.data.length);
        setTasks(result.data);
      } else {
        console.error('❌ Error al cargar tareas desde API:', result.message);
        setTasks([]); // Array vacío si no hay tareas
      }
      
    } catch (err) {
      console.error('❌ Error en loadTasks:', err);
      setTasks([]);
    }
  };

  // 🔥 FUNCIÓN PARA CARGAR USUARIOS DISPONIBLES
  const loadAvailableUsers = async () => {
    try {
      // Por ahora mantener datos de ejemplo, luego conectar a API de usuarios
      const users = [
        { _id: '60f7b3b3b3b3b3b3b3b3b3b8', name: 'Roberto Vega', email: 'roberto@empresa.com', avatar: null },
        { _id: '60f7b3b3b3b3b3b3b3b3b3b9', name: 'Carmen Torres', email: 'carmen@empresa.com', avatar: null },
        { _id: '60f7b3b3b3b3b3b3b3b3b3ba', name: 'Fernando Ruiz', email: 'fernando@empresa.com', avatar: null },
        { _id: '60f7b3b3b3b3b3b3b3b3b3bb', name: 'Patricia Luna', email: 'patricia@empresa.com', avatar: null }
      ];
      
      // Filtrar usuarios que NO están ya en el equipo
      const currentTeamIds = project?.team?.map(member => member.user?._id || member._id) || [];
      const available = users.filter(user => !currentTeamIds.includes(user._id));
      
      setAvailableUsers(available);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  // 🔥 AGREGAR MIEMBRO AL EQUIPO
  const handleAddMember = async () => {
    try {
      if (!newMemberData.userId) {
        alert('Por favor selecciona un usuario');
        return;
      }

      console.log('➕ Agregando miembro al equipo:', newMemberData);

      const response = await projectService.addTeamMember(projectId, newMemberData);
      
      if (response.success) {
        console.log('✅ Miembro agregado exitosamente');
        
        // Recargar proyecto para obtener datos actualizados
        await loadProject();
        
        // Cerrar modal y limpiar formulario
        setShowAddMemberModal(false);
        setNewMemberData({ userId: '', role: 'developer' });
      } else {
        throw new Error(response.message);
      }
      
    } catch (err) {
      console.error('❌ Error al agregar miembro:', err);
      alert('Error al agregar miembro al equipo: ' + err.message);
    }
  };

  // ⚡ EFECTOS - CARGAR DATOS AL MONTAR COMPONENTE
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose - projectId:', projectId, 'user:', user?.name);
    if (projectId && user) {
      loadProject();
      loadTasks();
    }
  }, [projectId, user]);

  useEffect(() => {
    if (showAddMemberModal && project) {
      loadAvailableUsers();
    }
  }, [showAddMemberModal, project]);

  // 🎨 Configuración de pestañas
  const tabs = [
    { id: 'tablero', label: 'Tablero', icon: 'bi-kanban' },
    { id: 'comunicacion', label: 'Comunicación', icon: 'bi-chat-left-dots-fill' },
    { id: 'social', label: 'Calendario Social', icon: 'bi-calendar-event' },
    { id: 'reportes', label: 'Reportes', icon: 'bi-file-earmark-text' },
  ];

  // 🎯 Renderizar contenido de pestañas
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tablero':
        return (
          <KanbanBoard 
            projectId={projectId} 
            project={project} 
            tasks={tasks} 
            onTasksUpdate={setTasks} 
          />
        );
      case 'comunicacion':
        return <ProjectCommunication projectId={projectId} project={project} />;
      case 'social':
        return <ProjectSocial projectId={projectId} project={project} />;
      case 'reportes':
        return <ProjectReports projectId={projectId} project={project} />;
      default:
        return (
          <div className="alert alert-info">
            <h5>Pestaña en desarrollo</h5>
            <p>Esta funcionalidad estará disponible próximamente.</p>
          </div>
        );
    }
  };

  // 🎨 Estados de carga y error
  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando proyecto...</span>
            </div>
            <h5 className="text-success">Cargando proyecto desde API REAL...</h5>
            <p className="text-muted small">ID: {projectId}</p>
            <p className="text-success small">🔧 Archivo ProjectDetailPage.js actualizado correctamente</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-4">
        <div className="alert alert-danger" role="alert">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
            <div>
              <h5 className="alert-heading mb-1">Error al cargar proyecto desde API</h5>
              <p className="mb-2">{error}</p>
              <p className="mb-0 small text-muted">ID del proyecto: {projectId}</p>
              <p className="mb-0 small text-success">✅ Archivo actualizado - usando API real</p>
            </div>
          </div>
          <hr />
          <div className="d-flex gap-2">
            <button className="btn btn-outline-danger btn-sm" onClick={loadProject}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Reintentar
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/proyectos')}>
              <i className="bi bi-arrow-left me-1"></i>
              Volver a proyectos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container-fluid mt-4">
        <div className="alert alert-warning" role="alert">
          <h5 className="alert-heading">Proyecto no encontrado en la API</h5>
          <p>No se pudo cargar la información del proyecto desde la API real.</p>
          <button className="btn btn-outline-warning" onClick={() => navigate('/proyectos')}>
            Volver a proyectos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Indicador de que el archivo está actualizado */}
      <div className="alert alert-success alert-dismissible mb-3" role="alert">
        <strong>✅ ÉXITO:</strong> ProjectDetailPage.js actualizado - Usando API REAL - Proyecto cargado: {project.name}
        <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
      </div>

      {/* Header del proyecto */}
      <div className="row mb-4">
        <div className="col">
          {/* Breadcrumb */}
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
              <li className="breadcrumb-item active" aria-current="page">
                {project.name}
              </li>
            </ol>
          </nav>

          {/* Título y estado */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h1 className="h3 mb-2">
                {project.name} 
                <span className="badge bg-success ms-2">API Real</span>
              </h1>
              <p className="text-muted mb-2">{project.description}</p>
              <div className="d-flex align-items-center gap-3">
                <span className={`badge bg-${
                  project.status === 'active' ? 'success' :
                  project.status === 'paused' ? 'warning' :
                  project.status === 'completed' ? 'primary' : 'secondary'
                }`}>
                  {project.status === 'active' ? 'Activo' :
                   project.status === 'paused' ? 'Pausado' :
                   project.status === 'completed' ? 'Completado' : 'Cancelado'}
                </span>
                <span className="text-muted small">
                  <i className="bi bi-calendar me-1"></i>
                  Creado: {new Date(project.createdAt).toLocaleDateString('es-ES')}
                </span>
                <span className="badge bg-info small">
                  <i className="bi bi-database me-1"></i>MongoDB: {projectId}
                </span>
              </div>
            </div>

            {/* Progreso */}
            <div className="text-end">
              <div className="mb-2">
                <span className="fw-bold fs-4">{project.progress || 0}%</span>
                <small className="text-muted ms-1">completado</small>
              </div>
              <div className="progress" style={{ width: '200px', height: '8px' }}>
                <div 
                  className="progress-bar bg-primary" 
                  style={{ width: `${project.progress || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Equipo */}
          {project.team && project.team.length > 0 && (
            <div className="d-flex align-items-center gap-3 mb-3">
              <span className="text-muted small">Equipo:</span>
              <div className="d-flex align-items-center">
                {project.team.slice(0, 5).map((member, index) => (
                  <img
                    key={member._id || index}
                    src={member.user?.avatar || member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.name || member.name || 'Usuario')}&background=6f42c1&color=fff&size=32`}
                    alt={member.user?.name || member.name || 'Usuario'}
                    className="rounded-circle border border-white"
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      marginLeft: index > 0 ? '-8px' : '0',
                      zIndex: project.team.length - index
                    }}
                    title={`${member.user?.name || member.name || 'Usuario'} (${member.role})`}
                  />
                ))}
                {project.team.length > 5 && (
                  <span className="ms-2 text-muted small">
                    +{project.team.length - 5} más
                  </span>
                )}
                <button 
                  className="btn btn-outline-primary btn-sm ms-3"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  <i className="bi bi-person-plus me-1"></i>
                  Agregar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pestañas */}
      <div className="row">
        <div className="col">
          <ul className="nav nav-tabs mb-4">
            {tabs.map(tab => (
              <li className="nav-item" key={tab.id}>
                <button 
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`bi ${tab.icon} me-2`}></i>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Contenido de la pestaña activa */}
          {renderTabContent()}
        </div>
      </div>

      {/* Modal para agregar miembro */}
      {showAddMemberModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                    <label className="form-label">Rol en el proyecto</label>
                    <select 
                      className="form-select"
                      value={newMemberData.role}
                      onChange={(e) => setNewMemberData({...newMemberData, role: e.target.value})}
                    >
                      <option value="developer">Developer - Desarrollador</option>
                      <option value="designer">Designer - Diseñador</option>
                      <option value="tester">Tester - Probador</option>
                      <option value="manager">Manager - Gerente</option>
                      <option value="client">Client - Cliente</option>
                    </select>
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
                  Agregar al Equipo
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