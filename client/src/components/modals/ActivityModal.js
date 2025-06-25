import React, { useState, useEffect } from 'react';

const ActivityModal = ({ 
  show, 
  onHide, 
  onSave, 
  contacts = [], 
  activity = null, // Para editar actividad existente
  title = "Nueva Actividad" 
}) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    contactId: '',
    type: 'call',
    title: '',
    description: '',
    date: '',
    time: '',
    reminder: false,
    priority: 'medium'
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (activity) {
      const activityDate = new Date(activity.date);
      setFormData({
        contactId: activity.contactId || '',
        type: activity.type || 'call',
        title: activity.title || '',
        description: activity.description || '',
        date: activityDate.toISOString().split('T')[0],
        time: activityDate.toTimeString().slice(0, 5),
        reminder: activity.reminder || false,
        priority: activity.priority || 'medium'
      });
    } else {
      // Resetear formulario para nueva actividad
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);
      
      setFormData({
        contactId: '',
        type: 'call',
        title: '',
        description: '',
        date: today,
        time: currentTime,
        reminder: false,
        priority: 'medium'
      });
    }
  }, [activity, show]);

  // Manejar cambios en el formulario
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Obtener información del contacto seleccionado
  const selectedContact = contacts.find(c => c.id === formData.contactId);

  // Obtener icono de actividad
  const getActivityIcon = (type) => {
    const icons = {
      call: 'bi-telephone-fill',
      email: 'bi-envelope-fill',
      meeting: 'bi-calendar-event-fill',
      note: 'bi-chat-fill',
      task: 'bi-check-circle-fill'
    };
    return icons[type] || 'bi-circle-fill';
  };

  // Obtener color de actividad
  const getActivityColor = (type) => {
    const colors = {
      call: 'success',
      email: 'primary',
      meeting: 'warning',
      note: 'info',
      task: 'secondary'
    };
    return colors[type] || 'secondary';
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.contactId) {
      alert('Selecciona un contacto');
      return false;
    }
    if (!formData.title.trim()) {
      alert('El título es requerido');
      return false;
    }
    if (!formData.date) {
      alert('La fecha es requerida');
      return false;
    }
    if (!formData.time) {
      alert('La hora es requerida');
      return false;
    }

    // Validar que la fecha no sea en el pasado (solo para nuevas actividades)
    if (!activity) {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      if (selectedDateTime < now) {
        const confirm = window.confirm('La fecha y hora seleccionada es en el pasado. ¿Deseas continuar?');
        if (!confirm) return false;
      }
    }

    return true;
  };

  // Manejar guardado
  const handleSave = () => {
    if (!validateForm()) return;

    const activityData = {
      ...formData,
      date: new Date(`${formData.date}T${formData.time}`)
    };

    onSave(activityData);
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
              <i className={`bi ${activity ? 'bi-calendar-check' : 'bi-calendar-plus'} me-2`}></i>
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
                    Tipo de Actividad <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    <option value="call">📞 Llamada</option>
                    <option value="email">📧 Email</option>
                    <option value="meeting">🤝 Reunión</option>
                    <option value="note">📝 Nota</option>
                    <option value="task">✅ Tarea</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Contacto <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.contactId}
                    onChange={(e) => handleChange('contactId', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar contacto...</option>
                    {contacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} - {contact.company}
                      </option>
                    ))}
                  </select>
                  
                  {/* Información del contacto seleccionado */}
                  {selectedContact && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <div className="d-flex align-items-center">
                        <img
                          src={selectedContact.avatar}
                          className="rounded-circle me-2"
                          alt={selectedContact.name}
                          style={{width: '24px', height: '24px'}}
                        />
                        <div>
                          <small className="fw-bold">{selectedContact.name}</small>
                          <div className="text-muted" style={{fontSize: '0.75rem'}}>
                            {selectedContact.email} • {selectedContact.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Título <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ej: Llamada de seguimiento"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Prioridad</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                  >
                    <option value="low">🔵 Baja</option>
                    <option value="medium">🟡 Media</option>
                    <option value="high">🔴 Alta</option>
                  </select>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    Fecha <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Hora <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.time}
                    onChange={(e) => handleChange('time', e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="activityReminder"
                      checked={formData.reminder}
                      onChange={(e) => handleChange('reminder', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="activityReminder">
                      <i className="bi bi-bell me-1"></i>
                      Recordarme 30 minutos antes
                    </label>
                  </div>
                </div>

                {/* Preview de fecha y hora */}
                {formData.date && formData.time && (
                  <div className="alert alert-info">
                    <h6 className="alert-heading">
                      <i className="bi bi-calendar-event me-2"></i>Programado para:
                    </h6>
                    <p className="mb-0">
                      {new Date(`${formData.date}T${formData.time}`).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} a las {formData.time}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción - fila completa */}
            <div className="row">
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Detalles de la actividad, objetivos, puntos a tratar..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Preview de la actividad */}
            {formData.title && formData.contactId && (
              <div className="alert alert-light border mt-3">
                <h6 className="alert-heading">
                  <i className="bi bi-eye me-2"></i>Vista Previa
                </h6>
                <div className="d-flex align-items-start">
                  <div className={`activity-icon bg-${getActivityColor(formData.type)} me-3`} 
                       style={{width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <i className={`bi ${getActivityIcon(formData.type)} text-white`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <strong>{formData.title}</strong>
                    <div className="text-muted small">
                      {selectedContact?.company} • {selectedContact?.name}
                    </div>
                    {formData.description && (
                      <p className="mb-1 small">{formData.description}</p>
                    )}
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge bg-${getActivityColor(formData.type)}`}>
                        {formData.type === 'call' ? 'Llamada' :
                         formData.type === 'email' ? 'Email' :
                         formData.type === 'meeting' ? 'Reunión' :
                         formData.type === 'note' ? 'Nota' : 'Tarea'}
                      </span>
                      <span className={`badge bg-${formData.priority === 'high' ? 'danger' : formData.priority === 'medium' ? 'warning' : 'info'}`}>
                        Prioridad {formData.priority === 'high' ? 'Alta' : formData.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                      {formData.reminder && (
                        <span className="badge bg-secondary">
                          <i className="bi bi-bell me-1"></i>Recordatorio
                        </span>
                      )}
                    </div>
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
              disabled={!formData.contactId || !formData.title || !formData.date || !formData.time}
            >
              <i className={`bi ${activity ? 'bi-check-lg' : 'bi-calendar-check'} me-1`}></i>
              {activity ? 'Actualizar' : 'Programar'} Actividad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;