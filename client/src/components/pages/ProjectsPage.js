import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectsPage() {
  const navigate = useNavigate();

  const projects = [
    {
      id: 'proyecto-alpha',
      title: 'Proyecto Alpha',
      description: 'Sistema de gestión empresarial con módulos de CRM y facturación.',
      status: 'Activo',
      tasks: 14,
      progress: 75,
      members: 5
    },
    {
      id: 'ecommerce-beta',
      title: 'E-commerce Beta',
      description: 'Plataforma de comercio electrónico con integración de pagos.',
      status: 'Pausado',
      tasks: 8,
      progress: 45,
      members: 3
    },
    {
      id: 'app-movil',
      title: 'App Móvil',
      description: 'Aplicación nativa para iOS y Android con sincronización.',
      status: 'Completado',
      tasks: 22,
      progress: 100,
      members: 4
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Activo': return 'success';
      case 'Pausado': return 'warning';
      case 'Completado': return 'primary';
      default: return 'secondary';
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/proyecto/${projectId}`);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2">Gestión de Proyectos</h1>
          <p className="text-muted">Selecciona un proyecto para ver sus tareas.</p>
        </div>
        <button className="btn btn-primary">
          <i className="bi bi-plus-lg me-1"></i>
          Nuevo Proyecto
        </button>
      </div>

      <div className="row">
        {projects.map((project, index) => (
          <div key={index} className="col-lg-4 col-md-6 mb-4">
            <div 
              className="card h-100 shadow-sm"
              style={{ cursor: 'pointer' }}
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="card-title">{project.title}</h5>
                    <p className="card-text text-muted small">{project.description}</p>
                  </div>
                  <span className={`badge bg-${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <div className="row text-center mb-3">
                  <div className="col-4">
                    <div className="h4 mb-0">{project.tasks}</div>
                    <small className="text-muted">Tareas</small>
                  </div>
                  <div className="col-4">
                    <div className="h4 mb-0">{project.progress}%</div>
                    <small className="text-muted">Progreso</small>
                  </div>
                  <div className="col-4">
                    <div className="h4 mb-0">{project.members}</div>
                    <small className="text-muted">Miembros</small>
                  </div>
                </div>

                <div className="progress mb-3" style={{ height: '8px' }}>
                  <div 
                    className={`progress-bar bg-${getStatusColor(project.status)}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>

                <div className="d-flex align-items-center">
                  <div className="d-flex">
                    <img src="https://placehold.co/32x32/964ef9/white?text=A" className="rounded-circle me-1" alt="Avatar" />
                    <img src="https://placehold.co/32x32/ffc107/white?text=B" className="rounded-circle me-1" alt="Avatar" />
                    <img src="https://placehold.co/32x32/dc3545/white?text=C" className="rounded-circle me-1" alt="Avatar" />
                  </div>
                  <small className="text-muted ms-2">+2 más</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectsPage;