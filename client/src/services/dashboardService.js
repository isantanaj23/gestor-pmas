import API from './api';

/**
 * Servicios para el Dashboard
 */
const dashboardService = {
  // Obtener estadísticas generales
  getStats: async () => {
    try {
      const response = await API.get('/dashboard/stats');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo estadísticas',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener actividad reciente
  getRecentActivity: async (limit = 10) => {
    try {
      const response = await API.get(`/dashboard/recent-activity?limit=${limit}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo actividad reciente:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo actividad reciente',
        error: error.response?.data?.error,
      };
    }
  },

  // Obtener métricas semanales
  getWeeklyMetrics: async () => {
    try {
      const response = await API.get('/dashboard/weekly-metrics');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error obteniendo métricas semanales:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo métricas semanales',
        error: error.response?.data?.error,
      };
    }
  },
};

export default dashboardService;