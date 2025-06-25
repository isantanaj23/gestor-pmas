import React, { useState } from 'react';
import ContactModal from '../modals/ContactModal';
import ActivityModal from '../modals/ActivityModal';
import './CRMPage.css';

const CRMPage = () => {
  // Estado para manejar la pestaña activa del CRM
  const [activeTab, setActiveTab] = useState('pipeline');
  
  // Estado para gestionar contactos
  const [contacts, setContacts] = useState([
    {
      id: '001',
      name: 'María González',
      email: 'maria.gonzalez@techcorp.com',
      phone: '+34 600 123 456',
      company: 'TechCorp Solutions',
      position: 'CEO',
      stage: 'lead',
      value: 12000,
      source: 'web',
      priority: 'high',
      notes: 'Interesada en solución completa. Presupuesto aprobado.',
      createdAt: new Date('2025-06-20'),
      lastContact: new Date('2025-06-22'),
      avatar: 'https://placehold.co/40x40/964ef9/white?text=MG'
    },
    {
      id: '002',
      name: 'Patricia Silva',
      email: 'patricia.silva@medicorp.com',
      phone: '+34 600 789 012',
      company: 'MediCorp Health',
      position: 'Director',
      stage: 'contacted',
      value: 22000,
      source: 'event',
      priority: 'high',
      notes: 'Llamada programada para mañana. Muy interesada.',
      createdAt: new Date('2025-06-18'),
      lastContact: new Date('2025-06-23'),
      avatar: 'https://placehold.co/40x40/28a745/white?text=PS'
    },
    {
      id: '003',
      name: 'Carmen Morales',
      email: 'carmen@innovatech.com',
      phone: '+34 600 345 678',
      company: 'InnovaTech Solutions',
      position: 'CEO',
      stage: 'client',
      value: 28000,
      source: 'referral',
      priority: 'high',
      notes: 'Cliente exitoso. Contrato firmado.',
      createdAt: new Date('2025-05-15'),
      lastContact: new Date('2025-06-15'),
      avatar: 'https://placehold.co/40x40/ffc107/white?text=CM'
    },
    {
      id: '004',
      name: 'Laura Vega',
      email: 'laura.vega@financeflow.com',
      phone: '+34 600 111 222',
      company: 'FinanceFlow Corp',
      position: 'CFO',
      stage: 'proposal',
      value: 18500,
      source: 'cold-email',
      priority: 'high',
      notes: 'Revisión propuesta en curso.',
      createdAt: new Date('2025-06-10'),
      lastContact: new Date('2025-06-24'),
      avatar: 'https://placehold.co/40x40/dc3545/white?text=LV'
    },
    {
      id: '005',
      name: 'Diego Torres',
      email: 'diego.torres@retailmax.com',
      phone: '+34 600 333 444',
      company: 'RetailMax Chain',
      position: 'Operations Manager',
      stage: 'proposal',
      value: 32000,
      source: 'referral',
      priority: 'high',
      notes: 'Reunión viernes 2PM.',
      createdAt: new Date('2025-06-12'),
      lastContact: new Date('2025-06-20'),
      avatar: 'https://placehold.co/40x40/17a2b8/white?text=DT'
    }
  ]);

  // Estado para actividades
  const [activities, setActivities] = useState([
    {
      id: '001',
      contactId: '001',
      type: 'call',
      title: 'Llamada inicial',
      description: 'Primera conversación sobre necesidades del proyecto',
      date: new Date('2025-06-22T15:30:00'),
      completed: true,
      duration: 25
    },
    {
      id: '002',
      contactId: '002',
      type: 'email',
      title: 'Propuesta técnica enviada',
      description: 'Incluye cronograma y presupuesto detallado',
      date: new Date('2025-06-23T11:15:00'),
      completed: true,
      opened: true
    },
    {
      id: '003',
      contactId: '004',
      type: 'meeting',
      title: 'Reunión de presentación',
      description: 'Presentar propuesta técnica y comercial',
      date: new Date('2025-06-26T15:00:00'),
      completed: false
    },
    {
      id: '004',
      contactId: '005',
      type: 'call',
      title: 'Seguimiento propuesta',
      description: 'Revisar feedback y ajustar términos',
      date: new Date('2025-06-27T10:00:00'),
      completed: false
    }
  ]);

  // Estados para modales
  const [showContactModal, setShowContactModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);

  // Calcular KPIs del CRM
  const totalContacts = contacts.length;
  const activeOpportunities = contacts.filter(c => c.stage !== 'client').length;
  const totalPipelineValue = contacts.reduce((sum, contact) => sum + contact.value, 0);
  const conversionRate = Math.round((contacts.filter(c => c.stage === 'client').length / totalContacts) * 100);
  const averageDealValue = Math.round(totalPipelineValue / totalContacts);

  // Filtrar contactos por etapa
  const getContactsByStage = (stage) => {
    return contacts.filter(contact => contact.stage === stage);
  };

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

  // Manejar guardado de contacto
  const handleSaveContact = (contactData) => {
    if (editingContact) {
      // Actualizar contacto existente
      setContacts(contacts.map(contact => 
        contact.id === editingContact.id 
          ? { ...contact, ...contactData, lastContact: new Date() }
          : contact
      ));
      setEditingContact(null);
    } else {
      // Crear nuevo contacto
      const newContact = {
        id: String(contacts.length + 1).padStart(3, '0'),
        ...contactData,
        createdAt: new Date(),
        lastContact: new Date(),
        avatar: `https://placehold.co/40x40/964ef9/white?text=${contactData.name.charAt(0)}`
      };
      setContacts([...contacts, newContact]);
    }
    
    setShowContactModal(false);
  };

  // Manejar guardado de actividad
  const handleSaveActivity = (activityData) => {
    if (editingActivity) {
      // Actualizar actividad existente
      setActivities(activities.map(activity => 
        activity.id === editingActivity.id 
          ? { ...activity, ...activityData }
          : activity
      ));
      setEditingActivity(null);
    } else {
      // Crear nueva actividad
      const newActivity = {
        id: String(activities.length + 1).padStart(3, '0'),
        ...activityData,
        completed: false,
        createdAt: new Date()
      };
      setActivities([...activities, newActivity]);
    }
    
    setShowActivityModal(false);
  };

  // Ver detalles de contacto
  const viewContactDetails = (contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  // Editar contacto
  const editContact = (contact) => {
    setEditingContact(contact);
    setShowContactModal(true);
  };

  // Crear nuevo contacto
  const createNewContact = () => {
    setEditingContact(null);
    setShowContactModal(true);
  };

  // Crear nueva actividad
  const createNewActivity = () => {
    setEditingActivity(null);
    setShowActivityModal(true);
  };

  // Renderizar Pipeline
  const renderPipeline = () => (
    <div className="pipeline-view">
      {/* KPIs del CRM */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="crm-kpi-card border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-primary text-uppercase mb-1 fw-bold">Oportunidades Activas</h6>
                  <h3 className="mb-2 text-primary">{activeOpportunities}</h3>
                  <small className="text-muted">+2 esta semana</small>
                </div>
                <i className="bi bi-funnel fs-1 text-primary opacity-25"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="crm-kpi-card border-start border-success border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-success text-uppercase mb-1 fw-bold">Valor Pipeline</h6>
                  <h3 className="mb-2 text-success">${totalPipelineValue.toLocaleString()}</h3>
                  <small className="text-muted">+15% mes anterior</small>
                </div>
                <i className="bi bi-currency-dollar fs-1 text-success opacity-25"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="crm-kpi-card border-start border-warning border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-warning text-uppercase mb-1 fw-bold">Tasa Conversión</h6>
                  <h3 className="mb-2 text-warning">{conversionRate}%</h3>
                  <small className="text-muted">-5% mes anterior</small>
                </div>
                <i className="bi bi-graph-up fs-1 text-warning opacity-25"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="crm-kpi-card border-start border-info border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-info text-uppercase mb-1 fw-bold">Valor Promedio</h6>
                  <h3 className="mb-2 text-info">${averageDealValue.toLocaleString()}</h3>
                  <small className="text-muted">+8% mes anterior</small>
                </div>
                <i className="bi bi-coin fs-1 text-info opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="pipeline-board">
        {[
          { stage: 'lead', title: 'Leads', icon: 'bi-person-plus', color: 'secondary' },
          { stage: 'contacted', title: 'Contactados', icon: 'bi-telephone', color: 'info' },
          { stage: 'proposal', title: 'Propuesta', icon: 'bi-file-text', color: 'warning' },
          { stage: 'client', title: 'Clientes', icon: 'bi-check-circle', color: 'success' }
        ].map(column => (
          <div key={column.stage} className="pipeline-column">
            <div className="card bg-light">
              <div className={`card-header d-flex justify-content-between align-items-center fw-bold text-${column.color}`}>
                <span>
                  <i className={`bi ${column.icon} text-${column.color} me-2`}></i>
                  {column.title}
                </span>
                <span className={`badge bg-${column.color}`}>
                  {getContactsByStage(column.stage).length}
                </span>
              </div>
              <div className="card-body">
                {getContactsByStage(column.stage).map(contact => (
                  <div 
                    key={contact.id} 
                    className={`prospect-card mb-3 ${column.stage === 'client' ? 'border-success' : ''}`} 
                    onClick={() => viewContactDetails(contact)}
                  >
                    <div className="prospect-header">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="prospect-name">{contact.company}</h6>
                          <small className="prospect-contact text-muted">
                            {contact.name} - {contact.position}
                          </small>
                        </div>
                        <span className={`prospect-value ${column.stage === 'client' ? 'text-success' : ''}`}>
                          ${contact.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="prospect-details">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          <i className="bi bi-envelope me-1"></i>{contact.email}
                        </small>
                        <small className={`prospect-source ${column.stage === 'client' ? 'text-success' : ''}`}>
                          {column.stage === 'client' ? 'Cliente' : contact.source}
                        </small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className={column.stage === 'client' ? 'text-success' : 'text-muted'}>
                          {column.stage === 'client' 
                            ? 'Contrato firmado' 
                            : `Último contacto: ${Math.floor((new Date() - contact.lastContact) / (1000 * 60 * 60 * 24))} días`
                          }
                        </small>
                        <div className={`prospect-priority ${column.stage === 'client' ? 'completed' : contact.priority}`}>
                          {column.stage === 'client' ? 'Cerrado' : contact.priority}
                        </div>
                      </div>
                    </div>
                    {column.stage === 'proposal' && (
                      <div className="prospect-progress mb-2">
                        <div className="progress" style={{height: '4px'}}>
                          <div className="progress-bar bg-warning" style={{width: '75%'}}></div>
                        </div>
                        <small className="text-muted">Probabilidad: 75%</small>
                      </div>
                    )}
                  </div>
                ))}
                
                {column.stage === 'lead' && (
                  <button className="btn btn-outline-secondary w-100 btn-sm" onClick={createNewContact}>
                    <i className="bi bi-plus-lg me-1"></i>Agregar Lead
                  </button>
                )}
                
                {column.stage === 'client' && (
                  <div className="conversion-stats p-3 bg-success-subtle rounded">
                    <div className="text-center">
                      <div className="h5 text-success mb-1">{conversionRate}%</div>
                      <small className="text-muted">Tasa de Conversión</small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Renderizar Lista de Contactos
  const renderContacts = () => (
    <div className="contacts-view">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Gestión de Contactos</h4>
          <p className="text-muted mb-0">Administra toda tu base de datos de contactos</p>
        </div>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" style={{width: 'auto'}}>
            <option>Todos los estados</option>
            <option>Lead</option>
            <option>Contactado</option>
            <option>Propuesta</option>
            <option>Cliente</option>
          </select>
          <div className="input-group" style={{width: '250px'}}>
            <input type="text" className="form-control form-control-sm" placeholder="Buscar contactos..." />
            <button className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="card contacts-table-card">
        <div className="card-header">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-people me-2"></i>Lista de Contactos
          </h6>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Contacto</th>
                <th>Empresa</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Valor Potencial</th>
                <th>Último Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img src={contact.avatar} className="rounded-circle me-3" alt={contact.name} style={{width: '40px', height: '40px'}} />
                      <div>
                        <strong>{contact.name}</strong>
                        <small className="d-block text-muted">{contact.position}</small>
                      </div>
                    </div>
                  </td>
                  <td>{contact.company}</td>
                  <td>{contact.email}</td>
                  <td>{contact.phone}</td>
                  <td>
                    <span className={`pipeline-status ${contact.stage}`}>
                      {contact.stage === 'lead' ? 'Lead' :
                       contact.stage === 'contacted' ? 'Contactado' :
                       contact.stage === 'proposal' ? 'Propuesta' :
                       'Cliente'}
                    </span>
                  </td>
                  <td>
                    <span className="fw-bold text-success">${contact.value.toLocaleString()}</span>
                  </td>
                  <td>
                    <small>{Math.floor((new Date() - contact.lastContact) / (1000 * 60 * 60 * 24))} días</small>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-primary" title="Llamar">
                        <i className="bi bi-telephone"></i>
                      </button>
                      <button className="btn btn-outline-success" title="Email">
                        <i className="bi bi-envelope"></i>
                      </button>
                      <button className="btn btn-outline-info" title="Actividad" onClick={createNewActivity}>
                        <i className="bi bi-calendar-plus"></i>
                      </button>
                      <button className="btn btn-outline-secondary" title="Editar" onClick={() => editContact(contact)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Renderizar Actividades
  const renderActivities = () => (
    <div className="activities-view">
      <div className="row">
        <div className="col-lg-8">
          <div className="card activity-timeline-card h-100">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-clock-history me-2"></i>Timeline de Actividades
              </h6>
            </div>
            <div className="card-body">
              <div className="activity-timeline">
                {activities.slice().reverse().map(activity => {
                  const contact = contacts.find(c => c.id === activity.contactId);
                  return (
                    <div key={activity.id} className="activity-item">
                      <div className={`activity-icon bg-${getActivityColor(activity.type)}`}>
                        <i className={`bi ${getActivityIcon(activity.type)} text-white`}></i>
                      </div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <strong>{activity.title}</strong>
                          <small className="text-muted">{contact ? contact.company : 'Empresa desconocida'}</small>
                        </div>
                        <p className="activity-description">{activity.description}</p>
                        <div className="activity-meta">
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {activity.date.toLocaleDateString('es-ES')} • {activity.date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                            {activity.duration && ` • Duración: ${activity.duration} min`}
                          </small>
                          <span className={`badge bg-${activity.completed ? 'success' : 'warning'} ms-2`}>
                            {activity.completed ? 'Completada' : 'Programada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card upcoming-activities-card">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">Próximas Actividades</h6>
            </div>
            <div className="card-body">
              {activities.filter(a => !a.completed && new Date(a.date) > new Date()).map(activity => {
                const contact = contacts.find(c => c.id === activity.contactId);
                return (
                  <div key={activity.id} className="upcoming-activity mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong>{activity.title}</strong>
                        <small className="d-block text-muted">{contact ? contact.company : 'Empresa'}</small>
                      </div>
                      <small className="text-warning fw-bold">
                        {activity.date.toLocaleDateString('es-ES')}
                      </small>
                    </div>
                    <hr className="my-2" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="crm-page">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">CRM - Gestión de Clientes</h1>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={createNewContact}>
            <i className="bi bi-person-plus me-1"></i>Nuevo Contacto
          </button>
          <button className="btn btn-outline-primary" onClick={createNewActivity}>
            <i className="bi bi-plus-lg me-1"></i>Nueva Actividad
          </button>
        </div>
      </div>

      {/* Tabs del CRM */}
      <ul className="nav nav-pills mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            <i className="bi bi-funnel me-2"></i>Pipeline
            <span className="badge bg-light text-primary ms-1">{activeOpportunities}</span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <i className="bi bi-people me-2"></i>Contactos
            <span className="badge bg-light text-success ms-1">{totalContacts}</span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            <i className="bi bi-calendar-check me-2"></i>Actividades
            <span className="badge bg-light text-info ms-1">{activities.length}</span>
          </button>
        </li>
      </ul>

      {/* Contenido de las tabs */}
      <div className="tab-content">
        {activeTab === 'pipeline' && renderPipeline()}
        {activeTab === 'contacts' && renderContacts()}
        {activeTab === 'activities' && renderActivities()}
      </div>

      {/* Modales reutilizables */}
      <ContactModal
        show={showContactModal}
        onHide={() => {
          setShowContactModal(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        contact={editingContact}
        title={editingContact ? "Editar Contacto" : "Nuevo Contacto"}
      />

      <ActivityModal
        show={showActivityModal}
        onHide={() => {
          setShowActivityModal(false);
          setEditingActivity(null);
        }}
        onSave={handleSaveActivity}
        contacts={contacts}
        activity={editingActivity}
        title={editingActivity ? "Editar Actividad" : "Nueva Actividad"}
      />

      {/* Modal para detalles de contacto (simplificado) */}
      {showDetailModal && selectedContact && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-circle me-2"></i>Detalle del Contacto
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-4">
                    <div className="card prospect-info-card h-100">
                      <div className="card-body text-center">
                        <img src={selectedContact.avatar} className="rounded-circle mb-3" alt="Avatar" style={{width: '80px', height: '80px'}} />
                        <h5 className="prospect-modal-name">{selectedContact.name}</h5>
                        <p className="text-muted prospect-modal-title">{selectedContact.position} - {selectedContact.company}</p>
                        <div className="prospect-modal-status mb-3">
                          <span className={`pipeline-status ${selectedContact.stage}`}>
                            {selectedContact.stage === 'lead' ? 'Lead' :
                             selectedContact.stage === 'contacted' ? 'Contactado' :
                             selectedContact.stage === 'proposal' ? 'Propuesta' :
                             'Cliente'}
                          </span>
                        </div>
                        <div className="prospect-modal-value mb-3">
                          <div className="h4 text-success">${selectedContact.value.toLocaleString()}</div>
                          <small className="text-muted">Valor Potencial</small>
                        </div>
                        <div className="contact-details text-start">
                          <div className="mb-2">
                            <i className="bi bi-envelope text-muted me-2"></i>
                            <small>{selectedContact.email}</small>
                          </div>
                          <div className="mb-2">
                            <i className="bi bi-telephone text-muted me-2"></i>
                            <small>{selectedContact.phone}</small>
                          </div>
                          <div className="mb-2">
                            <i className="bi bi-building text-muted me-2"></i>
                            <small>{selectedContact.company}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Notas y Actividades</h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <strong>Notas:</strong>
                          <p className="mt-2">{selectedContact.notes || 'Sin notas adicionales'}</p>
                        </div>
                        <div>
                          <strong>Actividades Relacionadas:</strong>
                          <div className="mt-2">
                            {activities.filter(a => a.contactId === selectedContact.id).map(activity => (
                              <div key={activity.id} className="border rounded p-2 mb-2">
                                <div className="d-flex justify-content-between">
                                  <strong>{activity.title}</strong>
                                  <small>{activity.date.toLocaleDateString('es-ES')}</small>
                                </div>
                                <p className="mb-0 small text-muted">{activity.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Cerrar
                </button>
                <button type="button" className="btn btn-primary" onClick={() => editContact(selectedContact)}>
                  <i className="bi bi-pencil me-1"></i>Editar Contacto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMPage;