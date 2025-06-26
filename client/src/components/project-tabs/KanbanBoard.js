import React, { useState, useEffect } from 'react';

const KanbanBoardSimple = ({ projectId, project }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🎯 Datos simulados de tareas por proyecto
  const getTasksForProject = (projId) => {
    const allTasks = {
      'proyecto-alpha': [
        {
          _id: '1',
          title: 'Configurar autenticación JWT',
          description: 'Implementar sistema de login y registro con JWT tokens',
          status: 'completed',
          priority: 'high',
          assignedTo: { name: 'Ana García' },
          dueDate: '2024-06-20'
        },
        {
          _id: '2',
          title: 'Diseñar interfaz de usuario',
          description: 'Crear mockups y prototipos para la aplicación',
          status: 'in-progress',
          priority: 'medium',
          assignedTo: { name: 'Laura Martín' },
          dueDate: '2024-06-28'
        },
        {
          _id: '3',
          title: 'Implementar API REST',
          description: 'Desarrollar endpoints para proyectos y tareas',
          status: 'pending',
          priority: 'high',
          assignedTo: { name: 'Carlos López' },
          dueDate: '2024-07-05'
        },
        {
          _id: '4',
          title: 'Testing de integración',
          description: 'Pruebas completas del sistema',
          status: 'review',
          priority: 'medium',
          assignedTo: { name: 'Ana García' },
          dueDate: '2024-07-10'
        }
      ],
      'ecommerce-beta': [
        {
          _id: '5',
          title: 'Configurar pasarela de pagos',
          description: 'Integrar Stripe para procesar pagos',
          status: 'in-progress',
          priority: 'high',
          assignedTo: { name: 'María Sánchez' },
          dueDate: '2024-06-30'
        },
        {
          _id: '6',
          title: 'Crear catálogo de productos',
          description: 'Desarrollar sistema de gestión de productos',
          status: 'completed',
          priority: 'medium',
          assignedTo: { name: 'Diego Ruiz' },
          dueDate: '2024-06-25'
        },
        {
          _id: '7',
          title: 'Implementar carrito de compras',
          description: 'Funcionalidad de añadir/quitar productos',
          status: 'pending',
          priority: 'medium',
          assignedTo: { name: 'María Sánchez' },
          dueDate: '2024-07-08'
        }
      ],
      'app-movil': [
        {
          _id: '8',
          title: 'Publicar en App Store',
          description: 'Subir la aplicación a las tiendas',
          status: 'in-progress',
          priority: 'high',
          assignedTo: { name: 'Sofia Herrera' },
          dueDate: '2024-06-29'
        },
        {
          _id: '9',
          title: 'Testing final',
          description: 'Pruebas en dispositivos reales',
          status: 'completed',
          priority: 'medium',
          assignedTo: { name: 'Juan Pablo' },
          dueDate: '2024-06-26'
        }
      ],
      'marketing-q3': [
        {
          _id: '10',
          title: 'Crear campaña en redes sociales',
          description: 'Desarrollar contenido para Instagram y Facebook',
          status: 'pending',
          priority: 'medium',
          assignedTo: { name: 'Carmen Torres' },
          dueDate: '2024-07-15'
        },
        {
          _id: '11',
          title: 'Análisis de competencia',
          description: 'Investigar estrategias de la competencia',
          status: 'review',
          priority: 'low',
          assignedTo: { name: 'Roberto Vega' },
          dueDate: '2024-07-01'
        }
      ]
    };

    return allTasks[projId] || [];
  };

  // 🔄 Columnas del Kanban
  const columns = [
    { id: 'pending', title: 'Pendiente', color: 'secondary', icon: 'bi-circle' },
    { id: 'in-progress', title: 'En Progreso', color: 'primary', icon: 'bi-arrow-clockwise' },
    { id: 'review', title: 'Revisión', color: 'warning', icon: 'bi-eye' },
    { id: 'completed', title: 'Completado', color: 'success', icon: 'bi-check-circle' }
  ];

  // 🔥 Cargar tareas cuando cambie el proyecto
  useEffect(() => {
    console.log('🔍 Cargando tareas para:', projectId);
    
    setIsLoading(true);
    
    // Simular carga mínima
    setTimeout(() => {
      const projectTasks = getTasksForProject(projectId);
      console.log('✅ Tareas encontradas:', projectTasks.length);
      setTasks(projectTasks);
      setIsLoading(false);
    }, 500);
    
  }, [projectId]);

  // 🎨 Funciones de utilidad
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task._id);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    
    const taskId = e.dataTransfer.getData('text/plain');
    const updatedTasks = tasks.map(task => 
      task._id === taskId ? { ...task, status: columnId } : task
    );
    
    setTasks(updatedTasks);
    console.log(`✅ Tarea ${taskId} movida a ${columnId}`);
  };

  // 🎯 Renders condicionales
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando tareas...</span>
          </div>
          <p className="text-muted">Cargando tablero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">📋 Tablero Kanban</h5>
          <small className="text-muted">
            {project?.name || projectId} • {tasks.length} tareas totales
          </small>
        </div>
        <button className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1"></i>
          Nueva Tarea
        </button>
      </div>

      {/* Tablero */}
      <div className="row g-3">
        {columns.map(column => (
          <div key={column.id} className="col-md-3">
            <div className="card h-100">
              {/* Header columna */}
              <div className={`card-header bg-${column.color} bg-opacity-10 border-0`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className={`bi ${column.icon} text-${column.color} me-2`}></i>
                    <h6 className="mb-0 fw-bold">{column.title}</h6>
                  </div>
                  <span className={`badge bg-${column.color}`}>
                    {getTasksByStatus(column.id).length}
                  </span>
                </div>
              </div>

              {/* Body columna */}
              <div 
                className="card-body p-2"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                style={{ minHeight: '400px' }}
              >
                {getTasksByStatus(column.id).length === 0 ? (
                  <div className="text-center py-4">
                    <i className={`bi ${column.icon} text-muted display-6`}></i>
                    <p className="text-muted mt-2">Sin tareas</p>
                  </div>
                ) : (
                  getTasksByStatus(column.id).map(task => (
                    <div
                      key={task._id}
                      className="card mb-2 shadow-sm border-start border-3"
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      style={{ 
                        cursor: 'grab',
                        borderLeftColor: `var(--bs-${getPriorityColor(task.priority)})`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="card-body p-3">
                        {/* Header tarea */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className={`badge bg-${getPriorityColor(task.priority)} badge-sm`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </div>

                        {/* Título */}
                        <h6 className="card-title mb-2" style={{ fontSize: '14px' }}>
                          {task.title}
                        </h6>

                        {/* Descripción */}
                        {task.description && (
                          <p className="card-text text-muted small mb-3" 
                             style={{ 
                               fontSize: '12px',
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical',
                               overflow: 'hidden'
                             }}>
                            {task.description}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="d-flex justify-content-between align-items-center">
                          {/* Asignado */}
                          {task.assignedTo && (
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                                style={{ width: '24px', height: '24px', fontSize: '10px' }}
                                title={task.assignedTo.name}
                              >
                                {task.assignedTo.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            </div>
                          )}

                          {/* Fecha */}
                          {task.dueDate && (
                            <small className="text-muted">
                              <i className="bi bi-calendar-event me-1"></i>
                              {new Date(task.dueDate).toLocaleDateString('es-ES', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Debug info */}
      <div className="mt-4 p-3 bg-light rounded">
        <small className="text-muted">
          <strong>🔍 Debug:</strong> Proyecto: {projectId} | Tareas cargadas: {tasks.length} | 
          Estado: {isLoading ? 'Cargando...' : 'Listo'}
        </small>
      </div>
    </div>
  );
};

export default KanbanBoardSimple;