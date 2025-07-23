// client/src/components/modals/ProjectConfigModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Tab, Tabs, Row, Col, Alert } from 'react-bootstrap';
import projectService from '../../services/projectService';
import API from '../../services/api'; // 🔥 AGREGAR ESTA LÍNEA SI NO LA TIENES

const ProjectConfigModal = ({ show, onHide, project, onProjectUpdate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    priority: 'medium',
    startDate: '',
    endDate: '',
    budget: {
      allocated: 0,
      used: 0
    },
    settings: {
      allowTaskCreation: true,
      requireApproval: false,
      autoAssignTasks: false,
      enableNotifications: true,
      publicProject: false
    }
  });

  // Cargar datos del proyecto cuando se abre el modal
  useEffect(() => {
    if (show && project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
        priority: project.priority || 'medium',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        budget: {
          allocated: project.budget?.allocated || 0,
          used: project.budget?.used || 0
        },
        settings: {
          allowTaskCreation: project.settings?.allowTaskCreation ?? true,
          requireApproval: project.settings?.requireApproval ?? false,
          autoAssignTasks: project.settings?.autoAssignTasks ?? false,
          enableNotifications: project.settings?.enableNotifications ?? true,
          publicProject: project.settings?.publicProject ?? false
        }
      });
      setError('');
      setSuccess('');
    }
  }, [show, project]);

  useEffect(() => {
    console.log('🎭 FormData actualizado:', formData);
  }, [formData]);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    console.log('🔄 Cambio en formulario:', { name, value, type, checked }); // Debug
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      setFormData(prev => {
        const newData = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
          }
        };
        
        console.log('📝 Datos actualizados (anidados):', newData); // Debug
        return newData;
      });
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        };
        
        console.log('📝 Datos actualizados (simple):', newData); // Debug
        return newData;
      });
    }
  };

  // Guardar cambios
 const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('💾 === INICIANDO GUARDADO ===');
      console.log('💾 Datos completos a enviar:', formData);
      console.log('💾 Settings específicos:', formData.settings);
      console.log('💾 Project ID:', project._id);
      
      const response = await projectService.updateProject(project._id, formData);
      
      console.log('📥 Respuesta del servidor:', response);
      
      if (response.success) {
        console.log('✅ Guardado exitoso');
        setSuccess('✅ Configuración actualizada exitosamente');
        
        // Actualizar el proyecto en el componente padre
        if (onProjectUpdate) {
          console.log('🔄 Actualizando componente padre...');
          onProjectUpdate(response.data);
        }
        
        // Cerrar modal después de un momento
        setTimeout(() => {
          onHide();
        }, 1500);
      } else {
        console.error('❌ Error del servidor:', response.message);
        throw new Error(response.message || 'Error al actualizar el proyecto');
      }
    } catch (err) {
      console.error('❌ Error completo guardando configuración:', err);
      setError('Error al guardar la configuración: ' + err.message);
    } finally {
      setLoading(false);
      console.log('💾 === FIN GUARDADO ===');
    }
  };


  // 🔥 AGREGAR esta función temporal después de handleSave:
  
  const testConnectivity = async () => {
    try {
      console.log('🧪 === TESTING CONECTIVIDAD ===');
      
      const response = await API.put(`/projects/${project._id}/debug`, {
        test: 'connectivity',
        timestamp: new Date(),
        settings: formData.settings
      });
      
      console.log('🧪 Respuesta del test:', response.data);
      alert('✅ Conectividad OK! Revisa la consola para detalles.');
      
    } catch (error) {
      console.error('🧪 Error en test de conectividad:', error);
      alert('❌ Error en conectividad: ' + error.message);
    }
  };

  // Calcular porcentaje de presupuesto usado
  const budgetPercentage = formData.budget.allocated > 0 
    ? Math.round((formData.budget.used / formData.budget.allocated) * 100)
    : 0;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-gear me-2"></i>
          Configuración del Proyecto
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-3">
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
          
          {/* TAB 1: INFORMACIÓN GENERAL */}
          <Tab eventKey="general" title={<><i className="bi bi-info-circle me-1"></i>General</>}>
            <Form>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre del Proyecto *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nombre del proyecto"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Descripción del proyecto"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">🟢 Activo</option>
                      <option value="paused">⏸️ Pausado</option>
                      <option value="completed">✅ Completado</option>
                      <option value="cancelled">❌ Cancelado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prioridad</Form.Label>
                    <Form.Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="low">🟡 Baja</option>
                      <option value="medium">🟠 Media</option>
                      <option value="high">🔴 Alta</option>
                      <option value="urgent">🚨 Urgente</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha de Inicio</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha Límite</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Tab>

          {/* TAB 2: PRESUPUESTO */}
          <Tab eventKey="budget" title={<><i className="bi bi-currency-dollar me-1"></i>Presupuesto</>}>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Presupuesto Asignado</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <Form.Control
                        type="number"
                        name="budget.allocated"
                        value={formData.budget.allocated}
                        onChange={handleInputChange}
                        min="0"
                        step="100"
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Presupuesto Usado</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <Form.Control
                        type="number"
                        name="budget.used"
                        value={formData.budget.used}
                        onChange={handleInputChange}
                        min="0"
                        step="100"
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {formData.budget.allocated > 0 && (
                <div className="mb-3">
                  <Form.Label>Uso del Presupuesto</Form.Label>
                  <div className="progress mb-2">
                    <div 
                      className={`progress-bar ${budgetPercentage > 90 ? 'bg-danger' : budgetPercentage > 70 ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <small className="text-muted">
                    {budgetPercentage}% usado (${formData.budget.used} de ${formData.budget.allocated})
                  </small>
                </div>
              )}

              <Alert variant="info" className="mt-3">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Tip:</strong> Mantén un seguimiento regular del presupuesto para evitar sobrecostos.
              </Alert>
            </Form>
          </Tab>

          {/* TAB 3: CONFIGURACIONES */}
          <Tab eventKey="settings" title={<><i className="bi bi-sliders me-1"></i>Configuración</>}>
            <Form>
              <h6 className="text-muted text-uppercase small mb-3">Permisos del Equipo</h6>
              
              <Form.Check
                type="switch"
                id="switch-allowTaskCreation"
                name="settings.allowTaskCreation"
                label="Permitir que miembros del equipo creen tareas"
                checked={formData.settings?.allowTaskCreation || false}
                onChange={handleInputChange}
                className="mb-3"
              />

              <Form.Check
                type="switch"
                id="switch-requireApproval"
                name="settings.requireApproval"
                label="Requerir aprobación para completar tareas"
                checked={formData.settings?.requireApproval || false}
                onChange={handleInputChange}
                className="mb-3"
              />

              <Form.Check
                type="switch"
                id="switch-autoAssignTasks"
                name="settings.autoAssignTasks"
                label="Auto-asignar tareas por carga de trabajo"
                checked={formData.settings?.autoAssignTasks || false}
                onChange={handleInputChange}
                className="mb-4"
              />

              <h6 className="text-muted text-uppercase small mb-3">Notificaciones</h6>
              
              <Form.Check
                type="switch"
                id="switch-enableNotifications"
                name="settings.enableNotifications"
                label="Habilitar notificaciones del proyecto"
                checked={formData.settings?.enableNotifications || false}
                onChange={handleInputChange}
                className="mb-3"
              />

              <h6 className="text-muted text-uppercase small mb-3">Privacidad</h6>
              
              <Form.Check
                type="switch"
                id="switch-publicProject"
                name="settings.publicProject"
                label="Proyecto público (visible para toda la organización)"
                checked={formData.settings?.publicProject || false}
                onChange={handleInputChange}
                className="mb-3"
              />

              <Alert variant="warning" className="mt-3">
                <i className="bi bi-shield-exclamation me-2"></i>
                <strong>Importante:</strong> Los cambios en permisos afectarán inmediatamente a todos los miembros del equipo.
              </Alert>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={loading || !formData.name.trim()}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Guardando...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-1"></i>
              Guardar Cambios
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};




export default ProjectConfigModal;