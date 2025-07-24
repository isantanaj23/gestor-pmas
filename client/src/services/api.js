// client/src/services/api.js
import axios from 'axios';

// Configuración base del API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

console.log('🌐 API Base URL:', API_BASE_URL); // Para debug

// Crear instancia de axios
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para agregar token automáticamente
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('planifica_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 Request:', {
      method: config.method.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
API.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url
    });
    
    // Si el token expiró, redirigir al login
    if (error.response?.status === 401) {
      localStorage.removeItem('planifica_token');
      localStorage.removeItem('planifica_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Exportar la instancia principal por defecto
export default API;

// También exportar funciones específicas para mayor comodidad
export const authAPI = {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials),
  getMe: () => API.get('/auth/me'),
  logout: () => API.post('/auth/logout'),
};

export const projectAPI = {
  getAll: () => API.get('/projects'),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
};

export const taskAPI = {
  getMyTasks: () => API.get('/tasks/my-tasks'),
  getById: (id) => API.get(`/tasks/${id}`),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  move: (id, data) => API.patch(`/tasks/${id}/move`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
};

export const contactAPI = {
  getAll: (params) => API.get('/contacts', { params }),
  getById: (id) => API.get(`/contacts/${id}`),
  create: (data) => API.post('/contacts', data),
  update: (id, data) => API.put(`/contacts/${id}`, data),
  delete: (id) => API.delete(`/contacts/${id}`),
  moveStage: (id, stage) => API.patch(`/contacts/${id}/stage`, { stage }),
};

export const activityAPI = {
  getAll: (params) => API.get('/activities', { params }),
  create: (data) => API.post('/activities', data),
  update: (id, data) => API.put(`/activities/${id}`, data),
  complete: (id, data) => API.patch(`/activities/${id}/complete`, data),
};

// ⭐ NUEVO: API para publicaciones sociales
export const socialPostAPI = {
  // Crear nueva publicación
  create: (data) => API.post('/social-posts', data),
  
  // Obtener publicaciones de un proyecto
  getByProject: (projectId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/social-posts/project/${projectId}${queryString ? `?${queryString}` : ''}`;
    return API.get(url);
  },
  
  // Obtener una publicación específica
  getById: (id) => API.get(`/social-posts/${id}`),
  
  // Actualizar publicación
  update: (id, data) => API.put(`/social-posts/${id}`, data),
  
  // Eliminar publicación
  delete: (id) => API.delete(`/social-posts/${id}`),
  
  // Cambiar estado de publicación
  updateStatus: (id, status) => API.patch(`/social-posts/${id}/status`, { status }),
  
  // Obtener estadísticas de un proyecto
  getStats: (projectId) => API.get(`/social-posts/stats/${projectId}`),
  
  // Duplicar publicación
  duplicate: (id, newScheduledDate) => API.post(`/social-posts/${id}/duplicate`, { 
    scheduledDate: newScheduledDate 
  }),
};

// Función helper para manejar errores de API de forma consistente
export const handleApiError = (error, defaultMessage = 'Ha ocurrido un error') => {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'Tiempo de espera agotado. Verifica tu conexión a internet.';
  }
  
  if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
    return 'Sin conexión al servidor. Verifica tu conexión a internet.';
  }
  
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no fue encontrado.';
      case 422:
        return data?.message || 'Datos inválidos. Verifica la información ingresada.';
      case 429:
        return 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.';
      case 500:
        return 'Error interno del servidor. Intenta nuevamente más tarde.';
      case 503:
        return 'Servicio no disponible. Intenta nuevamente más tarde.';
      default:
        return data?.message || `Error ${status}: ${defaultMessage}`;
    }
  }
  
  return error.message || defaultMessage;
};