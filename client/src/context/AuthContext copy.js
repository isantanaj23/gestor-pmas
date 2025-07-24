// client/src/context/AuthContext.js
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

  // Función de logout usando useCallback para evitar re-renders
  const logout = useCallback(async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout del servidor:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Verificar estado de autenticación - OPTIMIZADO
  const checkAuthState = useCallback(async () => {
    const token = localStorage.getItem('planifica_token');
    
    if (token) {
      try {
        const response = await API.get('/auth/me');
        
        console.log('🔍 Respuesta de /auth/me:', response.data);
        
        if (response.data.success) {
          // Ajustar según la estructura real de la respuesta
          const userData = response.data.data || response.data.user || response.data;
          
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER,
            payload: userData,
          });
        } else {
          logout();
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        logout();
      }
    } else {
      dispatch({
        type: AUTH_ACTIONS.SET_LOADING,
        payload: false,
      });
    }
  }, [logout]);

  // Verificar autenticación solo una vez al montar
  useEffect(() => {
    checkAuthState();
  }, []); // Dependencias vacías - solo se ejecuta una vez

  // Función de login
  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await API.post('/auth/login', {
        email,
        password,
      });

      console.log('🔍 Respuesta completa del login:', response);
      console.log('🔍 response.data:', response.data);
      console.log('🔍 response.data.data:', response.data.data);

      if (response.data && response.data.success) {
        // Determinar la estructura correcta de los datos
        let userData, token;
        
        if (response.data.data) {
          // Estructura: { success: true, data: { user: {}, token: "" } }
          userData = response.data.data.user;
          token = response.data.data.token;
        } else if (response.data.user) {
          // Estructura: { success: true, user: {}, token: "" }
          userData = response.data.user;
          token = response.data.token;
        } else {
          console.error('❌ Estructura de respuesta no reconocida');
          throw new Error('Estructura de respuesta inválida');
        }

        console.log('✅ Datos extraídos:', { userData, token });

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: userData,
            token: token,
          },
        });

        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAIL,
          payload: response.data.message || 'Error en el login',
        });

        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('🚨 Error completo en login:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: errorMessage,
      });

      return { success: false, message: errorMessage };
    }
  }, []);

  // Función de registro
  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const response = await API.post('/auth/register', userData);

      console.log('🔍 Respuesta del registro:', response.data);

      if (response.data && response.data.success) {
        // Usar la misma lógica que en login para extraer datos
        let userResult, token;
        
        if (response.data.data) {
          userResult = response.data.data.user;
          token = response.data.data.token;
        } else if (response.data.user) {
          userResult = response.data.user;
          token = response.data.token;
        }

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: {
            user: userResult,
            token: token,
          },
        });

        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAIL,
          payload: response.data.message || 'Error en el registro',
        });

        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAIL,
        payload: errorMessage,
      });

      return { success: false, message: errorMessage };
    }
  }, []);

  // Limpiar errores
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Actualizar perfil de usuario
  const updateUser = useCallback((userData) => {
    dispatch({
      type: AUTH_ACTIONS.LOAD_USER,
      payload: userData,
    });
    // Actualizar localStorage
    localStorage.setItem('planifica_user', JSON.stringify(userData));
  }, []);

  // Valores que se pasarán a los componentes - MEMOIZADOS
  const contextValue = {
    // Estado
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    // Funciones
    login,
    register,
    logout,
    clearError,
    updateUser,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;