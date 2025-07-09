import API from './api';

/**
 * Servicios para Tareas
 */
const taskService = {
  // 🔥 OBTENER TAREAS POR PROYECTO
  getTasksByProject: async (projectId, status = null) => {
    try {
      let url = `/projects/${projectId}/tasks`;
      if (status) {
        url += `?status=${status}`;
      }
      
      const response = await API.get(url);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo tareas del proyecto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo tareas del proyecto',
        error: error.response?.data?.error,
      };
    }
  },

  // 🔥 CREAR NUEVA TAREA
  createTask: async (taskData) => {
    try {
      console.log('📤 Enviando tarea al servidor:', taskData);
      
      const response = await API.post('/tasks', taskData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error creando tarea:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error creando tarea',
        error: error.response?.data?.error,
      };
    }
  },

  // 🔥 CREAR TAREA EN PROYECTO ESPECÍFICO
  createProjectTask: async (projectId, taskData) => {
    try {
      console.log('📤 Creando tarea en proyecto:', projectId, taskData);
      
      const response = await API.post(`/projects/${projectId}/tasks`, taskData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error creando tarea en proyecto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error creando tarea en proyecto',
        error: error.response?.data?.error,
      };
    }
  },

  // 🔥 MOVER TAREA (para drag and drop)
  moveTask: async (taskId, newStatus, position = 0) => {
    try {
      console.log('📤 Moviendo tarea:', taskId, 'a estado:', newStatus);
      
      const response = await API.patch(`/tasks/${taskId}/move`, { 
        status: newStatus, 
        position: position 
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

  // 🔥 ACTUALIZAR ESTADO DE TAREA
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

  // Agregar comentario a tarea
  addComment: async (taskId, comment) => {
    try {
      const response = await API.post(`/tasks/${taskId}/comment`, { text: comment });
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

  // Asignar tarea a usuario
  assignTask: async (taskId, userId) => {
    try {
      const response = await API.patch(`/tasks/${taskId}/assign`, { assignedTo: userId });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error asignando tarea:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error asignando tarea',
        error: error.response?.data?.error,
      };
    }
  },

  // Actualizar progreso de tarea
  updateProgress: async (taskId, progress) => {
    try {
      const response = await API.patch(`/tasks/${taskId}/progress`, { progress });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error actualizando progreso:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando progreso',
        error: error.response?.data?.error,
      };
    }
  },

  // Actualizar checklist de tarea
  updateChecklist: async (taskId, itemId, completed) => {
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