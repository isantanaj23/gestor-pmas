import React from 'react';

function Dashboard() {
  return (
    <div className="container-fluid p-4">
      <div className="row align-items-center mb-4">
        <div className="col-md-8">
          <h1 className="h2">¡Buen día, Alex!</h1>
          <p className="text-muted">Aquí tienes un resumen de tu jornada.</p>
        </div>
        <div className="col-md-4 text-md-end">
          <button className="btn btn-primary">
            <i className="bi bi-plus-lg"></i> Crear Nuevo...
          </button>
        </div>
      </div>

      <div className="row">
        {/* Tarjeta 1: Tareas Activas */}
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-primary border-4 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                    Tareas Activas
                  </div>
                  <div className="h3 mb-0 fw-bold text-gray-800">12</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-list-task fs-1 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Tickets Abiertos */}
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-danger border-4 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs fw-bold text-danger text-uppercase mb-1">
                    Tickets Abiertos
                  </div>
                  <div className="h3 mb-0 fw-bold text-gray-800">5</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-ticket-detailed fs-1 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Publicaciones Programadas */}
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-info border-4 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs fw-bold text-info text-uppercase mb-1">
                    Publicaciones Programadas
                  </div>
                  <div className="h3 mb-0 fw-bold text-gray-800">8</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-calendar-event fs-1 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 4: Proyectos en Curso */}
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start border-success border-4 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs fw-bold text-success text-uppercase mb-1">
                    Proyectos en Curso
                  </div>
                  <div className="h3 mb-0 fw-bold text-gray-800">4</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-kanban fs-1 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Lista de Tareas Pendientes */}
        <div className="col-lg-7">
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 fw-bold text-primary">Mis Tareas Pendientes</h6>
              <a href="#">Ver Todas</a>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-check2-circle text-muted me-2"></i>
                    <strong>Diseñar el mockup de la landing page</strong>
                    <small className="d-block text-muted">Proyecto "Sitio Web Corporativo"</small>
                  </div>
                  <span className="badge text-bg-danger">Vence Hoy</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-check2-circle text-muted me-2"></i>
                    <strong>Revisar copies para campaña de Facebook</strong>
                    <small className="d-block text-muted">Proyecto "Marketing Q3"</small>
                  </div>
                  <span className="badge text-bg-warning">Vence Mañana</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-check2-circle text-muted me-2"></i>
                    <strong>Implementar API de pagos</strong>
                    <small className="d-block text-muted">Proyecto "E-commerce App"</small>
                  </div>
                  <span className="badge text-bg-secondary">25 Jun</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center bg-light-subtle text-decoration-line-through text-muted">
                  <div>
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    <strong>Enviar reporte de métricas semanales</strong>
                    <small className="d-block">Proyecto "Análisis de Datos"</small>
                  </div>
                  <span className="badge text-bg-success">Completada</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Próximas Publicaciones */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 fw-bold text-primary">Próximas Publicaciones en Redes Sociales</h6>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <img src="https://via.placeholder.com/80x80.png/A9B4C2/FFFFFF?text=Post" className="rounded me-3" alt="preview" />
                <div className="flex-grow-1">
                  <p className="mb-0 fw-bold">"Descubre las nuevas tendencias de diseño para 2025..."</p>
                  <small className="text-muted">
                    <i className="bi bi-instagram text-danger"></i> Instagram &bull; Mañana, 10:00 AM
                  </small>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <img src="https://via.placeholder.com/80x80.png/4A55A2/FFFFFF?text=Post" className="rounded me-3" alt="preview" />
                <div className="flex-grow-1">
                  <p className="mb-0 fw-bold">"5 tips para mejorar la colaboración en tu equipo..."</p>
                  <small className="text-muted">
                    <i className="bi bi-linkedin text-primary"></i> LinkedIn &bull; 21 Jun, 9:00 AM
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="col-lg-5">
          {/* Actividad Reciente */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 fw-bold text-primary">Actividad Reciente</h6>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <a href="#" className="list-group-item list-group-item-action d-flex align-items-start">
                  <i className="bi bi-chat-left-text-fill text-info me-3 fs-5"></i>
                  <div>
                    <strong>Laura</strong> comentó en la tarea "Diseñar mockup".
                    <small className="d-block text-muted">hace 5 minutos</small>
                  </div>
                </a>
                <a href="#" className="list-group-item list-group-item-action d-flex align-items-start">
                  <i className="bi bi-file-earmark-arrow-up-fill text-success me-3 fs-5"></i>
                  <div>
                    <strong>Carlos</strong> subió el archivo "Contrato Final.pdf".
                    <small className="d-block text-muted">hace 2 horas</small>
                  </div>
                </a>
                <a href="#" className="list-group-item list-group-item-action d-flex align-items-start">
                  <i className="bi bi-person-fill-check text-primary me-3 fs-5"></i>
                  <div>
                    <strong>Tú</strong> completaste la tarea "Enviar reporte".
                    <small className="d-block text-muted">hace 3 horas</small>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Progreso de Proyectos */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 fw-bold text-primary">Progreso de Proyectos</h6>
            </div>
            <div className="card-body text-center">
              <p className="text-muted small">Aquí se mostraría un gráfico de barras o circular generado con una librería como Chart.js.</p>
              <img src="https://via.placeholder.com/400x200.png/CCCCCC/FFFFFF?text=Placeholder+para+Gráfico" className="img-fluid" alt="Gráfico de ejemplo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;