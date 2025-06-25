import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Badge, ProgressBar } from 'react-bootstrap';

function TaskDetailModal({ show, onHide, task }) {
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'Laura Martín',
      content: '¿Ya tenemos los assets finales para esta sección?',
      time: 'hace 5 min',
      avatar: 'L'
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: 'Investigación de competidores', completed: true },
    { id: 2, text: 'Creación de wireframes', completed: false },
    { id: 3, text: 'Diseño de la propuesta visual', completed: false }
  ]);

  if (!task) return null;

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      setComments([...comments, {
        id: comments.length + 1,
        author: 'Tú',
        content: newComment,
        time: 'ahora',
        avatar: 'U'
      }]);
      setNewComment('');
    }
  };

  const toggleChecklistItem = (id) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedItems = checklistItems.filter(item => item.completed).length;
  const progressPercentage = Math.round((completedItems / checklistItems.length) * 100);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Detalles de la Tarea</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          {/* Columna Principal */}
          <Col md={8}>
            <h5>{task.title}</h5>
            <p className="text-muted mb-4">{task.description}</p>

            {/* Checklist */}
            <h6 className="d-flex align-items-center mb-3">
              <i className="bi bi-check2-square me-2"></i>
              Checklist ({completedItems}/{checklistItems.length})
            </h6>
            <ProgressBar 
              now={progressPercentage} 
              className="mb-3" 
              style={{ height: '8px' }}
            />
            
            {checklistItems.map(item => (
              <Form.Check
                key={item.id}
                type="checkbox"
                id={`check-${item.id}`}
                label={item.text}
                checked={item.completed}
                onChange={() => toggleChecklistItem(item.id)}
                className="mb-2"
              />
            ))}

            {/* Archivos Adjuntos */}
            <h6 className="mt-4 mb-3">
              <i className="bi bi-paperclip me-2"></i>
              Archivos Adjuntos
            </h6>
            <div className="border rounded p-3 mb-4">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-file-earmark-image fs-4 me-3 text-primary"></i>
                <div className="flex-grow-1">
                  <div className="fw-bold">brief_creativo_v2.jpg</div>
                  <small className="text-muted">2.3 MB</small>
                </div>
                <Button variant="outline-secondary" size="sm">
                  <i className="bi bi-download"></i>
                </Button>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark-zip fs-4 me-3 text-warning"></i>
                <div className="flex-grow-1">
                  <div className="fw-bold">assets_inspiracion.zip</div>
                  <small className="text-muted">15.7 MB</small>
                </div>
                <Button variant="outline-secondary" size="sm">
                  <i className="bi bi-download"></i>
                </Button>
              </div>
            </div>

            {/* Comentarios */}
            <h6>
              <i className="bi bi-chat-left-text me-2"></i>
              Comentarios
            </h6>
            {comments.map(comment => (
              <div key={comment.id} className="d-flex mb-3">
                <img
                  src={`https://placehold.co/40x40/ffc107/white?text=${comment.avatar}`}
                  className="rounded-circle me-3"
                  alt={comment.author}
                />
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-1">
                    <strong className="me-2">{comment.author}</strong>
                    <small className="text-muted">{comment.time}</small>
                  </div>
                  <div className="bg-light p-2 rounded">{comment.content}</div>
                </div>
              </div>
            ))}
            
            <Form onSubmit={handleAddComment} className="mt-3">
              <div className="input-group">
                <Form.Control
                  type="text"
                  placeholder="Añadir un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button type="submit" variant="outline-secondary">
                  Enviar
                </Button>
              </div>
            </Form>
          </Col>

          {/* Columna Lateral */}
          <Col md={4}>
            <div className="bg-light p-3 rounded">
              <h6 className="text-muted small text-uppercase">Proyecto</h6>
              <p className="mb-3">Proyecto Alpha</p>

              <h6 className="text-muted small text-uppercase">Estado</h6>
              <Badge bg="primary" className="mb-3">En Progreso</Badge>

              <h6 className="text-muted small text-uppercase">Prioridad</h6>
              <Badge bg="danger" className="mb-3">{task.priority}</Badge>

              <h6 className="text-muted small text-uppercase">Asignado a</h6>
              {task.assignees?.map((assignee, index) => (
                <div key={index} className="d-flex align-items-center mb-2">
                  <img
                    src={`https://placehold.co/32x32/${index === 0 ? '964ef9' : 'ffc107'}/white?text=${assignee.charAt(0)}`}
                    className="rounded-circle me-2"
                    alt={assignee}
                  />
                  <span className="small">{assignee}</span>
                </div>
              ))}

              <h6 className="text-muted small text-uppercase mt-3">Fecha de Entrega</h6>
              <p>
                <i className="bi bi-calendar-event me-2"></i>
                {task.dueDate}
              </p>

              <h6 className="text-muted small text-uppercase">Progreso</h6>
              <div className="d-flex align-items-center">
                <ProgressBar 
                  now={task.progress} 
                  className="flex-grow-1 me-2" 
                  style={{ height: '8px' }}
                />
                <small className="fw-bold">{task.progress}%</small>
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <Button variant="primary">
          Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TaskDetailModal;