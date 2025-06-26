import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
const Login = () => {
const [formData, setFormData] = useState({
email: '',
password: '',
});
const { login, isLoading, error, clearError } = useAuth();
const navigate = useNavigate();
// Limpiar errores solo cuando se monta el componente
useEffect(() => {
clearError();
}, []); // Sin dependencias para evitar loops
const handleChange = (e) => {
setFormData({
...formData,
[e.target.name]: e.target.value,
});
};
const handleSubmit = async (e) => {
e.preventDefault();
const result = await login(formData.email, formData.password);

if (result.success) {
  // Redirigir al dashboard después del login exitoso
  navigate('/', { replace: true });
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

      {/* Datos de prueba */}
      <div className="mt-4 p-3 bg-light rounded">
        <small className="text-muted">
          <strong>Datos de prueba:</strong><br />
          Email: juan@test.com<br />
          (Usa la contraseña que configuraste)
        </small>
      </div>
    </div>
  </div>
</div>
);
};
export default Login;