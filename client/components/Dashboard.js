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
        {/* Tarjeta de Estadística 1 */}
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

        {/* Tarjeta de Estadística 2 */}
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

        {/* Tarjeta de Estadística 3 */}
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

        {/* Tarjeta de Estadística 4 */}
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
    </div>
  );
}

export default Dashboard;