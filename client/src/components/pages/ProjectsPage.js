import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService from '../../services/projectService';

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    priority: 'medium',
    status: 'active'
  });
  const [isCreating, setIsCreating] = useState(false);

  // Cargar proyectos al montar el componente
  useEffect(() => {
    loadProjects();
  }, []);

  // Función para cargar proyectos
  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectService.getProjects();
      
      if (response.success) {
        setProjects(response.data);
      } else {
        setError(response.message || 'Error cargando proyectos');
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      setError('Error de conexión al cargar proyectos');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para crear proyecto
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (isCreating) return;
    
    setIsCreating(true);

    try {
      const response = await projectService.createProject(newProject);
      
      if (response.success) {
        // Agregar el nuevo proyecto a la lista
        setProjects(prev => [response.data, ...prev]);
        
        // Limpiar formulario y cerrar modal
        setNewProject({
          name: '',
          description: '',
          priority: 'medium',
          status: 'active'
        });
        setShowCreateModal(false);
        
        // Mostrar mensaje de éxito
        console.log('✅ Proyecto creado exitosamente');
      } else {
        console.error('❌ Error creando proyecto:', response.message);
        setError(response.message || 'Error creando proyecto');
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setError('Error de conexión al crear proyecto');
    } finally {
      setIsCreating(false);
    }
  };

  // Función para ir a los detalles del proyecto
  const handleProjectClick = (projectId) => {
    navigate(`/proyecto/${projectId}`);
  };

  // Función para obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'paused': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // Función para obtener color según prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <h5 className="text-muted">Cargando Proyectos...</h5>
            <p className="text-muted">Obteniendo tus proyectos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 animate-fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <div>
          <h1 className="h2">
            <i className="bi bi-folder-fill me-2 text-primary"></i>
            Gestión de Proyectos
          </h1>
          <p className="text-muted mb-0">
            Administra todos tus proyectos desde un solo lugar
          </p>
        </div>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Nuevo Proyecto
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title text-primary">{projects.length}</h5>
              <p className="card-text small text-muted">Total Proyectos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title text-success">
                {projects.filter(p => p.status === 'active').length}
              </h5>
              <p className="card-text small text-muted">Activos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title text-warning">
                {projects.filter(p => p.status === 'paused').length}
              </h5>
              <p className="card-text small text-muted">Pausados</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title text-primary">
                {projects.filter(p => p.status === 'completed').length}
              </h5>
              <p className="card-text small text-muted">Completados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Proyectos */}
      {projects.length > 0 ? (
        <div className="row">
          {projects.map((project) => (
            <div key={project._id} className="col-lg-4 col-md-6 mb-4">
              <div 
                className="card h-100 project-card cursor-pointer"
                onClick={() => handleProjectClick(project._id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body d-flex flex-column">
                  {/* Header del proyecto */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h5 className="card-title text-dark mb-1">{project.name}</h5>
                      <p className="card-text text-muted small mb-2">
                        {project.description || 'Sin descripción'}
                      </p>
                    </div>
                    <span className={`badge bg-${getStatusColor(project.status)} ms-2`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Métricas del proyecto */}
                  <div className="row text-center mb-3">
                    <div className="col-4">
                      <div className="fw-bold text-primary">{project.taskCount || 0}</div>
                      <small className="text-muted">Tareas</small>
                    </div>
                    <div className="col-4">
                      <div className="fw-bold text-success">{project.progress || 0}%</div>
                      <small className="text-muted">Progreso</small>
                    </div>
                    <div className="col-4">
                      <div className="fw-bold text-info">{project.teamMembers?.length || 0}</div>
                      <small className="text-muted">Miembros</small>
                    </div>
                  </div>

                  {/* Equipo */}
                  <div className="d-flex align-items-center mb-3">
                    <div className="d-flex me-2">
                      {project.teamMembers && project.teamMembers.slice(0, 3).map((member, index) => (
                        <img
                          key={index}
                          src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=32`}
                          className="rounded-circle border border-white"
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            marginLeft: index > 0 ? '-8px' : '0',
                            zIndex: 3 - index
                          }}
                          alt={member.name}
                          title={member.name}
                        />
                      ))}
                      {project.teamMembers && project.teamMembers.length > 3 && (
                        <div 
                          className="rounded-circle border border-white bg-light d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            marginLeft: '-8px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: '#6c757d'
                          }}
                        >
                          +{project.teamMembers.length - 3}
                        </div>
                      )}
                    </div>
                    <small className="text-muted">
                      {project.teamMembers?.length ? `${project.teamMembers.length} miembro${project.teamMembers.length > 1 ? 's' : ''}` : 'Sin equipo'}
                    </small>
                  </div>

                  {/* Barra de progreso */}
                  <div className="progress mb-3" style={{ height: '8px' }}>
                    <div
                      className={`progress-bar bg-${getStatusColor(project.status)}`}
                      role="progressbar"
                      style={{ width: `${project.progress || 0}%` }}
                      aria-valuenow={project.progress || 0}
                    ></div>
                  </div>

                  {/* Footer del proyecto */}
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`badge bg-${getPriorityColor(project.priority)}`}>
                        {project.priority} prioridad
                      </span>
                      <small className="text-muted">
                        <i className="bi bi-calendar-event me-1"></i>
                        {formatDate(project.createdAt)}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Estado vacío */
        <div className="text-center py-5">
          <i className="bi bi-folder-plus text-muted" style={{ fontSize: '4rem' }}></i>
          <h3 className="text-muted mt-3">Sin proyectos</h3>
          <p className="text-muted mb-4">
            Comienza creando tu primer proyecto para organizar tu trabajo
          </p>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Crear Mi Primer Proyecto
          </button>
        </div>
      )}

      {/* Modal de Crear Proyecto */}
      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-folder-plus me-2"></i>
                  Crear Nuevo Proyecto
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                ></button>
              </div>
              
              <form onSubmit={handleCreateProject}>
                <div className="modal-body">
                  {/* Nombre del proyecto */}
                  <div className="mb-3">
                    <label htmlFor="projectName" className="form-label">
                      <i className="bi bi-card-text me-2"></i>
                      Nombre del Proyecto *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="projectName"
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Rediseño de la página web"
                      required
                      disabled={isCreating}
                    />
                  </div>

                  {/* Descripción */}
                  <div className="mb-3">
                    <label htmlFor="projectDescription" className="form-label">
                      <i className="bi bi-text-paragraph me-2"></i>
                      Descripción
                    </label>
                    <textarea
                      className="form-control"
                      id="projectDescription"
                      rows="3"
                      value={newProject.description}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe brevemente el proyecto..."
                      disabled={isCreating}
                    />
                  </div>

                  {/* Prioridad y Estado */}
                  <div className="row">
                    <div className="col-md-6">
                      <label htmlFor="projectPriority" className="form-label">
                        <i className="bi bi-flag me-2"></i>
                        Prioridad
                      </label>
                      <select
                        className="form-select"
                        id="projectPriority"
                        value={newProject.priority}
                        onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value }))}
                        disabled={isCreating}
                      >
                        <option value="low">🟢 Baja</option>
                        <option value="medium">🟡 Media</option>
                        <option value="high">🔴 Alta</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="projectStatus" className="form-label">
                        <i className="bi bi-gear me-2"></i>
                        Estado
                      </label>
                      <select
                        className="form-select"
                        id="projectStatus"
                        value={newProject.status}
                        onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value }))}
                        disabled={isCreating}
                      >
                        <option value="active">🟢 Activo</option>
                        <option value="paused">⏸️ Pausado</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isCreating || !newProject.name.trim()}
                  >
                    {isCreating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </span>
                        Creando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Crear Proyecto
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;