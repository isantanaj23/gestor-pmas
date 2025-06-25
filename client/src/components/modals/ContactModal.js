import React, { useState, useEffect } from 'react';

const ContactModal = ({ 
  show, 
  onHide, 
  onSave, 
  contact = null, // Para editar contacto existente
  title = "Nuevo Contacto" 
}) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    stage: 'lead',
    value: '',
    source: 'web',
    priority: 'medium',
    notes: ''
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        position: contact.position || '',
        stage: contact.stage || 'lead',
        value: contact.value || '',
        source: contact.source || 'web',
        priority: contact.priority || 'medium',
        notes: contact.notes || ''
      });
    } else {
      // Resetear formulario para nuevo contacto
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        stage: 'lead',
        value: '',
        source: 'web',
        priority: 'medium',
        notes: ''
      });
    }
  }, [contact, show]);

  // Manejar cambios en el formulario
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      alert('El email es requerido');
      return false;
    }
    if (!formData.company.trim()) {
      alert('La empresa es requerida');
      return false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('El email no tiene un formato válido');
      return false;
    }

    return true;
  };

  // Manejar guardado
  const handleSave = () => {
    if (!validateForm()) return;

    const contactData = {
      ...formData,
      value: parseFloat(formData.value) || 0
    };

    onSave(contactData);
    onHide();
  };

  // Manejar cancelar
  const handleCancel = () => {
    onHide();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bi ${contact ? 'bi-person-check' : 'bi-person-plus'} me-2`}></i>
              {title}
            </h5>
            <button type="button" className="btn-close" onClick={handleCancel}></button>
          </div>

          <div className="modal-body">
            <div className="row">
              {/* Columna izquierda */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    Nombre Completo <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ej: María González"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="maria@empresa.com"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+34 600 123 456"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Empresa <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="TechCorp Solutions"
                    required
                  />
                </div>
              </div>

              {/* Columna derecha */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Cargo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    placeholder="CEO, Director, Manager..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Etapa del Pipeline</label>
                  <select
                    className="form-select"
                    value={formData.stage}
                    onChange={(e) => handleChange('stage', e.target.value)}
                  >
                    <option value="lead">🔍 Lead</option>
                    <option value="contacted">📞 Contactado</option>
                    <option value="proposal">📋 Propuesta</option>
                    <option value="client">✅ Cliente</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Valor Potencial</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.value}
                      onChange={(e) => handleChange('value', e.target.value)}
                      placeholder="15000"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Fuente</label>
                  <select
                    className="form-select"
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                  >
                    <option value="web">🌐 Página Web</option>
                    <option value="referral">👥 Referido</option>
                    <option value="linkedin">💼 LinkedIn</option>
                    <option value="cold-email">📧 Cold Email</option>
                    <option value="event">🎯 Evento</option>
                    <option value="other">📋 Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fila completa */}
            <div className="row">
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label">Notas</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Información adicional, necesidades específicas, comentarios..."
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label">Prioridad</label>
                  <div className="btn-group w-100" role="group">
                    {[
                      { value: 'high', label: '🔴 Alta', color: 'danger' },
                      { value: 'medium', label: '🟡 Media', color: 'warning' },
                      { value: 'low', label: '🔵 Baja', color: 'info' }
                    ].map(priority => (
                      <React.Fragment key={priority.value}>
                        <input
                          type="radio"
                          className="btn-check"
                          name="contactPriority"
                          id={`priority${priority.value}`}
                          value={priority.value}
                          checked={formData.priority === priority.value}
                          onChange={(e) => handleChange('priority', e.target.value)}
                        />
                        <label
                          className={`btn btn-outline-${priority.color}`}
                          htmlFor={`priority${priority.value}`}
                        >
                          {priority.label}
                        </label>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview de información */}
            {formData.name && formData.company && (
              <div className="alert alert-light border mt-3">
                <h6 className="alert-heading">
                  <i className="bi bi-eye me-2"></i>Vista Previa
                </h6>
                <div className="d-flex align-items-center">
                  <img
                    src={`https://placehold.co/40x40/964ef9/white?text=${formData.name.charAt(0)}`}
                    className="rounded-circle me-3"
                    alt="Avatar"
                    style={{width: '40px', height: '40px'}}
                  />
                  <div>
                    <strong>{formData.name}</strong>
                    {formData.position && <span className="text-muted"> - {formData.position}</span>}
                    <div className="small text-muted">{formData.company}</div>
                    {formData.value && (
                      <span className="badge bg-success">${parseFloat(formData.value).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              <i className="bi bi-x-lg me-1"></i>Cancelar
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={!formData.name || !formData.email || !formData.company}
            >
              <i className={`bi ${contact ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
              {contact ? 'Actualizar' : 'Guardar'} Contacto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;