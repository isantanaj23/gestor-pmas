import React, { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import './ReportsPage.css';


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

const ReportsPage = () => {
  // Estado para filtros
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [loading, setLoading] = useState(false);

  // Datos simulados globales
  const globalData = {
    totalProjects: 12,
    activeProjects: 4,
    completedProjects: 8,
    totalTasks: 247,
    completedTasks: 189,
    totalRevenue: 524000,
    totalCosts: 287000,
    totalUsers: 45,
    activeUsers: 32,
    totalClients: 24,
    activeClients: 18,
    lastUpdate: new Date()
  };

  // Datos para gráficos
  const revenueData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Ingresos',
        data: [65000, 78000, 92000, 85000, 98000, 105000],
        borderColor: 'rgba(40, 167, 69, 1)',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Costos',
        data: [35000, 42000, 48000, 52000, 55000, 58000],
        borderColor: 'rgba(220, 53, 69, 1)',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const projectsData = {
    labels: ['Completados', 'En Progreso', 'En Pausa', 'Cancelados'],
    datasets: [
      {
        data: [8, 4, 2, 1],
        backgroundColor: [
          'rgba(40, 167, 69, 0.8)',
          'rgba(48, 1, 255, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(220, 53, 69, 0.8)'
        ],
        borderColor: [
          'rgb(40, 167, 69)',
          'rgb(48, 1, 255)',
          'rgb(255, 193, 7)',
          'rgb(220, 53, 69)'
        ],
        borderWidth: 2,
      },
    ],
  };

  const performanceData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
    datasets: [
      {
        label: 'Productividad del Equipo',
        data: [75, 82, 78, 85, 88, 92, 89, 95],
        backgroundColor: 'rgba(48, 1, 255, 0.8)',
        borderColor: 'rgb(48, 1, 255)',
        borderWidth: 1,
      },
      {
        label: 'Satisfacción del Cliente',
        data: [88, 85, 90, 87, 92, 94, 91, 96],
        backgroundColor: 'rgba(40, 167, 69, 0.8)',
        borderColor: 'rgb(40, 167, 69)',
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
  const profitMargin = Math.round(((globalData.totalRevenue - globalData.totalCosts) / globalData.totalRevenue) * 100);
  const projectCompletionRate = Math.round((globalData.completedProjects / globalData.totalProjects) * 100);
  const taskCompletionRate = Math.round((globalData.completedTasks / globalData.totalTasks) * 100);
  const userEngagement = Math.round((globalData.activeUsers / globalData.totalUsers) * 100);

  // Función para exportar reporte
  const exportReport = (format) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Reporte ${selectedPeriod} exportado en formato ${format.toUpperCase()}`);
    }, 2000);
  };

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <div>
          <h1 className="h2">Reportes y Analíticas Generales</h1>
          <p className="text-muted mb-0">Análisis integral del rendimiento de la organización</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <select 
            className="form-select form-select-sm"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{width: 'auto'}}
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
          
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

      {/* KPIs Principales */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="reports-kpi-card border-start border-success border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-success text-uppercase mb-1 fw-bold">Ingresos Totales</h6>
                  <h3 className="mb-2 text-success">${globalData.totalRevenue.toLocaleString()}</h3>
                  <p className="text-muted mb-2 small">Margen: {profitMargin}%</p>
                  <div className="progress" style={{height: '4px'}}>
                    <div className="progress-bar bg-success" style={{width: `${profitMargin}%`}}></div>
                  </div>
                </div>
                <i className="bi bi-graph-up-arrow fs-1 text-success opacity-25"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="reports-kpi-card border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-primary text-uppercase mb-1 fw-bold">Proyectos Activos</h6>
                  <h3 className="mb-2 text-primary">{globalData.activeProjects}</h3>
                  <p className="text-muted mb-2 small">{globalData.totalProjects} proyectos totales</p>
                  <div className="progress" style={{height: '4px'}}>
                    <div className="progress-bar bg-primary" style={{width: `${projectCompletionRate}%`}}></div>
                  </div>
                </div>
                <i className="bi bi-kanban fs-1 text-primary opacity-25"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="reports-kpi-card border-start border-info border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-info text-uppercase mb-1 fw-bold">Tasa de Finalización</h6>
                  <h3 className="mb-2 text-info">{taskCompletionRate}%</h3>
                  <p className="text-muted mb-2 small">{globalData.completedTasks} de {globalData.totalTasks} tareas</p>
                  <div className="progress" style={{height: '4px'}}>
                    <div className="progress-bar bg-info" style={{width: `${taskCompletionRate}%`}}></div>
                  </div>
                </div>
                <i className="bi bi-check-circle fs-1 text-info opacity-25"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="reports-kpi-card border-start border-warning border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-warning text-uppercase mb-1 fw-bold">Usuarios Activos</h6>
                  <h3 className="mb-2 text-warning">{globalData.activeUsers}</h3>
                  <p className="text-muted mb-2 small">Engagement: {userEngagement}%</p>
                  <div className="progress" style={{height: '4px'}}>
                    <div className="progress-bar bg-warning" style={{width: `${userEngagement}%`}}></div>
                  </div>
                </div>
                <i className="bi bi-people fs-1 text-warning opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Principales */}
      <div className="row mb-4">
        <div className="col-lg-8 mb-4">
          <div className="card reports-chart-card h-100">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-graph-up me-2"></i>
                Evolución Financiera
              </h6>
            </div>
            <div className="card-body">
              <Line data={revenueData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card reports-chart-card h-100">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-pie-chart me-2"></i>
                Estado de Proyectos
              </h6>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
              <div style={{width: '280px', height: '280px'}}>
                <Doughnut data={projectsData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card reports-chart-card">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-bar-chart me-2"></i>
                Métricas de Rendimiento Semanal
              </h6>
            </div>
            <div className="card-body">
              <Bar data={performanceData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Tablas de Datos */}
      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="card reports-table-card">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-trophy me-2"></i>
                Top Proyectos por Rentabilidad
              </h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Proyecto</th>
                      <th>Revenue</th>
                      <th>ROI</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>E-commerce Platform</strong>
                        <small className="d-block text-muted">Cliente: TechCorp</small>
                      </td>
                      <td>$125,000</td>
                      <td>
                        <span className="text-success fw-bold">+285%</span>
                      </td>
                      <td>
                        <span className="badge bg-success">Completado</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>CRM System</strong>
                        <small className="d-block text-muted">Cliente: MediCorp</small>
                      </td>
                      <td>$89,000</td>
                      <td>
                        <span className="text-success fw-bold">+220%</span>
                      </td>
                      <td>
                        <span className="badge bg-primary">En Progreso</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Mobile App</strong>
                        <small className="d-block text-muted">Cliente: InnovaTech</small>
                      </td>
                      <td>$67,000</td>
                      <td>
                        <span className="text-success fw-bold">+195%</span>
                      </td>
                      <td>
                        <span className="badge bg-success">Completado</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Analytics Dashboard</strong>
                        <small className="d-block text-muted">Cliente: DataFlow</small>
                      </td>
                      <td>$45,000</td>
                      <td>
                        <span className="text-success fw-bold">+165%</span>
                      </td>
                      <td>
                        <span className="badge bg-warning">En Revisión</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card reports-table-card">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-people me-2"></i>
                Rendimiento del Equipo
              </h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Miembro</th>
                      <th>Proyectos</th>
                      <th>Tareas</th>
                      <th>Eficiencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <img src="https://placehold.co/32x32/964ef9/white?text=A" className="rounded-circle me-2" alt="Ana" />
                          <div>
                            <strong>Ana García</strong>
                            <small className="d-block text-muted">Frontend Dev</small>
                          </div>
                        </div>
                      </td>
                      <td>3</td>
                      <td>47</td>
                      <td>
                        <span className="text-success fw-bold">94%</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <img src="https://placehold.co/32x32/28a745/white?text=L" className="rounded-circle me-2" alt="Laura" />
                          <div>
                            <strong>Laura Martín</strong>
                            <small className="d-block text-muted">UI/UX Designer</small>
                          </div>
                        </div>
                      </td>
                      <td>4</td>
                      <td>38</td>
                      <td>
                        <span className="text-success fw-bold">91%</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <img src="https://placehold.co/32x32/17a2b8/white?text=D" className="rounded-circle me-2" alt="David" />
                          <div>
                            <strong>David Chen</strong>
                            <small className="d-block text-muted">Backend Dev</small>
                          </div>
                        </div>
                      </td>
                      <td>2</td>
                      <td>52</td>
                      <td>
                        <span className="text-success fw-bold">89%</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <img src="https://placehold.co/32x32/ffc107/white?text=C" className="rounded-circle me-2" alt="Carlos" />
                          <div>
                            <strong>Carlos López</strong>
                            <small className="d-block text-muted">Project Manager</small>
                          </div>
                        </div>
                      </td>
                      <td>4</td>
                      <td>29</td>
                      <td>
                        <span className="text-warning fw-bold">87%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Adicionales */}
      <div className="row">
        <div className="col-12">
          <div className="card reports-summary-card">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-clipboard-data me-2"></i>
                Resumen Ejecutivo
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="summary-metric">
                    <div className="metric-label">Clientes Totales</div>
                    <div className="metric-value">{globalData.totalClients}</div>
                    <div className="metric-change positive">+12% mes anterior</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="summary-metric">
                    <div className="metric-label">Satisfacción Media</div>
                    <div className="metric-value">9.2/10</div>
                    <div className="metric-change positive">+0.3 vs mes anterior</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="summary-metric">
                    <div className="metric-label">Tiempo Promedio Entrega</div>
                    <div className="metric-value">12.5 días</div>
                    <div className="metric-change negative">+1.2 vs mes anterior</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="summary-metric">
                    <div className="metric-label">Tasa de Retención</div>
                    <div className="metric-value">89%</div>
                    <div className="metric-change positive">+5% mes anterior</div>
                  </div>
                </div>
              </div>
              
              <hr className="my-3" />
              
              <div className="text-center">
                <p className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Última actualización: {globalData.lastUpdate.toLocaleDateString('es-ES')} a las {globalData.lastUpdate.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                </p>
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

export default ReportsPage;