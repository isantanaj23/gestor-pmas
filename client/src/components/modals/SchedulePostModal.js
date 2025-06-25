import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';

function SchedulePostModal({ show, onHide, onSchedulePost }) {
  const [formData, setFormData] = useState({
    platform: 'instagram',
    content: '',
    imageUrl: '',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.content && formData.scheduledDate && formData.scheduledTime) {
      onSchedulePost?.(formData);
      onHide();
      // Reset form
      setFormData({
        platform: 'instagram',
        content: '',
        imageUrl: '',
        scheduledDate: '',
        scheduledTime: ''
      });
    }
  };

  const getPlatformIcon = () => {
    const icons = {
      instagram: 'bi-instagram',
      facebook: 'bi-facebook',
      linkedin: 'bi-linkedin',
      twitter: 'bi-twitter'
    };
    return icons[formData.platform];
  };

  const getPlatformColor = () => {
    const colors = {
      instagram: '#E4405F',
      facebook: '#1877F2',
      linkedin: '#0A66C2',
      twitter: '#1DA1F2'
    };
    return colors[formData.platform];
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-calendar-plus me-2"></i>
          Programar Nueva Publicación
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={8}>
              {/* Selección de Red Social */}
              <Form.Group className="mb-3">
                <Form.Label>Red Social</Form.Label>
                <div className="d-flex gap-3">
                  {['instagram', 'facebook', 'linkedin', 'twitter'].map(platform => (
                    <Form.Check
                      key={platform}
                      type="radio"
                      name="platform"
                      id={platform}
                      value={platform}
                      checked={formData.platform === platform}
                      onChange={handleChange}
                      label={
                        <span style={{ color: getPlatformColor() }}>
                          <i className={`bi ${getPlatformIcon()} me-1`}></i>
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </span>
                      }
                    />
                  ))}
                </div>
              </Form.Group>

              {/* Contenido del Post */}
              <Form.Group className="mb-3">
                <Form.Label>Contenido del Post</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Escribe aquí el contenido de tu publicación..."
                  required
                />
                <Form.Text className="text-muted">
                  {formData.content.length}/280 caracteres
                </Form.Text>
              </Form.Group>

              {/* URL de Imagen */}
              <Form.Group className="mb-3">
                <Form.Label>URL de la Imagen (Opcional)</Form.Label>
                <Form.Control
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </Form.Group>

              {/* Fecha y Hora */}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha de Publicación</Form.Label>
                    <Form.Control
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Hora de Publicación</Form.Label>
                    <Form.Control
                      type="time"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Col>

            {/* Vista Previa */}
            <Col md={4}>
              <h6 className="mb-3">Vista Previa</h6>
              <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="d-flex align-items-center mb-2">
                  <i 
                    className={`bi ${getPlatformIcon()} me-2`}
                    style={{ color: getPlatformColor(), fontSize: '1.2rem' }}
                  ></i>
                  <strong>{formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1)}</strong>
                </div>
                
                {formData.imageUrl && (
                  <img 
                    src={formData.imageUrl} 
                    alt="Vista previa" 
                    className="img-fluid rounded mb-2"
                    style={{ maxHeight: '150px', width: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                  {formData.content || 'El contenido aparecerá aquí...'}
                </p>
                
                {formData.scheduledDate && formData.scheduledTime && (
                  <small className="text-muted">
                    <i className="bi bi-clock me-1"></i>
                    Programado para: {formData.scheduledDate} a las {formData.scheduledTime}
                  </small>
                )}
              </div>

              {/* Consejos */}
              <Alert variant="info" className="mt-3">
                <small>
                  <strong>Consejos:</strong>
                  <ul className="mb-0 mt-1">
                    <li>Usa hashtags relevantes</li>
                    <li>Incluye una llamada a la acción</li>
                    <li>Programa en horarios de mayor actividad</li>
                  </ul>
                </small>
              </Alert>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="outline-primary" onClick={() => setShowPreview(!showPreview)}>
          <i className="bi bi-eye me-1"></i>
          {showPreview ? 'Ocultar' : 'Vista'} Previa
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          <i className="bi bi-calendar-check me-1"></i>
          Programar Publicación
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SchedulePostModal;