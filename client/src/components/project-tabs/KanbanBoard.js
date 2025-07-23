// 🔥 REEMPLAZA tus importaciones actuales con estas:
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import taskService, { deleteTask } from '../../services/taskService'; // 🔥 AGREGAR deleteTask
import projectService from '../../services/projectService';
import TaskDetailModal from '../modals/TaskDetailModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal'; // 🔥 NUEVA IMPORTACIÓN

import './KanbanBoard.css';



const KanbanBoard = ({ projectId, project, tasks, onTasksUpdate }) => {
  const { user } = useAuth();
  const { joinProject, leaveProject, updateTask, newComment, on, off } = useSocket();

  const [showDetailModal, setShowDetailModal] = useState(false);
const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);

const [showDeleteModal, setShowDeleteModal] = useState(false);
const [taskToDelete, setTaskToDelete] = useState(null);
const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados locales
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localTasks, setLocalTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    status: 'pending'
  });

  // 🔄 Columnas del Kanban
  const columns = [
    { id: 'pending', title: 'Pendiente', color: 'secondary', icon: 'bi-circle' },
    { id: 'in-progress', title: 'En Progreso', color: 'primary', icon: 'bi-arrow-clockwise' },
    { id: 'review', title: 'Revisión', color: 'warning', icon: 'bi-eye' },
    { id: 'completed', title: 'Completado', color: 'success', icon: 'bi-check-circle' }
  ];

  // 🔥 Cargar tareas reales del backend
  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Cargando tareas para proyecto:', projectId);
      
  const response = await taskService.getTasksByProject(projectId);
      
      if (response.success) {
        console.log('✅ Tareas cargadas:', response.data.length);
        setLocalTasks(response.data);
        if (onTasksUpdate) {
          onTasksUpdate(response.data);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('❌ Error cargando tareas:', err);
      setError(err.message || 'Error cargando tareas');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, onTasksUpdate]);

  // 🔌 Configurar Socket.io para notificaciones en tiempo real
  useEffect(() => {
    if (projectId) {
      // Unirse al proyecto para recibir notificaciones
      joinProject(projectId);
      
      // Listeners para notificaciones en tiempo real
      const handleTaskUpdated = (data) => {
        console.log('📝 Tarea actualizada en tiempo real:', data);
        
        setLocalTasks(prevTasks => 
          prevTasks.map(task => 
            task._id === data.taskId 
              ? { ...task, ...data.update }
              : task
          )
        );
        
        // Mostrar notificación
        if (data.updatedBy.id !== user.id) {
          console.log(`🔔 ${data.updatedBy.name} ${data.action} una tarea`);
        }
      };

      const handleTaskMoved = (data) => {
        console.log('🔄 Tarea movida en tiempo real:', data);
        
        setLocalTasks(prevTasks => 
          prevTasks.map(task => 
            task._id === data.taskId 
              ? { 
                  ...task, 
                  status: data.newStatus,
                  position: data.position 
                }
              : task
          )
        );
        
        if (data.movedBy.id !== user.id) {
          console.log(`🔔 ${data.movedBy.name} movió una tarea a ${data.newStatus}`);
        }
      };

      const handleTaskCreated = (data) => {
        console.log('➕ Nueva tarea en tiempo real:', data);
        
        setLocalTasks(prevTasks => [...prevTasks, data.task]);
        
        if (data.createdBy !== user.name) {
          console.log(`🔔 ${data.createdBy} creó una nueva tarea: ${data.task.title}`);
        }
      };

      const handleNewComment = (data) => {
        console.log('💬 Nuevo comentario en tiempo real:', data);
        
        setLocalTasks(prevTasks => 
          prevTasks.map(task => 
            task._id === data.taskId
              ? {
                  ...task,
                  comments: [...(task.comments || []), data.comment]
                }
              : task
          )
        );
      };

      // Registrar listeners
      on('task_updated', handleTaskUpdated);
      on('task_moved', handleTaskMoved);
      on('task_created', handleTaskCreated);
      on('new_comment', handleNewComment);
      on('task_updated', handleTaskUpdated);
      on('task_moved', handleTaskMoved);

      // Cleanup al desmontar
      return () => {
        leaveProject(projectId);
        off('task_updated', handleTaskUpdated);
        off('task_moved', handleTaskMoved);
        off('task_created', handleTaskCreated);
        off('new_comment', handleNewComment);
      };
    }
  }, [projectId, joinProject, leaveProject, on, off, user.id, user.name]);

  // 🔥 Cargar tareas al montar
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 🎨 Funciones de utilidad
  const getTasksByStatus = (status) => {
    const tasksToUse = localTasks.length > 0 ? localTasks : (tasks || []);
    return tasksToUse.filter(task => task.status === status);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  // 🖱️ Funciones de Drag & Drop
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task._id);
    e.target.style.opacity = '0.5';
    console.log('🖱️ Iniciando drag de tarea:', task.title);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const taskId = e.dataTransfer.getData('text/plain');
    const task = localTasks.find(t => t._id === taskId);
    
    if (!task || task.status === newStatus) {
      return; // No cambio necesario
    }

    console.log(`🔄 Moviendo tarea "${task.title}" a ${newStatus}`);

    try {
      // Actualización optimista
      setLocalTasks(prevTasks => 
        prevTasks.map(t => 
          t._id === taskId 
            ? { ...t, status: newStatus }
            : t
        )
      );

      // Emitir notificación en tiempo real a otros usuarios
      updateTask(projectId, taskId, { status: newStatus }, 'moved');

      // Persistir en backend
      const response = await taskService.moveTask(taskId, newStatus);
      
      if (!response.success) {
        throw new Error(response.message);
      }

      console.log('✅ Tarea movida exitosamente');
      
    } catch (error) {
      console.error('❌ Error moviendo tarea:', error);
      
      // Revertir cambio optimista
      setLocalTasks(prevTasks => 
        prevTasks.map(t => 
          t._id === taskId 
            ? { ...t, status: task.status }
            : t
        )
      );
      
      alert('Error al mover la tarea: ' + error.message);
    }
  };

  // 📝 Funciones para modales
  const handleCreateTask = async () => {
  try {
    console.log('➕ Creando nueva tarea:', newTaskData);
    
    // Validar que el título no esté vacío
    if (!newTaskData.title || !newTaskData.title.trim()) {
      alert('El título de la tarea es obligatorio');
      return;
    }
    
    // 🔥 AGREGAR EL PROJECT ID a los datos de la tarea
    const taskDataWithProject = {
      ...newTaskData,
      project: projectId  // ← ESTO ES CRUCIAL
    };
    
    console.log('📤 Enviando tarea con project ID:', taskDataWithProject);
    
    // 🔥 USAR taskService.createTask (ruta /api/tasks) en lugar de createProjectTask
    const response = await taskService.createTask(taskDataWithProject);
    
    if (response.success) {
      console.log('✅ Tarea creada exitosamente:', response.data);
      
      // Agregar a la lista local
      setLocalTasks(prev => [...prev, response.data]);
      
      // Actualizar tasks en el componente padre si existe la función
      if (onTasksUpdate) {
        const updatedTasks = [...localTasks, response.data];
        onTasksUpdate(updatedTasks);
      }
      
      // Resetear formulario
      setNewTaskData({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        status: 'pending'
      });
      
      // Cerrar modal
      setShowTaskModal(false);
      
      console.log('✅ Formulario resetado y modal cerrado');
      
    } else {
      throw new Error(response.message || 'Error al crear la tarea');
    }
  } catch (error) {
    console.error('❌ Error creando tarea:', error);
    alert('Error al crear la tarea: ' + (error.message || 'Error desconocido'));
  }
};

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setNewTaskData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status
    });
    setShowEditModal(true);
  };

  const handleUpdateTask = async () => {
    try {
      console.log('📝 Actualizando tarea:', selectedTask._id, newTaskData);
      
      const response = await taskService.updateTask(selectedTask._id, newTaskData);
      
      if (response.success) {
        console.log('✅ Tarea actualizada exitosamente');
        
        // Actualizar lista local
        setLocalTasks(prev => 
          prev.map(task => 
            task._id === selectedTask._id 
              ? { ...task, ...newTaskData }
              : task
          )
        );
        
        // Emitir notificación en tiempo real
        updateTask(projectId, selectedTask._id, newTaskData, 'updated');
        
        setShowEditModal(false);
        setSelectedTask(null);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error actualizando tarea:', error);
      alert('Error al actualizar la tarea: ' + error.message);
    }
  };

  // 🔥 AGREGAR ESTA FUNCIÓN (después de handleUpdateTask)
 const handleViewTaskDetail = (task) => {
    console.log('👁️ Viendo detalles de la tarea:', task);
    console.log('🔍 Estado antes - showDetailModal:', showDetailModal);
    console.log('🔍 Task seleccionada antes:', selectedTaskForDetail);
    
    setSelectedTaskForDetail(task);
    setShowDetailModal(true);
    
    console.log('✅ Estado después - showDetailModal debería ser true');
    console.log('✅ Task seleccionada después:', task._id);
  };

   // 🔥 AGREGA estas funciones después de handleUpdateTask:
      // Función para iniciar el proceso de eliminación
 const handleDeleteTask = (task) => {
    console.log('🗑️ ===== INICIANDO ELIMINACIÓN =====');
    console.log('🗑️ Tarea recibida:', task);
    console.log('🗑️ Task ID:', task?._id);
    console.log('🗑️ Task title:', task?.title);
    console.log('🗑️ Estado antes - showDeleteModal:', showDeleteModal);
    console.log('🗑️ taskToDelete antes:', taskToDelete);
    
    setTaskToDelete(task);
    setShowDeleteModal(true);
    
    console.log('🗑️ Estados actualizados - debería abrir modal de confirmación');
    console.log('🗑️ ===== FIN INICIANDO ELIMINACIÓN =====');
  };

  // Función para confirmar la eliminación
  const handleConfirmDelete = async () => {
    console.log('🗑️ ===== CONFIRMANDO ELIMINACIÓN =====');
    console.log('🗑️ taskToDelete:', taskToDelete);
    
    if (!taskToDelete) {
      console.log('❌ No hay tarea para eliminar');
      return;
    }

    console.log('🗑️ Iniciando proceso de eliminación...');
    setIsDeleting(true);
    
    try {
      console.log('🗑️ Llamando deleteTask con ID:', taskToDelete._id);
      
      const response = await deleteTask(taskToDelete._id);
      
      console.log('🗑️ Respuesta del servidor:', response);
      
      if (response.success) {
        console.log('✅ Eliminación exitosa en servidor');
        
        // Remover de la lista local
        console.log('🗑️ Removiendo de lista local...');
        setLocalTasks(prev => {
          const newTasks = prev.filter(task => task._id !== taskToDelete._id);
          console.log('🗑️ Tareas antes:', prev.length, 'después:', newTasks.length);
          return newTasks;
        });
        
        // Actualizar tasks en el componente padre si existe la función
        if (onTasksUpdate) {
          console.log('🗑️ Actualizando componente padre...');
          const updatedTasks = localTasks.filter(task => task._id !== taskToDelete._id);
          onTasksUpdate(updatedTasks);
        }
        
        // Limpiar estados
        console.log('🗑️ Limpiando estados...');
        setTaskToDelete(null);
        setShowDeleteModal(false);
        
        console.log('✅ Tarea eliminada completamente de la interfaz');
        
      } else {
        console.error('❌ Error del servidor:', response.message);
        throw new Error(response.message || 'Error al eliminar la tarea');
      }
    } catch (error) {
      console.error('❌ Error eliminando tarea:', error);
      alert('Error al eliminar la tarea: ' + error.message);
    } finally {
      console.log('🗑️ Finalizando proceso...');
      setIsDeleting(false);
      console.log('🗑️ ===== FIN CONFIRMANDO ELIMINACIÓN =====');
    }
  };
    console.log('🎭 RENDER KanbanBoard - showDetailModal:', showDetailModal, 'selectedTask:', selectedTaskForDetail?._id);

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

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h6 className="alert-heading">Error cargando tareas</h6>
        <p className="mb-0">{error}</p>
        <hr />
        <button className="btn btn-sm btn-outline-danger" onClick={loadTasks}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Reintentar
        </button>
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
            {project?.name || 'Proyecto'} • {localTasks.length} tareas totales
          </small>
        </div>




        <button 
          className="btn btn-primary btn-sm"
          onClick={() => setShowTaskModal(true)}
        >
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
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                style={{ minHeight: '400px' }}
              >
                {getTasksByStatus(column.id).length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className={`bi ${column.icon} fs-1 d-block mb-2`}></i>
                    <small>No hay tareas en {column.title.toLowerCase()}</small>
                  </div>
                ) : (
                  getTasksByStatus(column.id).map(task => (
  <div
    key={task._id}
    className="task-card card mb-2 shadow-sm border-0"
    draggable
    onDragStart={(e) => handleDragStart(e, task)}
    onDragEnd={handleDragEnd}
    onClick={() => handleViewTaskDetail(task)} // 🔥 AGREGAR evento click
    style={{ cursor: 'pointer' }} // 🔥 CAMBIAR cursor
  >
    <div className="card-body p-3">
      {/* Header de la tarjeta */}
      <div className="d-flex justify-content-between align-items-start mb-2">
        <h6 className="card-title mb-0 text-truncate" style={{ maxWidth: '80%' }}>
          {task.title}
        </h6>
        <div className="dropdown">
          <button 
            className="btn btn-sm btn-outline-secondary btn-circle"
            data-bs-toggle="dropdown"
            onClick={(e) => e.stopPropagation()} // 🔥 EVITAR que abra el modal
          >
            <i className="bi bi-three-dots-vertical"></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button 
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation(); // 🔥 EVITAR que abra el modal
                  handleEditTask(task);
                }}
              >
                <i className="bi bi-pencil me-2"></i>Editar
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation(); // 🔥 EVITAR que abra el modal
                  handleViewTaskDetail(task);
                }}
              >
                <i className="bi bi-eye me-2"></i>Ver Detalles
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button 
                className="dropdown-item text-danger"
                onClick={(e) => {
                  e.stopPropagation(); // 🔥 EVITAR que abra el modal
                  handleDeleteTask(task); // 🔥 AGREGAR funcionalidad
                }}
              >
                <i className="bi bi-trash me-2"></i>Eliminar
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Descripción */}
      {task.description && (
        <p className="card-text small text-muted mb-2">
          {task.description.length > 80 
            ? task.description.substring(0, 80) + '...'
            : task.description
          }
        </p>
      )}

      {/* Prioridad */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className={`badge bg-${getPriorityColor(task.priority)} bg-opacity-20 text-${getPriorityColor(task.priority)}`}>
          {task.priority === 'urgent' ? 'Urgente' :
           task.priority === 'high' ? 'Alta' :
           task.priority === 'medium' ? 'Media' : 'Baja'}
        </span>
        {task.dueDate && (
          <small className="text-muted">
            <i className="bi bi-calendar me-1"></i>
            {new Date(task.dueDate).toLocaleDateString('es-ES')}
          </small>
        )}
      </div>

      {/* Asignado */}
      {task.assignedTo && (
        <div className="d-flex align-items-center">
          <img
            src={task.assignedTo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo.name)}&background=6f42c1&color=fff&size=24`}
            alt={task.assignedTo.name}
            className="rounded-circle me-2"
            style={{ width: '24px', height: '24px' }}
          />
          <small className="text-muted">{task.assignedTo.name}</small>
        </div>
      )}
    </div>
  </div>
))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Tarea */}
      {showTaskModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Nueva Tarea
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowTaskModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Título *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTaskData.title}
                      onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                      placeholder="Título de la tarea"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newTaskData.description}
                      onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                      placeholder="Descripción de la tarea"
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prioridad</label>
                      <select 
                        className="form-select"
                        value={newTaskData.priority}
                        onChange={(e) => setNewTaskData({...newTaskData, priority: e.target.value})}
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado</label>
                      <select 
                        className="form-select"
                        value={newTaskData.status}
                        onChange={(e) => setNewTaskData({...newTaskData, status: e.target.value})}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in-progress">En Progreso</option>
                        <option value="review">Revisión</option>
                        <option value="completed">Completado</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fecha de vencimiento</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newTaskData.dueDate}
                      onChange={(e) => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleCreateTask}
                  disabled={!newTaskData.title.trim()}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Crear Tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Tarea */}
      {showEditModal && selectedTask && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  Editar Tarea
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Título *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTaskData.title}
                      onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newTaskData.description}
                      onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prioridad</label>
                      <select 
                        className="form-control"
                        value={newTaskData.priority}
                        onChange={(e) => setNewTaskData({...newTaskData, priority: e.target.value})}
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado</label>
                      <select 
                        className="form-control"
                        value={newTaskData.status}
                        onChange={(e) => setNewTaskData({...newTaskData, status: e.target.value})}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in-progress">En Progreso</option>
                        <option value="review">Revisión</option>
                        <option value="completed">Completado</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fecha de vencimiento</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newTaskData.dueDate}
                      onChange={(e) => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleUpdateTask}
                  disabled={!newTaskData.title.trim()}
                >
                  <i className="bi bi-check-lg me-1"></i>
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Modal Detalles de Tarea */}
    <TaskDetailModal
        task={selectedTaskForDetail}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onTaskUpdate={(updatedTask) => {
          // Actualizar la tarea en la lista local
          setLocalTasks(prev => 
            prev.map(task => 
              task._id === updatedTask._id ? updatedTask : task
            )
          );
          
          // Actualizar tasks en el componente padre si existe la función
          if (onTasksUpdate) {
            const updatedTasks = localTasks.map(task => 
              task._id === updatedTask._id ? updatedTask : task
            );
            onTasksUpdate(updatedTasks);
          }
        }}
        projectId={projectId}
         onDeleteTask={(task) => {
          // Función para eliminar desde el modal de detalles
          handleDeleteTask(task);
        }}
      />

      {/* 🔥 AGREGAR LOGS antes del Modal Confirmar Eliminación */}
      {console.log('🎭 RENDER - showDeleteModal:', showDeleteModal, 'taskToDelete:', taskToDelete?._id)}


     {/* Modal Confirmar Eliminación */}
      {showDeleteModal && console.log('🎭 SÍ va a renderizar DeleteConfirmModal')}
      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          console.log('🗑️ Cerrando modal de confirmación');
          setShowDeleteModal(false);
        }}
        onConfirm={() => {
          console.log('🗑️ Confirmando eliminación desde modal');
          handleConfirmDelete();
        }}
        loading={isDeleting}
        title="Eliminar Tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea?"
        itemName={taskToDelete?.title}
        confirmText="Eliminar Tarea"
      />

    </div>
  );
};

export default KanbanBoard;