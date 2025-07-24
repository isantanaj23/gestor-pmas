// client/src/services/api.js - VERSIÓN DEBUG
import axios from 'axios';

// Configuración base del API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : null
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas - VERSIÓN DEBUG
API.interceptors.response.use(
  (response) => {
    console.log('📥 Response SUCCESS:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Response ERROR:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      fullError: error.response?.data
    });
    
    // 🔥 COMENTADO TEMPORALMENTE - NO HACER LOGOUT AUTOMÁTICO
    // if (error.response?.status === 401) {
    //   localStorage.removeItem('planifica_token');
    //   localStorage.removeItem('planifica_user');
    //   window.location.href = '/login';
    // }
    
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
  getById: (postId) => API.get(`/social-posts/${postId}`),
  
  // Actualizar publicación
  update: (postId, data) => API.put(`/social-posts/${postId}`, data),
  
  // Eliminar publicación
  delete: (postId) => API.delete(`/social-posts/${postId}`),
  
  // Cambiar estado de publicación
  updateStatus: (postId, status) => API.patch(`/social-posts/${postId}/status`, { status }),
  
  // Obtener estadísticas de publicaciones
  getStats: (projectId) => API.get(`/social-posts/stats/${projectId}`),
  
  // Duplicar publicación
  duplicate: async (postId, newScheduledDate) => {
    try {
      // Primero obtenemos la publicación original
      const originalResponse = await API.get(`/social-posts/${postId}`);
      const originalPost = originalResponse.data.data;
      
      // Creamos una nueva publicación con los datos duplicados
      const duplicatedData = {
        projectId: originalPost.project._id,
        platform: originalPost.platform,
        content: `[COPIA] ${originalPost.content}`,
        scheduledDate: newScheduledDate || new Date(Date.now() + 3600000).toISOString(),
        hashtags: originalPost.hashtags || [],
        notes: `Duplicado de: ${originalPost.notes || 'Sin notas'}`,
        status: 'draft'
      };
      
      return await API.post('/social-posts', duplicatedData);
    } catch (error) {
      console.error('Error duplicando publicación:', error);
      throw error;
    }
  }
};

// Funciones utilitarias
export const apiUtils = {
  // Verificar conexión con el servidor
  checkConnection: async () => {
    try {
      const response = await API.get('/health');
      console.log('✅ Conexión con servidor OK:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Sin conexión con servidor:', error);
      return false;
    }
  },
  
  // Verificar estado de autenticación
  checkAuth: async () => {
    try {
      const response = await API.get('/auth/me');
      console.log('✅ Token válido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Token inválido:', error);
      return null;
    }
  }
};

// 🆕 FUNCIÓN HANDLE API ERROR (que faltaba)
export const handleApiError = (error, defaultMessage = 'Error desconocido') => {
  console.log('🔍 handleApiError llamado con:', error);
  
  if (error.response) {
    // Error del servidor con respuesta
    const status = error.response.status;
    const message = error.response.data?.message || defaultMessage;
    
    console.log(`❌ Error ${status}: ${message}`);
    
    switch (status) {
      case 400:
        return `Datos inválidos: ${message}`;
      case 401:
        return 'No autorizado. Por favor, inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'Recurso no encontrado.';
      case 409:
        return 'Conflicto de datos. El recurso ya existe.';
      case 422:
        return `Error de validación: ${message}`;
      case 500:
        return 'Error interno del servidor. Inténtalo más tarde.';
      default:
        return message;
    }
  } else if (error.request) {
    // Error de red
    console.log('❌ Error de red:', error.request);
    return 'Error de conexión. Verifica tu conexión a internet.';
  } else {
    // Error de configuración
    console.log('❌ Error de configuración:', error.message);
    return defaultMessage;
  }
};