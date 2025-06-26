import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';

const KanbanBoard = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState('pending');
  const [draggedTask, setDraggedTask] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: user?.id || '',
    dueDate: ''
  });

  // Columnas del Kanban
  const columns = [
    { 
      id: 'pending', 
      title: 'Pendiente', 
      icon: 'bi-circle', 
      color: 'secondary',
      bgColor: 'light' 
    },
    { 
      id: 'in-progress', 
      title: 'En Progreso', 
      icon: 'bi-arrow-clockwise', 
      color: 'primary',
      bgColor: 'primary-subtle' 
    },
    { 
      id: 'review', 
      title: 'Revisión', 
      icon: 'bi-eye', 
      color: 'warning',
      bgColor: 'warning-subtle' 
    },
    { 
      id: 'completed', 
      title: 'Completado', 
      icon: 'bi-check-circle', 
      color: 'success',
      bgColor: 'success-subtle' 
    }
  ];

  // Cargar tareas del proyecto
  useEffect(() => {
    if (projectId) {
      loadProjectTasks();
    }
  }, [projectId]);

  const loadProjectTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectService.getProjectTasks(projectId);
      
      if (response.success) {
        setTasks(response.data);
      } else {
        setError(response.message || 'Error cargando tareas');
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setError('Error de conexión al cargar tareas');
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nueva tarea
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (isCreating) return;
    setIsCreating(true);

    try {
      const taskData = {
        ...newTask,
        status: selectedColumn,
        project: projectId
      };

      const response = await projectService.createProjectTask(projectId, taskData);
      
      if (response.success) {
        // Agregar la nueva tarea a la lista
        setTasks(prev => [...prev, response.data]);
        
        // Limpiar formulario y cerrar modal
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          assignedTo: user?.id || '',
          dueDate: ''
        });
        setShowCreateModal(false);
        
        console.log('✅ Tarea creada exitosamente');
      } else {
        console.error('❌ Error creando tarea:', response.message);
        setError(response.message || 'Error creando tarea');
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setError('Error de conexión al crear tarea');
    } finally {
      setIsCreating(false);
    }
  };

  // Mover tarea (drag & drop)
  const handleTaskMove = async (taskId, newStatus) => {
    try {
      const response = await taskService.moveTask(taskId, newStatus);
      
      if (response.success) {
        // Actualizar la tarea en el estado local
        setTasks(prev => prev.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        ));
        
        console.log('✅ Tarea movida exitosamente');
      } else {
        console.error('❌ Error moviendo tarea:', response.message);
        setError(response.message || 'Error moviendo tarea');
      }
    } catch (error) {
      console.error('❌ Error moviendo tarea:', error);
      setError('Error de conexión al mover tarea');
    }
  };

  // Funciones de drag & drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Hacer la tarea semi-transparente
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== columnId) {
      handleTaskMove(draggedTask._id, columnId);
    }
  };

  // Funciones de utilidad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencida';
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays <= 7) return `${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDueDateColor = (dueDate) => {
    if (!dueDate) return 'secondary';
    
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'danger';
    if (diffDays <= 1) return 'warning';
    return 'info';
  };

  // Filtrar tareas por columna
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <h5 className="text-muted">Cargando Tablero Kanban...</h5>
          <p className="text-muted">Obteniendo las tareas del proyecto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-container">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Tablero Kanban */}
      <div className="kanban-board d-flex gap-3 overflow-auto pb-3" style={{ minHeight: '600px' }}>
        {columns.map(column => (
          <div key={column.id} className="kanban-column flex-shrink-0" style={{ minWidth: '300px', width: '300px' }}>
            <div className="card h-100">
              {/* Header de la columna */}
              <div className={`card-header bg-${column.bgColor} d-flex justify-content-between align-items-center`}>
                <div className="d-flex align-items-center">
                  <i className={`bi ${column.icon} text-${column.color} me-2`}></i>
                  <h6 className={`mb-0 fw-bold text-${column.color}`}>
                    {column.title}
                  </h6>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge bg-${column.color}`}>
                    {getTasksByStatus(column.id).length}
                  </span>
                  <button
                    className={`btn btn-sm btn-outline-${column.color}`}
                    onClick={() => {
                      setSelectedColumn(column.id);
                      setShowCreateModal(true);
                    }}
                    title="Agregar tarea"
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
              </div>

              {/* Cuerpo de la columna */}
              <div 
                className="card-body p-2"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                style={{ minHeight: '500px' }}
              >
                {/* Tareas */}
                {getTasksByStatus(column.id).map(task => (
                  <div
                    key={task._id}
                    className="card task-card mb-2 border-start border-3 shadow-sm"
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    style={{ 
                      cursor: 'grab',
                      borderLeftColor: `var(--bs-${getPriorityColor(task.priority)})`
                    }}
                  >
                    <div className="card-body p-3">
                      {/* Header de la tarea */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className={`badge bg-${getPriorityColor(task.priority)} badge-sm`}>
                          {task.priority}
                        </span>
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            <i className="bi bi-three-dots"></i>
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <a className="dropdown-item" href="#">
                                <i className="bi bi-pencil me-2"></i>Editar
                              </a>
                            </li>
                            <li>
                              <a className="dropdown-item" href="#">
                                <i className="bi bi-eye me-2"></i>Ver detalles
                              </a>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <a className="dropdown-item text-danger" href="#">
                                <i className="bi bi-trash me-2"></i>Eliminar
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Título y descripción */}
                      <h6 className="card-title mb-2 text-dark">
                        {task.title}
                      </h6>
                      {task.description && (
                        <p className="card-text text-muted small mb-3 text-truncate" title={task.description}>
                          {task.description}
                        </p>
                      )}

                      {/* Asignado y fecha */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center">
                          {task.assignedTo && (
                            <img
                              src={task.assignedTo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo.name)}&size=24`}
                              className="rounded-circle me-2"
                              style={{ width: '24px', height: '24px' }}
                              alt={task.assignedTo.name}
                              title={task.assignedTo.name}
                            />
                          )}
                        </div>
                        {task.dueDate && (
                          <small className={`text-${getDueDateColor(task.dueDate)} fw-medium`}>
                            <i className="bi bi-calendar-event me-1"></i>
                            {formatDate(task.dueDate)}
                          </small>
                        )}
                      </div>

                      {/* Checklist progress */}
                      {task.checklist && task.checklist.length > 0 && (
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="progress flex-grow-1 me-2" style={{ height: '4px' }}>
                            <div
                              className={`progress-bar bg-${column.color}`}
                              role="progressbar"
                              style={{ 
                                width: `${(task.checklist.filter(item => item.completed).length / task.checklist.length) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <small className="text-muted">
                            {task.checklist.filter(item => item.completed).length}/{task.checklist.length}
                          </small>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="mt-2">
                          {task.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="badge bg-light text-dark border me-1" style={{ fontSize: '0.7rem' }}>
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 2 && (
                            <span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                              +{task.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Estado vacío de la columna */}
                {getTasksByStatus(column.id).length === 0 && (
                  <div className="text-center py-4">
                    <i className={`bi ${column.icon} text-${column.color} opacity-50`} style={{ fontSize: '2rem' }}></i>
                    <p className="text-muted small mt-2">Sin tareas en {column.title.toLowerCase()}</p>
                    <button
                      className={`btn btn-sm btn-outline-${column.color}`}
                      onClick={() => {
                        setSelectedColumn(column.id);
                        setShowCreateModal(true);
                      }}
                    >
                      <i className="bi bi-plus-lg me-1"></i>
                      Agregar Tarea
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Crear Tarea */}
      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-square me-2"></i>
                  Nueva Tarea - {columns.find(c => c.id === selectedColumn)?.title}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                ></button>
              </div>
              
              <form onSubmit={handleCreateTask}>
                <div className="modal-body">
                  {/* Título */}
                  <div className="mb-3">
                    <label htmlFor="taskTitle" className="form-label">
                      <i className="bi bi-card-text me-2"></i>
                      Título de la Tarea *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="taskTitle"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Implementar sistema de login"
                      required
                      disabled={isCreating}
                    />
                  </div>

                  {/* Descripción */}
                  <div className="mb-3">
                    <label htmlFor="taskDescription" className="form-label">
                      <i className="bi bi-text-paragraph me-2"></i>
                      Descripción
                    </label>
                    <textarea
                      className="form-control"
                      id="taskDescription"
                      rows="3"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe los detalles de la tarea..."
                      disabled={isCreating}
                    />
                  </div>

                  {/* Prioridad y Fecha */}
                  <div className="row">
                    <div className="col-md-6">
                      <label htmlFor="taskPriority" className="form-label">
                        <i className="bi bi-flag me-2"></i>
                        Prioridad
                      </label>
                      <select
                        className="form-select"
                        id="taskPriority"
                        value={newTask.priority}
                        onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                        disabled={isCreating}
                      >
                        <option value="low">🟢 Baja</option>
                        <option value="medium">🟡 Media</option>
                        <option value="high">🔴 Alta</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="taskDueDate" className="form-label">
                        <i className="bi bi-calendar-event me-2"></i>
                        Fecha Límite
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="taskDueDate"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                        disabled={isCreating}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isCreating || !newTask.title.trim()}
                  >
                    {isCreating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </span>
                        Creando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Crear Tarea
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;