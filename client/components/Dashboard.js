import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [weeklyMetrics, setWeeklyMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Cargar estadísticas principales
      const statsResponse = await dashboardService.getStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      } else {
        console.error('Error cargando estadísticas:', statsResponse.message);
      }

      // Cargar actividad reciente
      const activityResponse = await dashboardService.getRecentActivity(8);
      if (activityResponse.success) {
        setRecentActivity(activityResponse.data);
      } else {
        console.error('Error cargando actividad reciente:', activityResponse.message);
      }

      // Cargar métricas semanales
      const metricsResponse = await dashboardService.getWeeklyMetrics();
      if (metricsResponse.success) {
        setWeeklyMetrics(metricsResponse.data);
      } else {
        console.error('Error cargando métricas semanales:', metricsResponse.message);
      }

    } catch (error) {
      console.error('Error general cargando dashboard:', error);
      setError('Error cargando los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para refrescar datos
  const handleRefresh = () => {
    loadDashboardData();
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Hace un momento';
    if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;
    if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)} horas`;
    return `Hace ${Math.floor(diffMinutes / 1440)} días`;
  };

  // Función para obtener icono según tipo de actividad
  const getActivityIcon = (type) => {
    switch (type) {
      case 'task': return 'bi-check-square';
      case 'project': return 'bi-folder';
      case 'contact': return 'bi-person';
      case 'activity': return 'bi-calendar-check';
      default: return 'bi-info-circle';
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

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <h5 className="text-muted">Cargando Dashboard...</h5>
            <p className="text-muted">Obteniendo tus datos más recientes</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>
            <strong>Error:</strong> {error}
            <button className="btn btn-outline-danger btn-sm ms-3" onClick={handleRefresh}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 animate-fade-in">
      {/* Header del Dashboard */}
      <div className="row align-items-center mb-4">
        <div className="col-md-8">
          <div className="d-flex align-items-center">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Usuario')}&background=6f42c1&color=fff&size=64`}
              className="rounded-circle me-3 border"
              style={{ width: '64px', height: '64px', objectFit: 'cover' }}
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
                })} • Aquí tienes tu resumen
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-md-end">
          <div className="btn-group">
            <button className="btn btn-primary" onClick={handleRefresh}>
              <i className="bi bi-arrow-clockwise me-1"></i> 
              Actualizar
            </button>
            <button className="btn btn-outline-primary">
              <i className="bi bi-plus-lg me-1"></i> 
              Nueva Tarea
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="row mb-4">
        {/* Proyectos Activos */}
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-primary border-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-primary text-uppercase mb-2 fw-bold small">
                    Proyectos Activos
                  </div>
                  <div className="h2 mb-2 text-dark">
                    {stats?.projects?.activeProjects || 0}
                  </div>
                  <div className="text-success small">
                    <i className="bi bi-arrow-up-right me-1"></i>
                    <span className="fw-bold">
                      {Math.round(stats?.projects?.averageProgress || 0)}%
                    </span> progreso promedio
                  </div>
                </div>
                <div className="text-primary opacity-50">
                  <i className="bi bi-folder-fill" style={{ fontSize: '3rem' }}></i>
                </div>
              </div>
              <div className="progress mt-3" style={{ height: '4px' }}>
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{ width: `${stats?.projects?.averageProgress || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tareas Pendientes */}
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-warning border-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-warning text-uppercase mb-2 fw-bold small">
                    Tareas Pendientes
                  </div>
                  <div className="h2 mb-2 text-dark">
                    {stats?.tasks?.pendingTasks || 0}
                  </div>
                  <div className="text-danger small">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    <span className="fw-bold">
                      {stats?.tasks?.highPriorityTasks || 0}
                    </span> alta prioridad
                  </div>
                </div>
                <div className="text-warning opacity-50">
                  <i className="bi bi-list-task" style={{ fontSize: '3rem' }}></i>
                </div>
              </div>
              <div className="progress mt-3" style={{ height: '4px' }}>
                <div
                  className="progress-bar bg-warning"
                  role="progressbar"
                  style={{ 
                    width: `${stats?.tasks?.totalTasks ? 
                      (stats.tasks.pendingTasks / stats.tasks.totalTasks) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Contactos CRM */}
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-info border-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-info text-uppercase mb-2 fw-bold small">
                    Pipeline CRM
                  </div>
                  <div className="h2 mb-2 text-dark">
                    {stats?.crm?.totalContacts || 0}
                  </div>
                  <div className="text-success small">
                    <i className="bi bi-graph-up me-1"></i>
                    <span className="fw-bold">
                      {stats?.summary?.conversionRate || 0}%
                    </span> conversión
                  </div>
                </div>
                <div className="text-info opacity-50">
                  <i className="bi bi-people-fill" style={{ fontSize: '3rem' }}></i>
                </div>
              </div>
              <div className="progress mt-3" style={{ height: '4px' }}>
                <div
                  className="progress-bar bg-info"
                  role="progressbar"
                  style={{ width: `${stats?.summary?.conversionRate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tareas Completadas */}
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-success border-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <div className="text-success text-uppercase mb-2 fw-bold small">
                    Tareas Completadas
                  </div>
                  <div className="h2 mb-2 text-dark">
                    {stats?.tasks?.completedTasks || 0}
                  </div>
                  <div className="text-success small">
                    <i className="bi bi-check-circle me-1"></i>
                    <span className="fw-bold">
                      {stats?.summary?.taskCompletionRate || 0}%
                    </span> completitud
                  </div>
                </div>
                <div className="text-success opacity-50">
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
                </div>
              </div>
              <div className="progress mt-3" style={{ height: '4px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${stats?.summary?.taskCompletionRate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="row">
        {/* Actividad Reciente */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center py-3">
              <div className="d-flex align-items-center">
                <i className="bi bi-activity text-primary fs-4 me-2"></i>
                <h6 className="mb-0 fw-bold text-primary">Actividad Reciente</h6>
              </div>
              <span className="badge bg-light text-success border">En tiempo real</span>
            </div>
            <div className="card-body p-0">
              {recentActivity.length > 0 ? (
                <div className="list-group list-group-flush">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="list-group-item border-0 p-3">
                      <div className="d-flex align-items-start">
                        <div className={`bg-${activity.type === 'task' ? 'primary' : 
                                        activity.type === 'contact' ? 'info' : 
                                        activity.type === 'activity' ? 'success' : 'secondary'} 
                                       rounded-circle p-2 me-3`}>
                          <i className={`bi ${getActivityIcon(activity.type)} text-white`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <strong className="text-dark">{activity.title}</strong>
                            <small className="text-muted">{formatDate(activity.date)}</small>
                          </div>
                          <p className="mb-2 text-muted small">{activity.description}</p>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-dark border small">
                              {activity.type === 'task' ? 'Tarea' :
                               activity.type === 'contact' ? 'Contacto' :
                               activity.type === 'activity' ? 'Actividad' : 'Proyecto'}
                            </span>
                            {activity.priority && (
                              <span className={`badge bg-${getPriorityColor(activity.priority)} small`}>
                                {activity.priority}
                              </span>
                            )}
                            {activity.status && (
                              <span className="badge bg-secondary small">
                                {activity.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                  <h5 className="text-muted mt-3">Sin actividad reciente</h5>
                  <p className="text-muted">Comienza creando un proyecto o tarea</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Métricas Semanales y Resumen */}
        <div className="col-lg-4">
          <div className="row">
            {/* Métricas de la Semana */}
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center py-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-graph-up-arrow text-success fs-4 me-2"></i>
                    <h6 className="mb-0 fw-bold text-success">Esta Semana</h6>
                  </div>
                  <small className="text-muted">7 días</small>
                </div>
                <div className="card-body">
                  {weeklyMetrics ? (
                    <>
                      <div className="row text-center mb-3">
                        <div className="col-6">
                          <div className="h4 text-primary mb-1">
                            {weeklyMetrics.weeklyTasksCompleted}
                          </div>
                          <small className="text-muted">Tareas Completadas</small>
                        </div>
                        <div className="col-6">
                          <div className="h4 text-info mb-1">
                            {weeklyMetrics.weeklyActivitiesCompleted}
                          </div>
                          <small className="text-muted">Actividades CRM</small>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Progreso Proyectos</small>
                          <small className="fw-bold">{weeklyMetrics.activeProjectsAvgProgress}%</small>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${weeklyMetrics.activeProjectsAvgProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-center">
                        <small className="text-success">
                          <i className="bi bi-trophy-fill me-1"></i>
                          {weeklyMetrics.weeklyNewContacts} nuevos contactos esta semana
                        </small>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="small text-muted mt-2">Cargando métricas...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen Rápido */}
            <div className="col-12">
              <div className="card">
                <div className="card-header py-3">
                  <h6 className="mb-0 fw-bold text-secondary">
                    <i className="bi bi-speedometer2 me-2"></i>
                    Resumen Rápido
                  </h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">Total Proyectos</span>
                    <span className="fw-bold">{stats?.projects?.totalProjects || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">Total Tareas</span>
                    <span className="fw-bold">{stats?.tasks?.totalTasks || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">Total Contactos</span>
                    <span className="fw-bold">{stats?.crm?.totalContacts || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-muted">Actividades Pendientes</span>
                    <span className="fw-bold text-warning">
                      {stats?.activities?.pendingActivities || 0}
                    </span>
                  </div>

                  <hr className="my-3" />

                  {stats?.crm?.totalValue && (
                    <div className="text-center">
                      <div className="h5 text-success mb-1">
                        ${(stats.crm.totalValue || 0).toLocaleString()}
                      </div>
                      <small className="text-muted">Valor Total Pipeline</small>
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