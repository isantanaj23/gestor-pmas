import API from './api';

/**
 * Servicios para Tareas
 */
const taskService = {
  // Obtener mis tareas asignadas
  getMyTasks: async () => {
    try {
      const response = await API.get('/tasks/my-tasks');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo mis tareas:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo mis tareas',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener una tarea específica
  getTask: async (taskId) => {
    try {
      const response = await API.get(`/tasks/${taskId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo tarea:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo tarea',
        error: error.response?.data?.error,
      };
    }
  },

  // Actualizar tarea
  updateTask: async (taskId, taskData) => {
    try {
      const response = await API.put(`/tasks/${taskId}`, taskData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando tarea',
        error: error.response?.data?.error,
      };
    }
  },

  // Eliminar tarea
  deleteTask: async (taskId) => {
    try {
      const response = await API.delete(`/tasks/${taskId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error eliminando tarea',
        error: error.response?.data?.error,
      };
    }
  },

  // Mover tarea (para Kanban drag & drop)
  moveTask: async (taskId, newStatus, newPosition = 0) => {
    try {
      const response = await API.patch(`/tasks/${taskId}/move`, {
        status: newStatus,
        position: newPosition,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error moviendo tarea:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error moviendo tarea',
        error: error.response?.data?.error,
      };
    }
  },

  // Agregar comentario a una tarea
  addComment: async (taskId, comment) => {
    try {
      const response = await API.post(`/tasks/${taskId}/comments`, { comment });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error agregando comentario:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error agregando comentario',
        error: error.response?.data?.error,
      };
    }
  },

  // Toggle item del checklist
  toggleChecklistItem: async (taskId, itemId, completed) => {
    try {
      const response = await API.patch(`/tasks/${taskId}/checklist/${itemId}`, { completed });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error actualizando checklist:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando checklist',
        error: error.response?.data?.error,
      };
    }
  },

  // Actualizar solo el estado de una tarea (para cambios rápidos)
  updateStatus: async (taskId, status) => {
    try {
      const response = await API.patch(`/tasks/${taskId}/move`, { status });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error actualizando estado:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando estado',
        error: error.response?.data?.error,
      };
    }
  },

  // Actualizar prioridad de una tarea
  updatePriority: async (taskId, priority) => {
    try {
      const response = await API.put(`/tasks/${taskId}`, { priority });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error actualizando prioridad:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando prioridad',
        error: error.response?.data?.error,
      };
    }
  },
};

export default taskService;