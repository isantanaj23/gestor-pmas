import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import projectService from '../../services/projectService';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: {
      allocated: 0,
      used: 0
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // 🔥 CARGAR PROYECTOS REALES DESDE LA API
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Cargando proyectos desde API...');
      
      const response = await projectService.getProjects();
      console.log('✅ Respuesta de proyectos:', response);
      
      if (response.success && response.data) {
        setProjects(response.data);
        console.log('✅ Proyectos cargados:', response.data.length);
      } else {
        throw new Error(response.message || 'No se pudieron cargar los proyectos');
      }
      
    } catch (err) {
      console.error('❌ Error cargando proyectos:', err);
      setError(err.message || 'Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 MANEJAR CAMBIOS EN EL FORMULARIO
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('budget.')) {
      const budgetField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          [budgetField]: parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 🔥 CREAR NUEVO PROYECTO
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      setFormError('El nombre y la descripción son obligatorios');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      console.log('🔄 Creando proyecto:', formData);
      
      const response = await projectService.createProject(formData);
      
      if (response.success) {
        console.log('✅ Proyecto creado:', response.data);
        
        // Agregar el nuevo proyecto a la lista
        setProjects(prev => [response.data, ...prev]);
        
        // Resetear formulario y cerrar modal
        setFormData({
          name: '',
          description: '',
          status: 'active',
          priority: 'medium',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          budget: { allocated: 0, used: 0 }
        });
        setShowCreateModal(false);
        
        alert('✅ Proyecto creado exitosamente!');
      } else {
        throw new Error(response.message || 'Error al crear el proyecto');
      }
    } catch (err) {
      console.error('❌ Error creando proyecto:', err);
      setFormError(err.message || 'Error al crear el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar proyectos al montar el componente
  useEffect(() => {
    loadProjects();
  }, []);

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'paused': return 'Pausado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando proyectos...</span>
          </div>
          <div className="ms-3">
            <h5>Cargando proyectos...</h5>
            <p className="text-muted">Obteniendo datos desde el servidor...</p>
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
          <h4 className="alert-heading">❌ Error al cargar proyectos</h4>
          <p><strong>Error:</strong> {error}</p>
          <hr />
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              🔄 Reintentar
            </button>
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => {
                // Crear proyectos de prueba
                fetch('/api/projects/debug/create-samples', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('planifica_token')}`
                  }
                })
                .then(() => window.location.reload())
                .catch(console.error);
              }}
            >
              🎯 Crear Proyectos de Prueba
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay proyectos
  if (projects.length === 0) {
    return (
      <div className="container-fluid p-4">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="display-6 fw-bold text-primary">Mis Proyectos</h1>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-lg"></i> Nuevo Proyecto
              </button>
            </div>
            
            <div className="alert alert-info" role="alert">
              <h4 className="alert-heading">📋 No tienes proyectos aún</h4>
              <p>Parece que no tienes ningún proyecto creado. ¡Crea tu primer proyecto para comenzar!</p>
              <hr />
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="bi bi-plus-lg"></i> Crear Primer Proyecto
                </button>
                <button 
                  className="btn btn-outline-info"
                  onClick={() => {
                    // Crear proyectos de prueba
                    fetch('/api/projects/debug/create-samples', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('planifica_token')}`
                      }
                    })
                    .then(() => window.location.reload())
                    .catch(console.error);
                  }}
                >
                  🎯 Crear Proyectos de Prueba
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal integrado para crear proyecto */}
        {showCreateModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-plus-circle me-2"></i>
                    Crear Nuevo Proyecto
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                  ></button>
                </div>
                
                <form onSubmit={handleCreateProject}>
                  <div className="modal-body">
                    {formError && (
                      <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {formError}
                      </div>
                    )}

                    <div className="row g-3">
                      {/* Nombre del proyecto */}
                      <div className="col-12">
                        <label className="form-label">
                          <i className="bi bi-bookmark me-2"></i>
                          Nombre del Proyecto *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          placeholder="Ej: Sistema de Gestión CRM"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Descripción */}
                      <div className="col-12">
                        <label className="form-label">
                          <i className="bi bi-file-text me-2"></i>
                          Descripción *
                        </label>
                        <textarea
                          className="form-control"
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          rows="3"
                          placeholder="Describe brevemente el objetivo y alcance del proyecto..."
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Estado y Prioridad */}
                      <div className="col-md-6">
                        <label className="form-label">
                          <i className="bi bi-flag me-2"></i>
                          Estado
                        </label>
                        <select
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleFormChange}
                          disabled={isSubmitting}
                        >
                          <option value="active">Activo</option>
                          <option value="paused">Pausado</option>
                          <option value="completed">Completado</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Prioridad
                        </label>
                        <select
                          className="form-select"
                          name="priority"
                          value={formData.priority}
                          onChange={handleFormChange}
                          disabled={isSubmitting}
                        >
                          <option value="low">Baja</option>
                          <option value="medium">Media</option>
                          <option value="high">Alta</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      </div>

                      {/* Fechas */}
                      <div className="col-md-6">
                        <label className="form-label">
                          <i className="bi bi-calendar-event me-2"></i>
                          Fecha de Inicio
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleFormChange}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          <i className="bi bi-calendar-check me-2"></i>
                          Fecha de Finalización
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleFormChange}
                          min={formData.startDate}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Los campos marcados con * son obligatorios
                      </small>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowCreateModal(false)}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-lg me-2"></i>
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
  }

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="display-6 fw-bold text-primary">Mis Proyectos</h1>
              <p className="text-muted">Gestiona y supervisa todos tus proyectos</p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary"
                onClick={loadProjects}
                title="Actualizar proyectos"
              >
                <i className="bi bi-arrow-clockwise"></i> Actualizar
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-lg"></i> Nuevo Proyecto
              </button>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title text-primary">Total</h5>
                  <h3 className="fw-bold text-primary">{projects.length}</h3>
                  <small className="text-muted">Proyectos</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title text-success">Activos</h5>
                  <h3 className="fw-bold text-success">
                    {projects.filter(p => p.status === 'active').length}
                  </h3>
                  <small className="text-muted">En progreso</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title text-info">Completados</h5>
                  <h3 className="fw-bold text-info">
                    {projects.filter(p => p.status === 'completed').length}
                  </h3>
                  <small className="text-muted">Finalizados</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title text-warning">Progreso Promedio</h5>
                  <h3 className="fw-bold text-warning">
                    {Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)}%
                  </h3>
                  <small className="text-muted">Completado</small>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de proyectos */}
          <div className="row g-4">
            {projects.map((project) => (
              <div key={project._id} className="col-lg-6 col-xl-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-header bg-white border-0 pb-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="card-title text-primary fw-bold mb-1">
                          {project.name}
                        </h5>
                        <span className={`badge bg-${getStatusColor(project.status)} mb-2`}>
                          {getStatusText(project.status)}
                        </span>
                      </div>
                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-outline-secondary" 
                          data-bs-toggle="dropdown"
                        >
                          <i className="bi bi-three-dots"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <Link className="dropdown-item" to={`/proyectos/${project._id}`}>
                              <i className="bi bi-eye"></i> Ver detalles
                            </Link>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button className="dropdown-item text-danger">
                              <i className="bi bi-trash"></i> Eliminar
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <p className="card-text text-muted mb-3">
                      {project.description}
                    </p>
                    
                    {/* Progreso */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">Progreso</small>
                        <small className="fw-bold">{project.progress || 0}%</small>
                      </div>
                      <div className="progress">
                        <div 
                          className="progress-bar bg-primary" 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Métricas del proyecto */}
                    <div className="row g-2 text-center">
                      <div className="col-4">
                        <div className="border-end">
                          <small className="d-block text-muted">Tareas</small>
                          <strong className="text-primary">
                            {project.taskCount || 0}
                          </strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="border-end">
                          <small className="d-block text-muted">Equipo</small>
                          <strong className="text-success">
                            {project.team?.length || 0}
                          </strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <small className="d-block text-muted">Prioridad</small>
                        <strong className={`text-${project.priority === 'high' ? 'danger' : project.priority === 'medium' ? 'warning' : 'secondary'}`}>
                          {project.priority || 'Media'}
                        </strong>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-footer bg-white border-0">
                    <div className="d-flex gap-2">
                      <Link 
                        to={`/proyectos/${project._id}`} 
                        className="btn btn-primary flex-fill"
                      >
                        <i className="bi bi-eye"></i> Ver Proyecto
                      </Link>
                      <button className="btn btn-outline-primary">
                        <i className="bi bi-gear"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Debug info */}
          <div className="mt-4">
            <small className="text-muted">
              📊 Total de proyectos cargados: {projects.length} | 
              🔄 Última actualización: {new Date().toLocaleTimeString()}
            </small>
          </div>
        </div>
      </div>

      {/* Modal integrado para crear proyecto */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Nuevo Proyecto
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                ></button>
              </div>
              
              <form onSubmit={handleCreateProject}>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {formError}
                    </div>
                  )}

                  <div className="row g-3">
                    {/* Nombre del proyecto */}
                    <div className="col-12">
                      <label className="form-label">
                        <i className="bi bi-bookmark me-2"></i>
                        Nombre del Proyecto *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Ej: Sistema de Gestión CRM"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Descripción */}
                    <div className="col-12">
                      <label className="form-label">
                        <i className="bi bi-file-text me-2"></i>
                        Descripción *
                      </label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        rows="3"
                        placeholder="Describe brevemente el objetivo y alcance del proyecto..."
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Estado y Prioridad */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="bi bi-flag me-2"></i>
                        Estado
                      </label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                      >
                        <option value="active">Activo</option>
                        <option value="paused">Pausado</option>
                        <option value="completed">Completado</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Prioridad
                      </label>
                      <select
                        className="form-select"
                        name="priority"
                        value={formData.priority}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>

                    {/* Fechas */}
                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="bi bi-calendar-event me-2"></i>
                        Fecha de Inicio
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="bi bi-calendar-check me-2"></i>
                        Fecha de Finalización
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleFormChange}
                        min={formData.startDate}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Los campos marcados con * son obligatorios
                    </small>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-lg me-2"></i>
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
}

export default ProjectsPage;