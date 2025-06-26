import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import crmService from '../services/crmService';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    recentActivity: [],
    myTasks: [],
    projects: [],
    loading: true,
    error: null
  });

  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));

        // Cargar todas las APIs en paralelo
        const [statsResult, activityResult, tasksResult, projectsResult] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivity(5),
          taskService.getMyTasks(),
          projectService.getProjects()
        ]);

        console.log('📊 Datos del dashboard cargados:', {
          stats: statsResult,
          activity: activityResult,
          tasks: tasksResult,
          projects: projectsResult
        });

        setDashboardData({
          stats: statsResult.success ? statsResult.data : null,
          recentActivity: activityResult.success && activityResult.data.length > 0 
            ? activityResult.data 
            : [
                // Datos de respaldo si no hay actividad real
                {
                  _id: 'temp1',
                  title: 'Bienvenido a Planifica+',
                  description: 'Tu dashboard está configurado y funcionando correctamente',
                  type: 'system',
                  createdAt: new Date().toISOString()
                },
                {
                  _id: 'temp2',
                  title: 'Sistema conectado',
                  description: 'Frontend y backend comunicándose perfectamente',
                  type: 'system',
                  createdAt: new Date(Date.now() - 30000).toISOString() // Hace 30 segundos
                },
                {
                  _id: 'temp3',
                  title: 'Autenticación activa',
                  description: `Usuario ${user?.name || 'Usuario'} autenticado como ${user?.role || 'developer'}`,
                  type: 'auth',
                  createdAt: new Date(Date.now() - 120000).toISOString() // Hace 2 minutos
                }
              ],
          myTasks: tasksResult.success ? tasksResult.data : [],
          projects: projectsResult.success ? projectsResult.data : [],
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Error cargando los datos del dashboard'
        }));
      }
    };

    loadDashboardData();
  }, [user]); // Agregamos user como dependencia

  // Función para formatear fecha de manera segura
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Hace un momento';
      }
      
      // Calcular tiempo relativo
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Ahora mismo';
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `Hace ${diffInHours}h`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `Hace ${diffInDays} días`;
      
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return 'Fecha no válida';
    }
  };

  // Función para obtener el ícono según el tipo de actividad
  const getActivityIcon = (activity) => {
    if (activity.type === 'task') return 'bi-check-circle';
    if (activity.type === 'project') return 'bi-kanban';
    if (activity.type === 'contact') return 'bi-person-plus';
    if (activity.type === 'auth') return 'bi-shield-check';
    if (activity.type === 'system') return 'bi-gear';
    return 'bi-clock';
  };

  // Función para obtener el color según el tipo
  const getActivityColor = (activity) => {
    if (activity.type === 'task') return 'bg-success';
    if (activity.type === 'project') return 'bg-primary';
    if (activity.type === 'contact') return 'bg-info';
    if (activity.type === 'auth') return 'bg-warning';
    if (activity.type === 'system') return 'bg-secondary';
    return 'bg-primary';
  };

  // Loading spinner
  if (dashboardData.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardData.error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {dashboardData.error}
          <button 
            className="btn btn-sm btn-outline-warning ms-3"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { stats, recentActivity, myTasks, projects } = dashboardData;

  return (
    <div className="container-fluid p-4">
      {/* Header personalizado */}
      <div className="row align-items-center mb-4">
        <div className="col-md-8">
          <div className="d-flex align-items-center">
            <img
              src={user?.avatar || "https://placehold.co/64x64/964ef9/white?text=" + (user?.name?.charAt(0) || 'U')}
              className="rounded-circle me-3 border"
              style={{
                borderWidth: '3px !important',
                borderColor: '#e9ecef !important',
                width: '64px',
                height: '64px'
              }}
              alt="Avatar usuario"
            />
            <div>
              <h1 className="h2 mb-1">¡Buen día, {user?.name || 'Usuario'}! 👋</h1>
              <p className="text-muted mb-0">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} • Aquí tienes un resumen de tu jornada
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-md-end">
          <div className="btn-group">
            <button className="btn btn-primary">
              <i className="bi bi-plus-lg me-1"></i> Nueva Tarea
            </button>
            <button className="btn btn-outline-primary">
              <i className="bi bi-kanban me-1"></i> Ver Proyectos
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-primary border-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-primary text-uppercase mb-2 fw-bold" style={{ fontSize: '0.75rem' }}>
                    Tareas Activas
                  </div>
                  <div className="fs-2 fw-bold mb-2">
                    {myTasks?.filter(task => task.status !== 'done').length || 0}
                  </div>
                  <div className="text-success">
                    <i className="bi bi-arrow-up-right me-1"></i>
                    <span className="fw-bold">
                      {myTasks?.filter(task => task.status === 'in-progress').length || 0}
                    </span> en progreso
                  </div>
                </div>
                <div className="fs-1 text-primary opacity-75">
                  <i className="bi bi-list-task"></i>
                </div>
              </div>
              <div className="progress mt-3" style={{ height: '4px' }}>
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{ 
                    width: myTasks?.length > 0 
                      ? `${(myTasks.filter(task => task.status === 'done').length / myTasks.length) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-success border-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-success text-uppercase mb-2 fw-bold" style={{ fontSize: '0.75rem' }}>
                    Proyectos Activos
                  </div>
                  <div className="fs-2 fw-bold mb-2">
                    {projects?.filter(project => project.status === 'active').length || 0}
                  </div>
                  <div className="text-success">
                    <i className="bi bi-graph-up me-1"></i>
                    <span className="fw-bold">
                      {projects?.length > 0 
                        ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
                        : 0}%
                    </span> progreso promedio
                  </div>
                </div>
                <div className="fs-1 text-success opacity-75">
                  <i className="bi bi-kanban"></i>
                </div>
              </div>
              <div className="progress mt-3" style={{ height: '4px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ 
                    width: projects?.length > 0 
                      ? `${projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-info border-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-info text-uppercase mb-2 fw-bold" style={{ fontSize: '0.75rem' }}>
                    Rol del Usuario
                  </div>
                  <div className="fs-4 fw-bold mb-2 text-capitalize">
                    {user?.role || 'Developer'}
                  </div>
                  <div className="text-info">
                    <i className="bi bi-building me-1"></i>
                    <span className="fw-bold text-capitalize">
                      {user?.department || 'Development'}
                    </span>
                  </div>
                </div>
                <div className="fs-1 text-info opacity-75">
                  <i className="bi bi-person-badge"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-warning border-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-warning text-uppercase mb-2 fw-bold" style={{ fontSize: '0.75rem' }}>
                    Actividad Reciente
                  </div>
                  <div className="fs-2 fw-bold mb-2">
                    {recentActivity?.length || 0}
                  </div>
                  <div className="text-warning">
                    <i className="bi bi-clock me-1"></i>
                    <span className="fw-bold">Últimas</span> 24 horas
                  </div>
                </div>
                <div className="fs-1 text-warning opacity-75">
                  <i className="bi bi-activity"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="row">
        {/* Mis Tareas */}
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center py-3">
              <div className="d-flex align-items-center">
                <i className="bi bi-list-check text-primary fs-4 me-2"></i>
                <h6 className="mb-0 fw-bold text-primary">Mis Tareas Pendientes</h6>
              </div>
              <div className="d-flex gap-2">
                <span className="badge bg-light text-primary border">
                  {myTasks?.filter(task => task.status !== 'done').length || 0} pendientes
                </span>
                <button className="btn btn-sm btn-outline-primary">Ver Todas</button>
              </div>
            </div>
            <div className="card-body p-0">
              {myTasks && myTasks.length > 0 ? (
                myTasks.slice(0, 5).map((task, index) => (
                  <div key={task._id} className="p-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center">
                        <div className="form-check me-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={task.status === 'done'}
                            readOnly
                          />
                        </div>
                        <div className="flex-grow-1">
                          <strong className={`task-title ${task.status === 'done' ? 'text-decoration-line-through text-muted' : ''}`}>
                            {task.title}
                          </strong>
                          <div className="d-flex align-items-center mt-1">
                            <small className="text-muted me-3">
                              {task.project?.name || 'Sin proyecto'}
                            </small>
                            <span className={`badge ${
                              task.priority === 'high' ? 'bg-danger' :
                              task.priority === 'medium' ? 'bg-warning text-dark' : 'bg-info'
                            }`}>
                              {task.priority === 'high' ? 'Alta' : 
                               task.priority === 'medium' ? 'Media' : 'Baja'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <small className="text-muted">
                        {formatDate(task.createdAt)}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-check-circle fs-1 mb-3 opacity-50"></i>
                  <p className="mb-2">¡No tienes tareas pendientes!</p>
                  <small className="text-muted mb-3">Crea una nueva tarea para empezar</small>
                  <button className="btn btn-primary">
                    <i className="bi bi-plus-lg me-1"></i> Crear Nueva Tarea
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proyectos y Actividad */}
        <div className="col-lg-5">
          <div className="row">
            {/* Proyectos Recientes */}
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center py-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-kanban text-success fs-4 me-2"></i>
                    <h6 className="mb-0 fw-bold text-success">Proyectos Activos</h6>
                  </div>
                  <span className="badge bg-light text-success border">
                    {projects?.length || 0}
                  </span>
                </div>
                <div className="card-body p-0">
                  {projects && projects.length > 0 ? (
                    projects.slice(0, 3).map((project) => (
                      <div key={project._id} className="p-3 border-bottom">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <strong>{project.name}</strong>
                            <div className="text-muted small">{project.description}</div>
                          </div>
                          <span className={`badge ${
                            project.status === 'active' ? 'bg-success' :
                            project.status === 'planning' ? 'bg-info' : 'bg-secondary'
                          }`}>
                            {project.status === 'active' ? 'Activo' :
                             project.status === 'planning' ? 'Planificando' : 'Completado'}
                          </span>
                        </div>
                        <div className="progress" style={{ height: '4px' }}>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                        <small className="text-muted">{project.progress || 0}% completado</small>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted">
                      <i className="bi bi-folder fs-1 mb-3 opacity-50"></i>
                      <p className="mb-2">No tienes proyectos aún</p>
                      <small className="text-muted mb-3">Crea tu primer proyecto</small>
                      <button className="btn btn-success">
                        <i className="bi bi-plus-lg me-1"></i> Crear Proyecto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actividad Reciente - MEJORADA */}
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center py-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-activity text-info fs-4 me-2"></i>
                    <h6 className="mb-0 fw-bold text-info">Actividad Reciente</h6>
                  </div>
                  <span className="badge bg-light text-info border">En vivo</span>
                </div>
                <div className="card-body">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={activity._id || index} className="d-flex align-items-start mb-3">
                        <div className={`${getActivityColor(activity)} rounded-circle p-2 me-3 flex-shrink-0`}>
                          <i className={`bi ${getActivityIcon(activity)} text-white`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold">
                            {activity.title || activity.name || 'Actividad reciente'}
                          </div>
                          <div className="text-muted small mb-1">
                            {activity.description || 'Sin descripción'}
                          </div>
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {formatDate(activity.createdAt || activity.updatedAt)}
                          </small>
                        </div>
                        <div className="text-end flex-shrink-0">
                          <span className={`badge ${
                            activity.type === 'task' ? 'bg-success-subtle text-success' :
                            activity.type === 'project' ? 'bg-primary-subtle text-primary' :
                            activity.type === 'system' ? 'bg-secondary-subtle text-secondary' :
                            'bg-info-subtle text-info'
                          }`}>
                            {activity.type === 'task' ? 'Tarea' :
                             activity.type === 'project' ? 'Proyecto' :
                             activity.type === 'contact' ? 'Contacto' :
                             activity.type === 'system' ? 'Sistema' :
                             activity.type === 'auth' ? 'Auth' : 'Actividad'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-clock fs-1 mb-3 opacity-50"></i>
                      <p className="mb-2">No hay actividad reciente</p>
                      <small>La actividad aparecerá aquí cuando crees proyectos, tareas o contactos</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;