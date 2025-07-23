// client/src/components/modals/TaskDetailModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap'; // 🔥 AGREGAR Button y Form
import API from '../../services/api';
// import './TaskDetailModal.css';
import taskService from '../../services/taskService';




const TaskDetailModal = ({ task, isOpen, onClose, onTaskUpdate, projectId, onDeleteTask }) => {
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
    const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: ''
  });


    console.log('🎭 TaskDetailModal props:', { 
    task: task?._id, 
    isOpen, 
    onClose: typeof onClose, 
    onTaskUpdate: typeof onTaskUpdate, 
    projectId, 
    onDeleteTask: typeof onDeleteTask
  });

  // Cargar detalles de la tarea cuando se abre el modal
  useEffect(() => {
    if (isOpen && task) {
      loadTaskDetails();
    }
  }, [isOpen, task]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await API.get(`/tasks/${task._id}`);
      
      if (response.data.success) {
        setTaskDetails(response.data.data);
        const taskData = response.data.data;
        setTaskDetails(taskData);
        setComments(taskData.comments || []);

        setEditForm({
          title: response.data.data.title,
          description: response.data.data.description || '',
          status: response.data.data.status,
          priority: response.data.data.priority,
          dueDate: response.data.data.dueDate ? 
            new Date(response.data.data.dueDate).toISOString().split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Error cargando detalles de tarea:', error);
      setError('Error al cargar los detalles de la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.put(`/tasks/${task._id}`, editForm);
      
      if (response.data.success) {
        setTaskDetails(response.data.data);
        setIsEditing(false);
        onTaskUpdate && onTaskUpdate(response.data.data);
      }
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      setError('Error al actualizar la tarea');
    } finally {
      setLoading(false);
    }
  };


  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    setLoadingComment(true);

    try {
      const response = await taskService.addTaskComment(task._id, newComment.trim());
      
      if (response.success) {
        // Agregar comentario a la lista local
        setComments(prev => [...prev, response.data]);
        setNewComment('');
        console.log('✅ Comentario agregado exitosamente');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error agregando comentario:', error);
      alert('Error al agregar comentario: ' + error.message);
    } finally {
      setLoadingComment(false);
    }
  };


   const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.text);
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      return;
    }

    setLoadingComment(true);

    try {
      const response = await taskService.editTaskComment(
        task._id, 
        commentId, 
        editingCommentText.trim()
      );
      
      if (response.success) {
        // Actualizar comentario en la lista local
        setComments(prev => 
          prev.map(comment => 
            comment._id === commentId 
              ? { ...comment, text: editingCommentText.trim(), isEdited: true }
              : comment
          )
        );
        
        setEditingCommentId(null);
        setEditingCommentText('');
        console.log('✅ Comentario editado exitosamente');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error editando comentario:', error);
      alert('Error al editar comentario: ' + error.message);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
      return;
    }

    setLoadingComment(true);

    try {
      const response = await taskService.deleteTaskComment(task._id, commentId);
      
      if (response.success) {
        // Remover comentario de la lista local
        setComments(prev => prev.filter(comment => comment._id !== commentId));
        console.log('✅ Comentario eliminado exitosamente');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error eliminando comentario:', error);
      alert('Error al eliminar comentario: ' + error.message);
    } finally {
      setLoadingComment(false);
    }
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };


  const formatDate = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted';
    }
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

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          {/* Header del Modal */}
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-list-task me-2"></i>
              Detalles de la Tarea
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          {/* Contenido del Modal */}
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2">Cargando detalles...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            ) : taskDetails ? (
              <div>
                {/* Título */}
                <div className="mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      name="title"
                      value={editForm.title}
                      onChange={handleInputChange}
                      placeholder="Título de la tarea"
                    />
                  ) : (
                    <h4 className="mb-0">{taskDetails.title}</h4>
                  )}
                </div>

                {/* Información básica */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Estado:</label>
                      {isEditing ? (
                        <select
                          className="form-select"
                          name="status"
                          value={editForm.status}
                          onChange={handleInputChange}
                        >
                          <option value="todo">Por Hacer</option>
                          <option value="in-progress">En Progreso</option>
                          <option value="review">En Revisión</option>
                          <option value="done">Completada</option>
                        </select>
                      ) : (
                        <div>
                          <span className={`badge ${getStatusColor(taskDetails.status)} ms-2`}>
                            {taskDetails.status === 'todo' && 'Por Hacer'}
                            {taskDetails.status === 'in-progress' && 'En Progreso'}
                            {taskDetails.status === 'review' && 'En Revisión'}
                            {taskDetails.status === 'done' && 'Completada'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Prioridad:</label>
                      {isEditing ? (
                        <select
                          className="form-select"
                          name="priority"
                          value={editForm.priority}
                          onChange={handleInputChange}
                        >
                          <option value="low">Baja</option>
                          <option value="medium">Media</option>
                          <option value="high">Alta</option>
                        </select>
                      ) : (
                        <div>
                          <span className={`ms-2 fw-bold ${getPriorityColor(taskDetails.priority)}`}>
                            {taskDetails.priority === 'high' && 'Alta'}
                            {taskDetails.priority === 'medium' && 'Media'}
                            {taskDetails.priority === 'low' && 'Baja'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Fecha de vencimiento:</label>
                      {isEditing ? (
                        <input
                          type="date"
                          className="form-control"
                          name="dueDate"
                          value={editForm.dueDate}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="mb-0">{formatDate(taskDetails.dueDate)}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Fecha de creación:</label>
                      <p className="mb-0">{formatDate(taskDetails.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Descripción:</label>
                  {isEditing ? (
                    <textarea
                      className="form-control"
                      name="description"
                      rows="4"
                      value={editForm.description}
                      onChange={handleInputChange}
                      placeholder="Descripción de la tarea..."
                    ></textarea>
                  ) : (
                    <div className="border rounded p-3 bg-light">
                      {taskDetails.description || (
                        <em className="text-muted">Sin descripción</em>
                      )}
                    </div>
                  )}
                </div>

                {/* Asignación */}
                {taskDetails.assignedTo && (
                  <div className="mb-4">
                    <label className="form-label fw-bold">Asignada a:</label>
                    <div className="d-flex align-items-center">
                      <div className="avatar-circle me-2">
                        {taskDetails.assignedTo.avatar ? (
                          <img src={taskDetails.assignedTo.avatar} alt="Avatar" />
                        ) : (
                          <span>{taskDetails.assignedTo.name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <div>
                        <div className="fw-medium">{taskDetails.assignedTo.name}</div>
                        <small className="text-muted">{taskDetails.assignedTo.email}</small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Creada por */}
                {taskDetails.createdBy && (
                  <div className="mb-4">
                    <label className="form-label fw-bold">Creada por:</label>
                    <div className="d-flex align-items-center">
                      <div className="avatar-circle me-2">
                        {taskDetails.createdBy.avatar ? (
                          <img src={taskDetails.createdBy.avatar} alt="Avatar" />
                        ) : (
                          <span>{taskDetails.createdBy.name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <div>
                        <div className="fw-medium">{taskDetails.createdBy.name}</div>
                        <small className="text-muted">{taskDetails.createdBy.email}</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted">No se pudieron cargar los detalles de la tarea</p>
              </div>
            )}


            {/* Comentarios */}
            <h6 className="mb-3">
              <i className="bi bi-chat-left-text me-2"></i>
              Comentarios ({comments.length})
            </h6>
            
            {comments.length === 0 ? (
              <div className="text-center text-muted py-3 mb-3">
                <i className="bi bi-chat-square-dots fs-1"></i>
                <p className="mt-2 mb-0">No hay comentarios aún</p>
                <small>Sé el primero en comentar esta tarea</small>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="d-flex mb-3">
                  <div 
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: '32px', height: '32px', fontSize: '14px', flexShrink: 0 }}
                  >
                    {comment.user?.avatar ? (
                      <img 
                        src={comment.user.avatar} 
                        alt={comment.user.name}
                        className="rounded-circle"
                        style={{ width: '32px', height: '32px' }}
                      />
                    ) : (
                      comment.user?.name?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center">
                        <strong className="small me-2">{comment.user?.name || 'Usuario'}</strong>
                        <small className="text-muted">
                          {new Date(comment.createdAt).toLocaleString('es-ES')}
                          {comment.isEdited && (
                            <span className="ms-1 text-muted">(editado)</span>
                          )}
                        </small>
                      </div>
                      
                      {/* Botones de acción para comentarios propios */}
                      {comment.user?._id === taskDetails?.createdBy?._id && (
                        <div className="dropdown">
                          <button 
                            className="btn btn-sm btn-link text-muted p-0"
                            data-bs-toggle="dropdown"
                          >
                            <i className="bi bi-three-dots"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button 
                                className="dropdown-item"
                                onClick={() => handleEditComment(comment)}
                                disabled={loadingComment}
                              >
                                <i className="bi bi-pencil me-2"></i>Editar
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item text-danger"
                                onClick={() => handleDeleteComment(comment._id)}
                                disabled={loadingComment}
                              >
                                <i className="bi bi-trash me-2"></i>Eliminar
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Contenido del comentario */}
                    {editingCommentId === comment._id ? (
                      <div className="mt-2">
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="mb-2"
                        />
                        <div className="d-flex gap-2">
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => handleSaveEditComment(comment._id)}
                            disabled={loadingComment || !editingCommentText.trim()}
                          >
                            {loadingComment ? 'Guardando...' : 'Guardar'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={cancelEditComment}
                            disabled={loadingComment}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-light p-2 rounded">
                        {comment.text}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Formulario para agregar comentario */}
            <Form onSubmit={handleAddComment} className="mt-3">
              <div className="input-group">
                <Form.Control
                  type="text"
                  placeholder="Añadir un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={loadingComment}
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={loadingComment || !newComment.trim()}
                >
                  {loadingComment ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    <i className="bi bi-send"></i>
                  )}
                </Button>
              </div>
            </Form>
          </div>

          {/* Footer del Modal */}
          <div className="modal-footer">
            {taskDetails && (
              <>
                {isEditing ? (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleEditToggle}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleSaveChanges}
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={onClose}
                    >
                      Cerrar
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleEditToggle}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </button>
                    {/* 🔥 AGREGAR ESTE BOTÓN DE ELIMINAR */}
                    {/* <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => {
                        // Cerrar este modal y abrir el modal de confirmación
                        onClose();
                        // Triggear función de eliminar en el componente padre
                        if (window.triggerDeleteTask) {
                          window.triggerDeleteTask(taskDetails);
                        }
                      }}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Eliminar
                    </button> */}
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => {
                        console.log('🗑️ === BOTÓN ELIMINAR CLICKEADO ===');
                        console.log('🗑️ taskDetails:', taskDetails);
                        console.log('🗑️ onDeleteTask función existe?', typeof onDeleteTask);
                        console.log('🗑️ onClose función existe?', typeof onClose);
                        
                        // Cerrar este modal y triggear eliminación
                        console.log('🗑️ Cerrando modal de detalles...');
                        onClose();
                        
                        if (onDeleteTask) {
                          console.log('🗑️ Ejecutando onDeleteTask...');
                          onDeleteTask(taskDetails);
                        } else {
                          console.error('❌ onDeleteTask no está definido!');
                        }
                        
                        console.log('🗑️ === FIN BOTÓN ELIMINAR ===');
                      }}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Eliminar
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;