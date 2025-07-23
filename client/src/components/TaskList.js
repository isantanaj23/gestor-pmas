// client/src/components/TaskList.js
import React, { useState, useEffect } from 'react';
import API from '../services/api';
import TaskDetailModal from './modals/TaskDetailModal';

const TaskList = ({ projectId, refreshTrigger }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar tareas del proyecto
  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId, refreshTrigger]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.get(`/projects/${projectId}/tasks`);
      
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setError('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleTaskUpdate = (updatedTask) => {
    // Actualizar la tarea en la lista local
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      )
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-secondary';
      case 'in-progress': return 'bg-primary';
      case 'review': return 'bg-warning';
      case 'done': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return 'bi-exclamation-triangle-fill text-danger';
      case 'medium': return 'bi-dash-circle-fill text-warning';
      case 'low': return 'bi-check-circle-fill text-success';
      default: return 'bi-circle text-muted';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando tareas...</span>
        </div>
        <p className="mt-2">Cargando tareas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <button 
          className="btn btn-sm btn-outline-danger ms-2"
          onClick={loadTasks}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="task-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">
          <i className="bi bi-list-task me-2"></i>
          Tareas del Proyecto ({tasks.length})
        </h5>
        <button 
          className="btn btn-outline-primary btn-sm"
          onClick={loadTasks}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Actualizar
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-list-task text-muted" style={{ fontSize: '3rem' }}></i>
          <h6 className="text-muted mt-3">No hay tareas en este proyecto</h6>
          <p className="text-muted">Las tareas aparecerán aquí cuando sean creadas.</p>
        </div>
      ) : (
        <div className="row">
          {tasks.map(task => (
            <div key={task._id} className="col-md-6 col-lg-4 mb-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  {/* Header de la tarea */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="flex-grow-1">
                      <h6 className="card-title mb-1 text-truncate">
                        {task.title}
                      </h6>
                      <div className="d-flex align-items-center">
                        <span className={`badge ${getStatusColor(task.status)} me-2`}>
                          {task.status === 'todo' && 'Por Hacer'}
                          {task.status === 'in-progress' && 'En Progreso'}
                          {task.status === 'review' && 'En Revisión'}
                          {task.status === 'done' && 'Completada'}
                        </span>
                        <i className={`${getPriorityIcon(task.priority)}`}></i>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  {task.description && (
                    <p className="card-text text-muted small mb-3">
                      {task.description.length > 80 
                        ? `${task.description.substring(0, 80)}...` 
                        : task.description
                      }
                    </p>
                  )}

                  {/* Información adicional */}
                  <div className="mb-3">
                    {task.dueDate && (
                      <div className="small text-muted mb-1">
                        <i className="bi bi-calendar me-1"></i>
                        Vence: {formatDate(task.dueDate)}
                      </div>
                    )}
                    {task.assignedTo && (
                      <div className="small text-muted">
                        <i className="bi bi-person me-1"></i>
                        Asignada a: {task.assignedTo.name}
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-outline-primary btn-sm flex-grow-1"
                      onClick={() => handleViewDetails(task)}
                    >
                      <i className="bi bi-eye me-1"></i>
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles de tarea */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={showModal}
        onClose={handleCloseModal}
        onTaskUpdate={handleTaskUpdate}
        projectId={projectId}
      />
    </div>
  );
};

export default TaskList;