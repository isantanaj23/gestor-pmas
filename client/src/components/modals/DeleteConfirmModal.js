// client/src/components/modals/DeleteConfirmModal.js
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function DeleteConfirmModal({ 
  show, 
  onHide, 
  onConfirm, 
  loading = false,
  title = "Confirmar Eliminación",
  message = "¿Estás seguro de que deseas eliminar este elemento?",
  itemName = "",
  confirmText = "Eliminar",
  cancelText = "Cancelar"
}) {
  
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {title}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="text-center">
          <div className="mb-3">
            <i className="bi bi-trash3 text-danger" style={{ fontSize: '2rem' }}></i>
          </div>
          
          <p className="mb-2">{message}</p>
          
          {itemName && (
            <p className="fw-bold text-dark mb-0">"{itemName}"</p>
          )}
          
          <div className="mt-3 p-2 bg-light rounded">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Esta acción no se puede deshacer
            </small>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onHide}
          disabled={loading}
        >
          {cancelText}
        </Button>
        
        <Button 
          variant="danger" 
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Eliminando...
            </>
          ) : (
            <>
              <i className="bi bi-trash me-2"></i>
              {confirmText}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DeleteConfirmModal;