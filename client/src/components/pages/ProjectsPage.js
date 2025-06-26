import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔥 DATOS DINÁMICOS DE PROYECTOS
  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // Simular datos de proyectos (luego conectarás con API GET /api/projects)
      const projectsData = [
        {
          _id: 'proyecto-alpha',
          name: 'Proyecto Alpha',
          description: 'Sistema de gestión empresarial con módulos de CRM y facturación',
          status: 'active',
          progress: 75,
          tasksCount: 14,
          teamCount: 5,
          team: [
            { name: 'Ana García', avatar: null },
            { name: 'Carlos López', avatar: null },
            { name: 'Laura Martín', avatar: null }
          ],
          lastActivity: '2024-06-25'
        },
        {
          _id: 'ecommerce-beta',
          name: 'E-commerce Beta',
          description: 'Plataforma de comercio electrónico con sistema de pagos integrado',
          status: 'active',
          progress: 45,
          tasksCount: 8,
          teamCount: 3,
          team: [
            { name: 'María Sánchez', avatar: null },
            { name: 'Diego Ruiz', avatar: null }
          ],
          lastActivity: '2024-06-24'
        },
        {
          _id: 'app-movil',
          name: 'App Móvil',
          description: 'Aplicación móvil multiplataforma con React Native',
          status: 'active',
          progress: 95,
          tasksCount: 6,
          teamCount: 2,
          team: [
            { name: 'Sofia Herrera', avatar: null },
            { name: 'Juan Pablo', avatar: null }
          ],
          lastActivity: '2024-06-26'
        },
        {
          _id: 'marketing-q3',
          name: 'Marketing Q3',
          description: 'Campaña de marketing digital para el tercer trimestre',
          status: 'planning',
          progress: 25,
          tasksCount: 12,
          teamCount: 4,
          team: [
            { name: 'Carmen Torres', avatar: null },
            { name: 'Roberto Vega', avatar: null }
          ],
          lastActivity: '2024-06-23'
        }
      ];

      setProjects(projectsData);
      
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Función para obtener el color del badge de estado
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return { class: 'bg-success', text: 'Activo' };
      case 'planning':
        return { class: 'bg-warning', text: 'Planificación' };
      case 'completed':
        return { class: 'bg-primary', text: 'Completado' };
      case 'paused':
        return { class: 'bg-secondary', text: 'Pausado' };
      default:
        return { class: 'bg-secondary', text: 'Desconocido' };
    }
  };

  // Función para obtener el color de la barra de progreso
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-success';
    if (progress >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando proyectos...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={loadProjects}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Gestión de Proyectos</h1>
        <button type="button" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1"></i>Nuevo Proyecto
        </button>
      </div>

      <p className="text-muted mb-4">
        Tienes {projects.length} proyecto{projects.length !== 1 ? 's' : ''} actualmente. 
        Haz clic en cualquier proyecto para ver sus detalles.
      </p>

      {/* Lista de Proyectos */}
      <div className="row">
        {projects.map(project => {
          const statusBadge = getStatusBadge(project.status);
          const progressColor = getProgressColor(project.progress);
          
          return (
            <div key={project._id} className="col-lg-6 col-xl-4 mb-4">
              <div className="card h-100 project-card-hover">
                <div className="card-body">
                  {/* Header del proyecto */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-1">
                        <Link 
                          to={`/proyecto/${project._id}`}
                          className="text-decoration-none text-dark fw-bold"
                        >
                          {project.name}
                        </Link>
                      </h5>
                      <p className="card-text text-muted small mb-2">
                        {project.description}
                      </p>
                    </div>
                    <span className={`badge ${statusBadge.class} ms-2`}>
                      {statusBadge.text}
                    </span>
                  </div>

                  {/* Progreso */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted">Progreso</small>
                      <small className="fw-bold">{project.progress}%</small>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div 
                        className={`progress-bar ${progressColor}`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="row text-center mb-3">
                    <div className="col-4">
                      <div className="border-end">
                        <div className="fw-bold text-primary">{project.tasksCount}</div>
                        <small className="text-muted">Tareas</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border-end">
                        <div className="fw-bold text-success">{project.teamCount}</div>
                        <small className="text-muted">Miembros</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="fw-bold text-warning">
                        {Math.floor((Date.now() - new Date(project.lastActivity)) / (1000 * 60 * 60 * 24))}d
                      </div>
                      <small className="text-muted">Últ. actividad</small>
                    </div>
                  </div>

                  {/* Equipo */}
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex">
                      {project.team.slice(0, 3).map((member, index) => (
                        <div
                          key={index}
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '28px', 
                            height: '28px', 
                            fontSize: '11px',
                            marginLeft: index > 0 ? '-8px' : '0',
                            zIndex: 3 - index,
                            border: '2px solid white'
                          }}
                          title={member.name}
                        >
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      ))}
                      {project.teamCount > 3 && (
                        <div
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '28px', 
                            height: '28px', 
                            fontSize: '10px',
                            marginLeft: '-8px',
                            border: '2px solid white'
                          }}
                        >
                          +{project.teamCount - 3}
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      to={`/proyecto/${project._id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Ver Detalles <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>

                {/* Hover effect */}
                <div className="card-footer bg-transparent border-0 pt-0">
                  <Link 
                    to={`/proyecto/${project._id}`}
                    className="btn btn-light w-100 btn-sm text-primary fw-medium"
                  >
                    <i className="bi bi-folder-open me-1"></i>
                    Abrir Proyecto
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estado vacío */}
      {projects.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-folder2-open text-muted" style={{ fontSize: '4rem' }}></i>
          <h3 className="text-muted mt-3">No hay proyectos</h3>
          <p className="text-muted">Crea tu primer proyecto para comenzar</p>
          <button className="btn btn-primary">
            <i className="bi bi-plus-lg me-1"></i>Crear Primer Proyecto
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;