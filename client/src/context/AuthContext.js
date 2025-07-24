// client/src/context/AuthContext.js - VERSIÓN DEBUG SIMPLIFICADA
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import API from '../services/api';

// Estados iniciales
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Tipos de acciones
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAIL: 'REGISTER_FAIL',
  LOAD_USER: 'LOAD_USER',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  RESTORE_SESSION: 'RESTORE_SESSION',
};

// Reducer para manejar el estado
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      // Guardar en localStorage
      localStorage.setItem('planifica_token', action.payload.token);
      localStorage.setItem('planifica_user', JSON.stringify(action.payload.user));
      
      console.log('✅ LOGIN SUCCESS - Datos guardados en localStorage:');
      console.log('   Token guardado:', !!action.payload.token);
      console.log('   Usuario guardado:', action.payload.user.name || action.payload.user.email);
      
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.RESTORE_SESSION:
      console.log('✅ RESTORE SESSION - Sesión restaurada desde localStorage');
      console.log('   Usuario:', action.payload.user.name || action.payload.user.email);
      
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAIL:
    case AUTH_ACTIONS.REGISTER_FAIL:
      // Limpiar localStorage en caso de error
      localStorage.removeItem('planifica_token');
      localStorage.removeItem('planifica_user');
      
      console.log('❌ LOGIN FAIL - localStorage limpiado');
      
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      // Limpiar localStorage
      localStorage.removeItem('planifica_token');
      localStorage.removeItem('planifica_user');
      
      console.log('🔓 LOGOUT - localStorage limpiado');
      
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Función de logout
  const logout = useCallback(async () => {
    try {
      console.log('🔓 Iniciando logout...');
      await API.post('/auth/logout');
      console.log('✅ Logout exitoso en servidor');
    } catch (error) {
      console.error('⚠️ Error en logout del servidor:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // 🆕 Función SIMPLIFICADA para restaurar sesión desde localStorage
  const restoreSession = useCallback(() => {
    console.log('🔍 INICIO - Intentando restaurar sesión desde localStorage...');
    
    const token = localStorage.getItem('planifica_token');
    const userStr = localStorage.getItem('planifica_user');
    
    console.log('   Token encontrado:', !!token);
    console.log('   Usuario encontrado:', !!userStr);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('✅ Datos válidos encontrados - Restaurando sesión inmediatamente');
        console.log('   Usuario:', user.name || user.email);
        console.log('   Token (primeros 20):', token.substring(0, 20) + '...');
        
        // Restaurar inmediatamente SIN verificar con servidor
        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          payload: { user, token }
        });
        
        return true;
      } catch (error) {
        console.error('❌ Error parseando datos de localStorage:', error);
        localStorage.removeItem('planifica_token');
        localStorage.removeItem('planifica_user');
      }
    } else {
      console.log('❌ No hay datos de sesión en localStorage');
    }
    
    // Si no hay datos válidos, parar loading
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    return false;
  }, []);

  // 🔥 INICIALIZACIÓN SIMPLE - Solo restaurar localStorage, NO verificar con servidor
  useEffect(() => {
    console.log('🚀 AuthProvider inicializando - VERSIÓN DEBUG...');
    
    // Solo restaurar desde localStorage, sin verificación de servidor
    restoreSession();
  }, [restoreSession]); // 🔥 AGREGADO restoreSession a las dependencias

  // Función de login
  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      console.log('🔑 Iniciando login para:', email);
      const response = await API.post('/auth/login', { email, password });

      console.log('🔍 Respuesta completa del login:', response.data);

      if (response.data.success) {
        const userData = response.data.data || response.data.user;
        const token = response.data.token;

        console.log('✅ Login exitoso - Datos recibidos:');
        console.log('   Usuario:', userData);
        console.log('   Token disponible:', !!token);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: userData,
            token: token,
          },
        });

        return true;
      } else {
        throw new Error(response.data.message || 'Error en login');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: errorMessage,
      });
      
      return false;
    }
  }, []);

  // Función de registro
  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      console.log('📝 Iniciando registro para:', userData.email);
      const response = await API.post('/auth/register', userData);

      console.log('🔍 Respuesta completa del registro:', response.data);

      if (response.data.success) {
        const user = response.data.data || response.data.user;
        const token = response.data.token;

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: {
            user: user,
            token: token,
          },
        });

        return true;
      } else {
        throw new Error(response.data.message || 'Error en registro');
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAIL,
        payload: errorMessage,
      });
      
      return false;
    }
  }, []);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // 🆕 Función manual para verificar token (opcional)
  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('planifica_token');
    
    if (!token) {
      console.log('🔍 No hay token para verificar');
      return false;
    }
    
    try {
      console.log('🔍 Verificando token con servidor (manual)...');
      const response = await API.get('/auth/me');
      
      console.log('🔍 Respuesta de /auth/me:', response.data);
      
      if (response.data.success) {
        const userData = response.data.data || response.data.user || response.data;
        
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: userData,
        });
        
        console.log('✅ Token verificado exitosamente');
        return true;
      } else {
        console.log('❌ Token inválido según servidor');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      return false;
    }
  }, []);

  // Valores del contexto
  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    register,
    logout,
    clearError,
    verifyToken, // 🆕 Función manual para verificar token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;