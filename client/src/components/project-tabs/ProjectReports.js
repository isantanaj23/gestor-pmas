import React from 'react';

const ProjectReports = ({ projectId, project, tasks }) => {
  // Calcular estadísticas
  const getProjectStats = () => {
    if (!tasks || tasks.length === 0) {
      return {
        totalTasks: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        review: 0,
        completionRate: 0
      };
    }

    const stats = {
      totalTasks: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      review: tasks.filter(t => t.status === 'review').length
    };

    stats.completionRate = Math.round((stats.completed / stats.totalTasks) * 100);
    
    return stats;
  };

  const stats = getProjectStats();

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  return (
    <div className="reports-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">Reportes del Proyecto</h5>
          <small className="text-muted">Métricas y análisis de rendimiento</small>
        </div>
        <button className="btn btn-outline-primary">
          <i className="bi bi-download me-1"></i>
          Exportar Reporte
        </button>
      </div>

      <div className="row">
        {/* Métricas principales */}
        <div className="col-md-3 mb-4">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-primary">{stats.totalTasks}</h3>
              <p className="text-muted mb-0">Total Tareas</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-success">{stats.completed}</h3>
              <p className="text-muted mb-0">Completadas</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-warning">{stats.inProgress}</h3>
              <p className="text-muted mb-0">En Progreso</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-secondary">{stats.pending}</h3>
              <p className="text-muted mb-0">Pendientes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Progreso del Proyecto</h6>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Progreso General</span>
                <span className="fw-bold">{stats.completionRate}%</span>
              </div>
              <div className="progress mb-4" style={{ height: '10px' }}>
                <div
                  className={`progress-bar bg-${getProgressColor(stats.completionRate)}`}
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>

              {/* Breakdown por estado */}
              <h6 className="mb-3">Distribución de Tareas</h6>
              <div className="row">
                <div className="col-6 mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Completadas</span>
                    <span className="text-success fw-bold">{stats.completed}</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${stats.totalTasks > 0 ? (stats.completed / stats.totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="d-flex justify-content-between">
                    <span>En Progreso</span>
                    <span className="text-primary fw-bold">{stats.inProgress}</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: `${stats.totalTasks > 0 ? (stats.inProgress / stats.totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="d-flex justify-content-between">
                    <span>En Revisión</span>
                    <span className="text-warning fw-bold">{stats.review}</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-warning"
                      style={{ width: `${stats.totalTasks > 0 ? (stats.review / stats.totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Pendientes</span>
                    <span className="text-secondary fw-bold">{stats.pending}</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-secondary"
                      style={{ width: `${stats.totalTasks > 0 ? (stats.pending / stats.totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Información del Proyecto</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted">Nombre del Proyecto</small>
                <p className="fw-bold mb-2">{project?.name || 'Sin nombre'}</p>
              </div>
              <div className="mb-3">
                <small className="text-muted">Estado</small>
                <p className="mb-2">
                  <span className={`badge bg-${project?.status === 'active' ? 'success' : 'secondary'}`}>
                    {project?.status === 'active' ? 'Activo' : project?.status || 'Desconocido'}
                  </span>
                </p>
              </div>
              <div className="mb-3">
                <small className="text-muted">Miembros del Equipo</small>
                <p className="fw-bold mb-2">{project?.team?.length || 0}</p>
              </div>
              <div className="mb-3">
                <small className="text-muted">Progreso Calculado</small>
                <p className="fw-bold mb-2 text-primary">{stats.completionRate}%</p>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Últimas Actividades</h6>
            </div>
            <div className="card-body">
              {tasks && tasks.length > 0 ? (
                <div className="timeline">
                  {tasks.slice(0, 3).map(task => (
                    <div key={task._id} className="d-flex mb-3">
                      <div 
                        className={`rounded-circle bg-${task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'primary' : 'secondary'} me-3`}
                        style={{ width: '8px', height: '8px', marginTop: '6px' }}
                      ></div>
                      <div>
                        <div className="fw-medium" style={{ fontSize: '14px' }}>
                          {task.title}
                        </div>
                        <small className="text-muted">
                          {task.status === 'completed' ? 'Completada' : 
                           task.status === 'in-progress' ? 'En progreso' : 
                           task.status === 'review' ? 'En revisión' : 'Pendiente'}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center">
                  <i className="bi bi-info-circle me-1"></i>
                  No hay actividades recientes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectReports;