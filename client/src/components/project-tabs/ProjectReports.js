import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import './ProjectReports.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const ProjectReports = () => {
  // Estado para el período seleccionado
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);

  // Datos simulados del proyecto
  const projectData = {
    name: "Proyecto Alpha",
    startDate: "2025-05-01",
    endDate: "2025-12-15",
    totalTasks: 47,
    completedTasks: 35,
    inProgressTasks: 8,
    pendingTasks: 4,
    totalBudget: 85000,
    usedBudget: 52000,
    teamMembers: 6,
    totalHours: 1240,
    averageVelocity: 8.5, // tareas por sprint
    lastUpdate: "2025-06-25"
  };

  // Datos para gráficos
  const taskProgressData = {
    labels: ['Completadas', 'En Progreso', 'Pendientes'],
    datasets: [
      {
        label: 'Tareas',
        data: [projectData.completedTasks, projectData.inProgressTasks, projectData.pendingTasks],
        backgroundColor: [
          'rgba(40, 167, 69, 0.8)',
          'rgba(48, 1, 255, 0.8)', 
          'rgba(108, 117, 125, 0.8)'
        ],
        borderColor: [
          'rgb(40, 167, 69)',
          'rgb(48, 1, 255)',
          'rgb(108, 117, 125)'
        ],
        borderWidth: 2,
      },
    ],
  };

  const burndownData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
    datasets: [
      {
        label: 'Tareas Planificadas',
        data: [47, 42, 38, 33, 28, 23, 18, 12],
        borderColor: 'rgba(108, 117, 125, 0.8)',
        backgroundColor: 'rgba(108, 117, 125, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
      },
      {
        label: 'Tareas Reales',
        data: [47, 44, 39, 36, 30, 25, 18, 12],
        borderColor: 'rgba(48, 1, 255, 0.8)',
        backgroundColor: 'rgba(48, 1, 255, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const teamProductivityData = {
    labels: ['Ana García', 'Laura Martín', 'David Chen', 'Carlos López', 'Miguel Torres'],
    datasets: [
      {
        label: 'Tareas Completadas',
        data: [12, 9, 8, 4, 2],
        backgroundColor: 'rgba(40, 167, 69, 0.8)',
        borderColor: 'rgb(40, 167, 69)',
        borderWidth: 1,
      },
      {
        label: 'Horas Trabajadas',
        data: [85, 72, 68, 45, 28],
        backgroundColor: 'rgba(48, 1, 255, 0.8)', 
        borderColor: 'rgb(48, 1, 255)',
        borderWidth: 1,
      },
    ],
  };

  // Opciones para gráficos
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Calcular métricas
  const progressPercentage = Math.round((projectData.completedTasks / projectData.totalTasks) * 100);
  const budgetPercentage = Math.round((projectData.usedBudget / projectData.totalBudget) * 100);
  const daysElapsed = Math.floor((new Date() - new Date(projectData.startDate)) / (1000 * 60 * 60 * 24));
  const totalProjectDays = Math.floor((new Date(projectData.endDate) - new Date(projectData.startDate)) / (1000 * 60 * 60 * 24));
  const timePercentage = Math.round((daysElapsed / totalProjectDays) * 100);

  // Datos de hitos del proyecto
  const milestones = [
    {
      id: 1,
      title: "Análisis de Requerimientos",
      date: "2025-05-15",
      status: "completed",
      description: "Documentación completa de requisitos funcionales y no funcionales"
    },
    {
      id: 2,
      title: "Diseño de Arquitectura",
      date: "2025-06-01",
      status: "completed", 
      description: "Definición de la arquitectura del sistema y tecnologías"
    },
    {
      id: 3,
      title: "Prototipo Funcional",
      date: "2025-06-30",
      status: "in-progress",
      description: "Desarrollo del MVP con funcionalidades básicas"
    },
    {
      id: 4,
      title: "Testing e Integración",
      date: "2025-08-15",
      status: "pending",
      description: "Pruebas exhaustivas y integración de componentes"
    },
    {
      id: 5,
      title: "Deploy de Producción",
      date: "2025-10-01",
      status: "pending",
      description: "Lanzamiento oficial del sistema en producción"
    }
  ];

  // Función para exportar reporte
  const exportReport = (format) => {
    setLoading(true);
    // Simular export
    setTimeout(() => {
      setLoading(false);
      alert(`Reporte exportado en formato ${format.toUpperCase()}`);
    }, 2000);
  };

  return (
    <div className="project-reports-container p-4">
      {/* Header con controles */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">
            <i className="bi bi-graph-up me-2 text-primary"></i>
            Reportes del Proyecto
          </h3>
          <p className="text-muted mb-0">Análisis de rendimiento y métricas del {projectData.name}</p>
        </div>
        
        <div className="d-flex gap-2 align-items-center">
          {/* Selector de período */}
          <select 
            className="form-select form-select-sm"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{width: 'auto'}}
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="all">Todo el Proyecto</option>
          </select>
          
          {/* Botones de export */}
          <div className="btn-group">
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => exportReport('pdf')}
              disabled={loading}
            >
              <i className="bi bi-file-earmark-pdf me-1"></i>
              PDF
            </button>
            <button 
              className="btn btn-outline-success btn-sm"
              onClick={() => exportReport('excel')}
              disabled={loading}
            >
              <i className="bi bi-file-earmark-excel me-1"></i>
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="kpi-card h-100 border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-primary text-uppercase mb-1 fw-bold">Progreso General</h6>
                  <h3 className="mb-2 text-primary">{progressPercentage}%</h3>
                  <p className="text-muted mb-2 small">
                    {projectData.completedTasks} de {projectData.totalTasks} tareas
                  </p>
                  <div className="progress" style={{height: '4px'}}>
                    <div 
                      className="progress-bar bg-primary" 
                      style={{width: `${progressPercentage}%`}}
                    ></div>
                  </div>
                </div>
                <i className="bi bi-check-circle fs-1 text-primary opacity-25"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="kpi-card h-100 border-start border-warning border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-warning text-uppercase mb-1 fw-bold">Presupuesto Usado</h6>
                  <h3 className="mb-2 text-warning">{budgetPercentage}%</h3>
                  <p className="text-muted mb-2 small">
                    ${projectData.usedBudget.toLocaleString()} de ${projectData.totalBudget.toLocaleString()}
                  </p>
                  <div className="progress" style={{height: '4px'}}>
                    <div 
                      className="progress-bar bg-warning" 
                      style={{width: `${budgetPercentage}%`}}
                    ></div>
                  </div>
                </div>
                <i className="bi bi-currency-dollar fs-1 text-warning opacity-25"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="kpi-card h-100 border-start border-info border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-info text-uppercase mb-1 fw-bold">Tiempo Transcurrido</h6>
                  <h3 className="mb-2 text-info">{timePercentage}%</h3>
                  <p className="text-muted mb-2 small">
                    {daysElapsed} de {totalProjectDays} días
                  </p>
                  <div className="progress" style={{height: '4px'}}>
                    <div 
                      className="progress-bar bg-info" 
                      style={{width: `${timePercentage}%`}}
                    ></div>
                  </div>
                </div>
                <i className="bi bi-clock fs-1 text-info opacity-25"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="kpi-card h-100 border-start border-success border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-success text-uppercase mb-1 fw-bold">Velocidad del Equipo</h6>
                  <h3 className="mb-2 text-success">{projectData.averageVelocity}</h3>
                  <p className="text-muted mb-2 small">
                    Tareas por sprint
                  </p>
                  <div className="text-success small">
                    <i className="bi bi-arrow-up me-1"></i>
                    +0.5 vs sprint anterior
                  </div>
                </div>
                <i className="bi bi-speedometer2 fs-1 text-success opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="row mb-4">
        {/* Progreso de tareas */}
        <div className="col-lg-4 mb-4">
          <div className="card chart-card h-100">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-pie-chart me-2"></i>
                Distribución de Tareas
              </h6>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
              <div style={{width: '250px', height: '250px'}}>
                <Doughnut data={taskProgressData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Burndown Chart */}
        <div className="col-lg-8 mb-4">
          <div className="card chart-card h-100">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-graph-down me-2"></i>
                Burndown Chart
              </h6>
            </div>
            <div className="card-body">
              <Line data={burndownData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        {/* Productividad del equipo */}
        <div className="col-lg-8 mb-4">
          <div className="card chart-card h-100">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-bar-chart me-2"></i>
                Productividad del Equipo
              </h6>
            </div>
            <div className="card-body">
              <Bar data={teamProductivityData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Timeline de hitos */}
        <div className="col-lg-4 mb-4">
          <div className="card timeline-card h-100">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-flag me-2"></i>
                Hitos del Proyecto
              </h6>
            </div>
            <div className="card-body">
              <div className="timeline">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="timeline-item">
                    <div className={`timeline-marker ${milestone.status}`}>
                      <i className={`bi ${
                        milestone.status === 'completed' ? 'bi-check-circle-fill' :
                        milestone.status === 'in-progress' ? 'bi-clock-fill' :
                        'bi-circle'
                      }`}></i>
                    </div>
                    <div className="timeline-content">
                      <h6 className="timeline-title">{milestone.title}</h6>
                      <p className="timeline-date text-muted small mb-1">
                        <i className="bi bi-calendar-event me-1"></i>
                        {new Date(milestone.date).toLocaleDateString('es-ES')}
                      </p>
                      <p className="timeline-description small text-muted mb-0">
                        {milestone.description}
                      </p>
                      <span className={`badge ${
                        milestone.status === 'completed' ? 'bg-success' :
                        milestone.status === 'in-progress' ? 'bg-primary' :
                        'bg-secondary'
                      } mt-1`}>
                        {milestone.status === 'completed' ? 'Completado' :
                         milestone.status === 'in-progress' ? 'En Progreso' :
                         'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="row">
        <div className="col-12">
          <div className="card metrics-table-card">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-table me-2"></i>
                Métricas Detalladas
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="metric-item">
                    <div className="metric-label">Total de Horas Trabajadas</div>
                    <div className="metric-value">{projectData.totalHours.toLocaleString()}h</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Promedio por Miembro</div>
                    <div className="metric-value">{Math.round(projectData.totalHours / projectData.teamMembers)}h</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Eficiencia</div>
                    <div className="metric-value text-success">92.3%</div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="metric-item">
                    <div className="metric-label">Tareas por Día</div>
                    <div className="metric-value">2.8</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Tiempo Promedio por Tarea</div>
                    <div className="metric-value">35.4h</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">ROI Estimado</div>
                    <div className="metric-value text-success">+285%</div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="metric-item">
                    <div className="metric-label">Fecha de Finalización</div>
                    <div className="metric-value">{new Date(projectData.endDate).toLocaleDateString('es-ES')}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Días Restantes</div>
                    <div className="metric-value">{totalProjectDays - daysElapsed}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Estado General</div>
                    <div className="metric-value text-success">En tiempo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Generando reporte...</span>
          </div>
          <p className="mt-2">Generando reporte...</p>
        </div>
      )}
    </div>
  );
};

export default ProjectReports;