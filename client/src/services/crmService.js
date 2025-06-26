import API from './api';

/**
 * Servicios para CRM (Contactos y Actividades)
 */
const crmService = {
  // ============== CONTACTOS ==============
  
  // Obtener todos los contactos
  getContacts: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/contacts?${queryParams}` : '/contacts';
      
      const response = await API.get(url);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo contactos:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo contactos',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener un contacto específico
  getContact: async (contactId) => {
    try {
      const response = await API.get(`/contacts/${contactId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo contacto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo contacto',
        error: error.response?.data?.error,
      };
    }
  },

  // Crear nuevo contacto
  createContact: async (contactData) => {
    try {
      const response = await API.post('/contacts', contactData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error creando contacto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error creando contacto',
        error: error.response?.data?.error,
      };
    }
  },

  // Actualizar contacto
  updateContact: async (contactId, contactData) => {
    try {
      const response = await API.put(`/contacts/${contactId}`, contactData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error actualizando contacto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando contacto',
        error: error.response?.data?.error,
      };
    }
  },

  // Eliminar contacto
  deleteContact: async (contactId) => {
    try {
      const response = await API.delete(`/contacts/${contactId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error eliminando contacto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error eliminando contacto',
        error: error.response?.data?.error,
      };
    }
  },

  // Mover contacto en el pipeline
  moveContactStage: async (contactId, newStage) => {
    try {
      const response = await API.patch(`/contacts/${contactId}/stage`, { stage: newStage });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error moviendo contacto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error moviendo contacto',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener estadísticas del pipeline
  getPipelineStats: async () => {
    try {
      const response = await API.get('/contacts/pipeline-stats');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del pipeline:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo estadísticas del pipeline',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener contactos por etapa
  getContactsByStage: async (stage) => {
    try {
      const response = await API.get(`/contacts/by-stage/${stage}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo contactos por etapa:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo contactos por etapa',
        error: error.response?.data?.error,
      };
    }
  },

  // Agregar nota a contacto
  addContactNote: async (contactId, note) => {
    try {
      const response = await API.post(`/contacts/${contactId}/notes`, { note });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error agregando nota:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error agregando nota',
        error: error.response?.data?.error,
      };
    }
  },

  // ============== ACTIVIDADES ==============

  // Obtener todas las actividades
  getActivities: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/activities?${queryParams}` : '/activities';
      
      const response = await API.get(url);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo actividades:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo actividades',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener una actividad específica
  getActivity: async (activityId) => {
    try {
      const response = await API.get(`/activities/${activityId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo actividad:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo actividad',
        error: error.response?.data?.error,
      };
    }
  },

  // Crear nueva actividad
  createActivity: async (activityData) => {
    try {
      const response = await API.post('/activities', activityData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error creando actividad:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error creando actividad',
        error: error.response?.data?.error,
      };
    }
  },

  // Actualizar actividad
  updateActivity: async (activityId, activityData) => {
    try {
      const response = await API.put(`/activities/${activityId}`, activityData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error actualizando actividad:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error actualizando actividad',
        error: error.response?.data?.error,
      };
    }
  },

  // Completar actividad
  completeActivity: async (activityId, outcome, notes = '') => {
    try {
      const response = await API.patch(`/activities/${activityId}/complete`, { outcome, notes });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error completando actividad:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error completando actividad',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener actividades próximas
  getUpcomingActivities: async () => {
    try {
      const response = await API.get('/activities/upcoming');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo actividades próximas:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo actividades próximas',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener actividades vencidas
  getOverdueActivities: async () => {
    try {
      const response = await API.get('/activities/overdue');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo actividades vencidas:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo actividades vencidas',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener estadísticas de actividades
  getActivityStats: async () => {
    try {
      const response = await API.get('/activities/stats');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de actividades:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo estadísticas de actividades',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener actividades de un contacto específico
  getContactActivities: async (contactId) => {
    try {
      const response = await API.get(`/activities/contact/${contactId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo actividades del contacto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo actividades del contacto',
        error: error.response?.data?.error,
      };
    }
  },
};

export default crmService;