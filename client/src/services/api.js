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