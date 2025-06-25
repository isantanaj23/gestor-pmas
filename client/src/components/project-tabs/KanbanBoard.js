import React, { useState } from "react";
import TaskDetailModal from "../modals/TaskDetailModal";

function KanbanBoard({ projectId }) {
  // Estado inicial con las tareas organizadas por columna
  const [columns, setColumns] = useState({
    pendiente: {
      id: "pendiente",
      title: "Pendiente",
      color: "secondary",
      icon: "bi-circle",
      tasks: [
        {
          id: "1",
          title: "Diseñar el mockup de la landing page",
          description: "Crear mockups responsivos y modernos",
          priority: "Alta",
          assignees: ["Ana García", "Laura Martín"],
          dueDate: "Hoy",
          progress: 10,
        },
        {
          id: "2",
          title: "Crear wireframes del checkout",
          description: "Diseñar flujo de usuario para proceso de compra",
          priority: "Media",
          assignees: ["Miguel Torres"],
          dueDate: "2 días",
          progress: 0,
        },
        {
          id: "3",
          title: "Investigación de APIs de pago",
          description: "Analizar opciones de pasarelas de pago disponibles",
          priority: "Baja",
          assignees: ["Carlos López"],
          dueDate: "1 semana",
          progress: 25,
        },
      ],
    },
    progreso: {
      id: "progreso",
      title: "En Progreso",
      color: "primary",
      icon: "bi-arrow-clockwise",
      tasks: [
        {
          id: "4",
          title: "Desarrollo del sistema de autenticación",
          description: "Implementar login seguro con JWT y 2FA",
          priority: "Alta",
          assignees: ["Ana García", "David Chen"],
          dueDate: "3 días",
          progress: 60,
        },
        {
          id: "5",
          title: "Configuración de base de datos",
          description: "Setup de MongoDB y esquemas de usuario",
          priority: "Media",
          assignees: ["David Chen"],
          dueDate: "2 días",
          progress: 80,
        },
      ],
    },
    revision: {
      id: "revision",
      title: "Revisión",
      color: "warning",
      icon: "bi-eye",
      tasks: [
        {
          id: "6",
          title: "Revisar copies para campaña",
          description: "Validar textos de marketing para redes sociales",
          priority: "Media",
          assignees: ["Laura Martín", "Isabel Vega"],
          dueDate: "Mañana",
          progress: 90,
        },
      ],
    },
    completado: {
      id: "completado",
      title: "Completado",
      color: "success",
      icon: "bi-check-circle",
      tasks: [
        {
          id: "7",
          title: "Definir arquitectura del proyecto",
          description: "Documentación técnica y diagramas del sistema",
          priority: "Alta",
          assignees: ["Ana García"],
          dueDate: "Completada",
          progress: 100,
        },
        {
          id: "8",
          title: "Configurar el entorno de desarrollo",
          description: "Setup de Docker, Git hooks y CI/CD",
          priority: "Media",
          assignees: ["David Chen"],
          dueDate: "Completada",
          progress: 100,
        },
        {
          id: "9",
          title: "Análisis de requerimientos",
          description: "Documento completo de especificaciones funcionales",
          priority: "Alta",
          assignees: ["Laura Martín", "Carlos López"],
          dueDate: "Completada",
          progress: 100,
        },
      ],
    },
  });

  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Función para abrir modal de tarea
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  // Función para manejar el inicio del arrastre
  const handleDragStart = (e, task, columnId) => {
    setDraggedTask(task);
    setDraggedFrom(columnId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);

    // Agregar clase visual después de un tick
    setTimeout(() => {
      e.target.style.opacity = "0.5";
    }, 0);
  };

  // Función para manejar el final del arrastre
  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedTask(null);
    setDraggedFrom(null);

    // Remover clases de feedback visual
    document.querySelectorAll(".drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });
  };

  // Función para manejar el paso sobre una zona de drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Función para manejar cuando entra en una zona de drop
  const handleDragEnter = (e, columnId) => {
    e.preventDefault();
    if (draggedTask && draggedFrom !== columnId) {
      e.currentTarget.classList.add("drag-over");
    }
  };

  // Función para manejar cuando sale de una zona de drop
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  // Función principal para manejar el drop
  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    if (!draggedTask || !draggedFrom || draggedFrom === targetColumnId) {
      return;
    }

    // Crear nuevas columnas con la tarea movida
    setColumns((prevColumns) => {
      const newColumns = { ...prevColumns };

      // Remover tarea de la columna origen
      newColumns[draggedFrom] = {
        ...newColumns[draggedFrom],
        tasks: newColumns[draggedFrom].tasks.filter(
          (task) => task.id !== draggedTask.id
        ),
      };

      // Agregar tarea a la columna destino
      newColumns[targetColumnId] = {
        ...newColumns[targetColumnId],
        tasks: [...newColumns[targetColumnId].tasks, draggedTask],
      };

      return newColumns;
    });

    // Mostrar notificación de éxito
    console.log(
      `✅ Tarea "${draggedTask.title}" movida de "${columns[draggedFrom].title}" a "${columns[targetColumnId].title}"`
    );

    // Aquí podrías agregar una notificación toast
    showSuccessNotification(
      draggedTask.title,
      columns[draggedFrom].title,
      columns[targetColumnId].title
    );
  };

  // Función para mostrar notificación (simulada)
  const showSuccessNotification = (taskTitle, fromColumn, toColumn) => {
    // Crear elemento de notificación temporal
    const notification = document.createElement("div");
    notification.className = "alert alert-success position-fixed";
    notification.style.cssText =
      "top: 20px; right: 20px; z-index: 9999; opacity: 0; transition: opacity 0.3s;";
    notification.innerHTML = `
      <i class="bi bi-check-circle-fill me-2"></i>
      <strong>${taskTitle}</strong> movida a ${toColumn}
    `;

    document.body.appendChild(notification);

    // Mostrar con animación
    setTimeout(() => (notification.style.opacity = "1"), 100);

    // Ocultar después de 3 segundos
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Alta":
        return "danger";
      case "Media":
        return "warning";
      case "Baja":
        return "info";
      default:
        return "secondary";
    }
  };

  const getAvatarColor = (index) => {
    const colors = ["964ef9", "ffc107", "28a745", "dc3545", "17a2b8"];
    return colors[index % colors.length];
  };

  return (
    <div>
      {/* Estadísticas rápidas del proyecto */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center py-2">
              <h4 className="mb-0">
                {Object.values(columns).reduce(
                  (total, col) => total + col.tasks.length,
                  0
                )}
              </h4>
              <small>Total Tareas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center py-2">
              <h4 className="mb-0">
                {columns.pendiente.tasks.length + columns.progreso.tasks.length}
              </h4>
              <small>En Curso</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center py-2">
              <h4 className="mb-0">{columns.completado.tasks.length}</h4>
              <small>Completadas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center py-2">
              <h4 className="mb-0">
                {Math.round(
                  Object.values(columns).reduce(
                    (total, col) =>
                      total +
                      col.tasks.reduce((sum, task) => sum + task.progress, 0),
                    0
                  ) /
                    Object.values(columns).reduce(
                      (total, col) => total + col.tasks.length,
                      0
                    )
                )}
                %
              </h4>
              <small>Progreso Promedio</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div
        className="d-flex gap-3 overflow-auto pb-3"
        style={{ minHeight: "600px" }}
      >
        {Object.values(columns).map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0"
            style={{ minWidth: "320px" }}
          >
            <div className="card h-100">
              <div
                className={`card-header d-flex justify-content-between align-items-center text-${column.color}`}
              >
                <span className="fw-bold">
                  <i className={`bi ${column.icon} me-2`}></i>
                  {column.title}
                </span>
                <span className={`badge bg-${column.color}`}>
                  {column.tasks.length}
                </span>
              </div>
              <div
                className="card-body"
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                style={{ minHeight: "400px" }}
              >
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="card mb-3 shadow-sm task-card"
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, task, column.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleTaskClick(task)}
                    style={{
                      cursor: "grab",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 1px 3px rgba(0,0,0,0.1)";
                    }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span
                          className={`badge bg-${getPriorityColor(
                            task.priority
                          )} badge-sm`}
                        >
                          {task.priority}
                        </span>
                        <small className="text-muted">
                          <i className="bi bi-calendar-event me-1"></i>
                          {task.dueDate}
                        </small>
                      </div>

                      <h6
                        className="card-title mb-2"
                        style={{ fontSize: "0.95rem" }}
                      >
                        {task.title}
                      </h6>
                      <p className="card-text text-muted small mb-3">
                        {task.description}
                      </p>

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex">
                          {task.assignees.map((assignee, index) => (
                            <img
                              key={index}
                              src={`https://placehold.co/24x24/${getAvatarColor(
                                index
                              )}/white?text=${assignee.charAt(0)}`}
                              className="rounded-circle me-1"
                              alt={assignee}
                              title={assignee}
                              style={{
                                border: "2px solid white",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              }}
                            />
                          ))}
                        </div>
                        <small className="text-muted fw-bold">
                          {task.progress}%
                        </small>
                      </div>

                      <div className="progress" style={{ height: "4px" }}>
                        <div
                          className={`progress-bar bg-${column.color}`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>

                      {task.progress === 100 && (
                        <div className="mt-2 text-center">
                          <small className="text-success fw-bold">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            Completada
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  className={`btn btn-outline-${column.color} w-100 btn-sm`}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Agregar tarea
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <TaskDetailModal
        show={showTaskModal}
        onHide={() => setShowTaskModal(false)}
        task={selectedTask}
      />
    </div>
  );
}

export default KanbanBoard;
