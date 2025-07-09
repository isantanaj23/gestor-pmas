import React, { useState } from 'react';
import projectService from '../../services/projectService';

const CreateProjectModal = ({ show, onHide, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: {
      allocated: 0,
      used: 0
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('budget.')) {
      const budgetField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          [budgetField]: parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: {
        allocated: 0,
        used: 0
      }
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      setError('El nombre y la descripción son obligatorios');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🔄 Creando proyecto:', formData);
      
      const response = await projectService.createProject(formData);
      
      if (response.success) {
        console.log('✅ Proyecto creado:', response.data);
        resetForm();
        onHide();
        onProjectCreated(response.data);
      } else {
        throw new Error(response.message || 'Error al crear el proyecto');
      }
    } catch (err) {
      console.error('❌ Error creando proyecto:', err);
      setError(err.message || 'Error al crear el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onHide();
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-plus-circle me-2"></i>
              Crear Nuevo Proyecto
            </h5>
            <button 
              type="button" 
              className="btn-close"
              onClick={handleClose}
              disabled={isSubmitting}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              <div className="row g-3">
                {/* Nombre del proyecto */}
                <div className="col-12">
                  <label className="form-label">
                    <i className="bi bi-bookmark me-2"></i>
                    Nombre del Proyecto *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: Sistema de Gestión CRM"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Descripción */}
                <div className="col-12">
                  <label className="form-label">
                    <i className="bi bi-file-text me-2"></i>
                    Descripción *
                  </label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe brevemente el objetivo y alcance del proyecto..."
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Estado y Prioridad */}
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-flag me-2"></i>
                    Estado
                  </label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="active">Activo</option>
                    <option value="paused">Pausado</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Prioridad
                  </label>
                  <select
                    className="form-select"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                {/* Fechas */}
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-calendar-event me-2"></i>
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-calendar-check me-2"></i>
                    Fecha de Finalización
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Presupuesto */}
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-cash me-2"></i>
                    Presupuesto Asignado
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      name="budget.allocated"
                      value={formData.budget.allocated}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-cash-stack me-2"></i>
                    Presupuesto Usado
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      name="budget.used"
                      value={formData.budget.used}
                      onChange={handleChange}
                      min="0"
                      max={formData.budget.allocated}
                      step="0.01"
                      placeholder="0.00"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Los campos marcados con * son obligatorios
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-lg me-2"></i>
                    Crear Proyecto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;