import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'developer',
    position: '',
    department: 'development'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores al desmontar
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (!formData.position.trim()) {
      errors.position = 'El cargo es requerido';
    }
    
    return errors;
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al escribir
    if (error) {
      clearError();
    }
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validar formulario
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setValidationErrors({});
    
    try {
      // Preparar datos para enviar (sin confirmPassword)
      const { confirmPassword, ...registerData } = formData;
      
      const result = await register(registerData);
      
      if (result.success) {
        console.log('✅ Registro exitoso');
        // El redirect se maneja automáticamente por el useEffect
      } else {
        console.error('❌ Error en registro:', result.message);
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar loading spinner si está cargando
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-muted">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                {/* Header */}
                <div className="text-center mb-4">
                  <h1 className="h3 text-primary fw-bold mb-1">Planifica+</h1>
                  <p className="text-muted">Crea tu cuenta</p>
                </div>

                {/* Error Alert */}
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

                {/* Formulario */}
                <form onSubmit={handleSubmit}>
                  {/* Nombre */}
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      <i className="bi bi-person me-2"></i>Nombre Completo
                    </label>
                    <input
                      type="text"
                      className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Tu nombre completo"
                      required
                      disabled={isSubmitting}
                    />
                    {validationErrors.name && (
                      <div className="invalid-feedback">{validationErrors.name}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      <i className="bi bi-envelope me-2"></i>Email
                    </label>
                    <input
                      type="email"
                      className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      required
                      autoComplete="email"
                      disabled={isSubmitting}
                    />
                    {validationErrors.email && (
                      <div className="invalid-feedback">{validationErrors.email}</div>
                    )}
                  </div>

                  {/* Cargo */}
                  <div className="mb-3">
                    <label htmlFor="position" className="form-label">
                      <i className="bi bi-briefcase me-2"></i>Cargo
                    </label>
                    <input
                      type="text"
                      className={`form-control ${validationErrors.position ? 'is-invalid' : ''}`}
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      placeholder="Ej: Frontend Developer"
                      required
                      disabled={isSubmitting}
                    />
                    {validationErrors.position && (
                      <div className="invalid-feedback">{validationErrors.position}</div>
                    )}
                  </div>

                  {/* Rol y Departamento */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="role" className="form-label">
                        <i className="bi bi-person-badge me-2"></i>Rol
                      </label>
                      <select
                        className="form-select"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      >
                        <option value="developer">Developer</option>
                        <option value="designer">Designer</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="client">Client</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="department" className="form-label">
                        <i className="bi bi-building me-2"></i>Departamento
                      </label>
                      <select
                        className="form-select"
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      >
                        <option value="development">Development</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                        <option value="sales">Sales</option>
                        <option value="management">Management</option>
                      </select>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      <i className="bi bi-lock me-2"></i>Contraseña
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                      {validationErrors.password && (
                        <div className="invalid-feedback">{validationErrors.password}</div>
                      )}
                    </div>
                  </div>

                  {/* Confirmar Password */}
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      <i className="bi bi-lock-fill me-2"></i>Confirmar Contraseña
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirma tu contraseña"
                      required
                      disabled={isSubmitting}
                    />
                    {validationErrors.confirmPassword && (
                      <div className="invalid-feedback">{validationErrors.confirmPassword}</div>
                    )}
                  </div>

                  {/* Términos y condiciones */}
                  <div className="mb-3 form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="terms"
                      required
                      disabled={isSubmitting}
                    />
                    <label className="form-check-label" htmlFor="terms">
                      Acepto los <Link to="/terms" className="text-primary">términos y condiciones</Link>
                    </label>
                  </div>

                  {/* Botón de envío */}
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </span>
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        Crear Cuenta
                      </>
                    )}
                  </button>
                </form>

                {/* Enlaces adicionales */}
                <div className="text-center mt-4">
                  <p className="text-muted small">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-primary text-decoration-none">
                      Inicia sesión aquí
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;