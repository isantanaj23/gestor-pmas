import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requiredRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Mostrar spinner mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles si se especificaron
  if (requiredRole || requiredRoles.length > 0) {
    const hasRequiredRole = () => {
      if (!user || !user.role) {
        return false;
      }

      // Verificar rol específico
      if (requiredRole && user.role !== requiredRole) {
        return false;
      }

      // Verificar lista de roles permitidos
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        return false;
      }

      return true;
    };

    // Mostrar página de acceso denegado si no tiene el rol
    if (!hasRequiredRole()) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <div className="mb-4">
              <i className="bi bi-shield-exclamation text-danger" style={{ fontSize: '4rem' }}></i>
            </div>
            <h1 className="h3 text-danger mb-3">Acceso Denegado</h1>
            <p className="text-muted mb-4">
              No tienes permisos suficientes para acceder a esta página.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button 
                className="btn btn-primary"
                onClick={() => window.history.back()}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Volver
              </button>
              <Navigate to="/" />
            </div>
            <div className="mt-4 p-3 bg-light rounded">
              <small className="text-muted">
                <strong>Tu rol actual:</strong> {user?.role || 'No definido'}<br/>
                <strong>Rol requerido:</strong> {requiredRole || requiredRoles.join(', ')}
              </small>
            </div>
          </div>
        </div>
      );
    }
  }

  // Renderizar el componente protegido
  return children;
};

export default ProtectedRoute;