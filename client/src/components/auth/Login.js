import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 NUEVO: Redirigir inmediatamente si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ Usuario ya autenticado, redirigiendo al dashboard...');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Limpiar errores al montar
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 🔥 ARREGLADO: Manejar correctamente la respuesta del login
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔑 Iniciando proceso de login para:', formData.email);
    
    try {
      // La función login del AuthContext devuelve true/false directamente
      const loginSuccessful = await login(formData.email, formData.password);
      
      console.log('🔍 Resultado del login:', loginSuccessful);
      
      if (loginSuccessful) {
        console.log('✅ Login exitoso, redirigiendo...');
        
        // Obtener la URL de destino (donde el usuario quería ir antes del login)
        const from = location.state?.from?.pathname || '/';
        
        console.log('🏠 Redirigiendo a:', from);
        
        // Redirigir al dashboard o a la página que intentaba acceder
        navigate(from, { replace: true });
      } else {
        console.log('❌ Login falló - el error debería mostrarse automáticamente');
      }
    } catch (error) {
      console.error('❌ Error inesperado en login:', error);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow" style={{ width: '400px' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h2 className="text-primary">
              <i className="bi bi-kanban-fill me-2"></i>
              Planifica+
            </h2>
            <p className="text-muted">Inicia sesión en tu cuenta</p>
          </div>

          {/* 🔥 MEJORADO: Mostrar errores más claramente */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={clearError}
                aria-label="Close"
              ></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                <i className="bi bi-envelope me-2"></i>Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                <i className="bi bi-lock me-2"></i>Contraseña
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <div className="d-grid mb-3">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </span>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Iniciar Sesión
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="mb-0">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none"
                onClick={() => navigate('/register')}
                disabled={isLoading}
              >
                Regístrate aquí
              </button>
            </p>
          </div>

          {/* 🔥 ACTUALIZADO: Datos de prueba más claros */}
          <div className="mt-4 p-3 bg-light rounded">
            <small className="text-muted">
              <strong>💡 Datos de prueba:</strong><br />
              Email: <code>juan@test.com</code><br />
              Contraseña: <code>123456</code><br />
              <em>(O usa cualquier usuario que hayas creado)</em>
            </small>
          </div>

          {/* 🔥 NUEVO: Indicador de estado de conexión */}
          <div className="mt-2 text-center">
            <small className="text-muted">
              <i className="bi bi-wifi me-1"></i>
              Conectando a: <code>{process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</code>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;