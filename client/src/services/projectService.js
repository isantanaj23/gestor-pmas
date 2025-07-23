import API from './api';

/**
 * Servicios para Proyectos
 */
const projectService = {
  // Obtener todos los proyectos del usuario
  getProjects: async () => {
    try {
      const response = await API.get('/projects');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo proyectos:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo proyectos',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener un proyecto específico
  getProject: async (projectId) => {
    try {
      const response = await API.get(`/projects/${projectId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo proyecto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo proyecto',
        error: error.response?.data?.error,
      };
    }
  },

  // Crear nuevo proyecto
  createProject: async (projectData) => {
    try {
      const response = await API.post('/projects', projectData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error creando proyecto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error creando proyecto',
        error: error.response?.data?.error,
      };
    }
  },

  // Actualizar proyecto
  updateProject: async (projectId, projectData) => {
    try {
      const response = await API.put(`/projects/${projectId}`, projectData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando proyecto',
        error: error.response?.data?.error,
      };
    }
  },

  // Eliminar proyecto
  deleteProject: async (projectId) => {
    try {
      const response = await API.delete(`/projects/${projectId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error eliminando proyecto',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener tareas del proyecto
  getProjectTasks: async (projectId) => {
    try {
      const response = await API.get(`/projects/${projectId}/tasks`);
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

  // Crear tarea en el proyecto
  createProjectTask: async (projectId, taskData) => {
    try {
      const response = await API.post(`/projects/${projectId}/tasks`, taskData);
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

  // 🔥 AGREGAR MIEMBRO AL EQUIPO (con role)
  addTeamMember: async (projectId, memberData) => {
    try {
      const response = await API.post(`/projects/${projectId}/team`, memberData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error agregando miembro al equipo:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error agregando miembro al equipo',
        error: error.response?.data?.error,
      };
    }
  },

  // 🔥 REMOVER MIEMBRO - DESHABILITADO TEMPORALMENTE
  // removeTeamMember: async (projectId, userId) => {
  //   // Implementar cuando tengamos la ruta en el backend
  //   return {
  //     success: false,
  //     message: 'Funcionalidad no disponible aún'
  //   };
  // },

  // Actualizar progreso del proyecto
  updateProgress: async (projectId, progress) => {
    try {
      const response = await API.patch(`/projects/${projectId}/progress`, { progress });
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
};

// Actualizar proyecto
const updateProject = async (projectId, projectData) => {
  try {
    console.log('📝 === PROJECTSERVICE UPDATE ===');
    console.log('📝 Project ID:', projectId);
    console.log('📝 Data a enviar:', projectData);
    
    const response = await API.put(`/projects/${projectId}`, projectData);
    
    console.log('📥 Respuesta cruda:', response);
    console.log('📥 Response data:', response.data);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('❌ Error en projectService.updateProject:', error);
    console.error('❌ Error response:', error.response);
    console.error('❌ Error data:', error.response?.data);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al actualizar el proyecto'
    };
  }
};

export default projectService;

