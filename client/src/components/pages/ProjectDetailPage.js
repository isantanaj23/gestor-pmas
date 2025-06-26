import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Componentes de las pestañas
import KanbanBoard from '../project-tabs/KanbanBoard';
import ProjectCommunication from '../project-tabs/ProjectCommunication';
import ProjectSocial from '../project-tabs/ProjectSocial';
import ProjectReports from '../project-tabs/ProjectReports';

function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tablero');
  
  // Estados para datos dinámicos
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ⭐ NUEVOS ESTADOS PARA GESTIÓN DE EQUIPO
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [newMemberData, setNewMemberData] = useState({ userId: '', role: 'viewer' });

  // 🔥 FUNCIÓN PARA CARGAR PROYECTO DINÁMICAMENTE
  const loadProject = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Cargando proyecto con ID:', projectId);
      
      // 🎯 Mapeo de IDs a datos reales (luego conectarás con API)
      const projectsData = {
        'proyecto-alpha': {
          _id: 'proyecto-alpha',
          name: 'Proyecto Alpha',
          description: 'Sistema de gestión empresarial con módulos de CRM y facturación',
          status: 'active',
          progress: 75,
          team: [
            { _id: '1', name: 'Ana García', role: 'Developer', avatar: null, email: 'ana@empresa.com' },
            { _id: '2', name: 'Carlos López', role: 'Manager', avatar: null, email: 'carlos@empresa.com' },
            { _id: '3', name: 'Laura Martín', role: 'Designer', avatar: null, email: 'laura@empresa.com' }
          ]
        },
        'ecommerce-beta': {
          _id: 'ecommerce-beta',
          name: 'E-commerce Beta',
          description: 'Plataforma de comercio electrónico con sistema de pagos',
          status: 'active',
          progress: 45,
          team: [
            { _id: '4', name: 'María Sánchez', role: 'Developer', avatar: null, email: 'maria@empresa.com' },
            { _id: '5', name: 'Diego Ruiz', role: 'Manager', avatar: null, email: 'diego@empresa.com' }
          ]
        },
        'app-movil': {
          _id: 'app-movil',
          name: 'App Móvil',
          description: 'Aplicación móvil multiplataforma con React Native',
          status: 'active',
          progress: 95,
          team: [
            { _id: '6', name: 'Sofia Herrera', role: 'Developer', avatar: null, email: 'sofia@empresa.com' },
            { _id: '7', name: 'Juan Pablo', role: 'Designer', avatar: null, email: 'juan@empresa.com' }
          ]
        },
        'marketing-q3': {
          _id: 'marketing-q3',
          name: 'Marketing Q3',
          description: 'Campaña de marketing digital para el tercer trimestre',
          status: 'planning',
          progress: 25,
          team: [
            { _id: '8', name: 'Carmen Torres', role: 'Manager', avatar: null, email: 'carmen@empresa.com' },
            { _id: '9', name: 'Roberto Vega', role: 'Designer', avatar: null, email: 'roberto@empresa.com' }
          ]
        }
      };

      console.log('📂 IDs disponibles:', Object.keys(projectsData));
      
      const projectData = projectsData[projectId];
      
      if (!projectData) {
        console.error(`❌ Proyecto no encontrado para ID: ${projectId}`);
        console.error('📂 IDs disponibles:', Object.keys(projectsData));
        throw new Error(`Proyecto no encontrado: ${projectId}`);
      }
      
      console.log('✅ Proyecto encontrado:', projectData.name);

      setProject(projectData);
      
      // Tareas específicas por proyecto
      const tasksData = {
        'proyecto-alpha': [
          { _id: '1', title: 'Configurar autenticación', status: 'completed', project: projectId },
          { _id: '2', title: 'Diseñar UI/UX', status: 'in-progress', project: projectId },
          { _id: '3', title: 'Implementar API REST', status: 'pending', project: projectId },
          { _id: '4', title: 'Testing integración', status: 'completed', project: projectId }
        ],
        'ecommerce-beta': [
          { _id: '5', title: 'Pasarela de pagos', status: 'in-progress', project: projectId },
          { _id: '6', title: 'Catálogo productos', status: 'completed', project: projectId },
          { _id: '7', title: 'Carrito compras', status: 'pending', project: projectId }
        ],
        'app-movil': [
          { _id: '8', title: 'Publicar en stores', status: 'in-progress', project: projectId },
          { _id: '9', title: 'Testing final', status: 'completed', project: projectId }
        ]
      };

      setTasks(tasksData[projectId] || []);
      
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar proyecto:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CARGAR USUARIOS DISPONIBLES PARA AGREGAR AL EQUIPO
  const loadAvailableUsers = async () => {
    try {
      const users = [
        { _id: '8', name: 'Roberto Vega', email: 'roberto@empresa.com', avatar: null },
        { _id: '9', name: 'Carmen Torres', email: 'carmen@empresa.com', avatar: null },
        { _id: '10', name: 'Fernando Ruiz', email: 'fernando@empresa.com', avatar: null },
        { _id: '11', name: 'Patricia Luna', email: 'patricia@empresa.com', avatar: null }
      ];
      
      // Filtrar usuarios que NO están ya en el equipo
      const currentTeamIds = project.team.map(member => member._id);
      const available = users.filter(user => !currentTeamIds.includes(user._id));
      
      setAvailableUsers(available);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  // 🔥 AGREGAR MIEMBRO AL EQUIPO
  const handleAddMember = async () => {
    try {
      if (!newMemberData.userId) {
        alert('Por favor selecciona un usuario');
        return;
      }

      const selectedUser = availableUsers.find(user => user._id === newMemberData.userId);
      
      if (!selectedUser) {
        alert('Usuario no encontrado');
        return;
      }

      // Agregar al equipo (aquí luego conectarás con la API POST /api/projects/:id/team)
      const newMember = {
        ...selectedUser,
        role: newMemberData.role
      };

      setProject(prev => ({
        ...prev,
        team: [...prev.team, newMember]
      }));

      // Cerrar modal y limpiar formulario
      setShowAddMemberModal(false);
      setNewMemberData({ userId: '', role: 'viewer' });
      
      console.log('✅ Miembro agregado:', newMember);
      
    } catch (err) {
      console.error('Error al agregar miembro:', err);
      alert('Error al agregar miembro al equipo');
    }
  };

  // 🔥 REMOVER MIEMBRO DEL EQUIPO
  const handleRemoveMember = async (memberId) => {
    try {
      if (window.confirm('¿Estás seguro de que quieres remover este miembro del equipo?')) {
        setProject(prev => ({
          ...prev,
          team: prev.team.filter(member => member._id !== memberId)
        }));
        
        console.log('✅ Miembro removido:', memberId);
      }
    } catch (err) {
      console.error('Error al remover miembro:', err);
      alert('Error al remover miembro del equipo');
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Cargar usuarios disponibles cuando se abra el modal
  useEffect(() => {
    if (showAddMemberModal && project) {
      loadAvailableUsers();
    }
  }, [showAddMemberModal, project]);

  // Calcular progreso basado en tareas
  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const tabs = [
    { id: 'tablero', label: 'Tablero', icon: 'bi-kanban' },
    { id: 'comunicacion', label: 'Comunicación', icon: 'bi-chat-left-dots-fill' },
    { id: 'social', label: 'Calendario Social', icon: 'bi-calendar-event' },
    { id: 'reportes', label: 'Reportes', icon: 'bi-file-earmark-text' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tablero':
        return <KanbanBoard projectId={projectId} project={project} tasks={tasks} onTasksUpdate={setTasks} />;
      case 'comunicacion':
        return <ProjectCommunication projectId={projectId} project={project} />;
      case 'social':
        return <ProjectSocial projectId={projectId} project={project} />;
      case 'reportes':
        return <ProjectReports projectId={projectId} project={project} tasks={tasks} />;
      default:
        return <KanbanBoard projectId={projectId} project={project} tasks={tasks} onTasksUpdate={setTasks} />;
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={() => navigate('/proyectos')}>
            Volver a Proyectos
          </button>
        </div>
      </div>
    );
  }

  // Mostrar proyecto no encontrado
  if (!project) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Proyecto no encontrado</h4>
          <p>El proyecto que buscas no existe o no tienes permisos para verlo.</p>
          <button className="btn btn-outline-warning" onClick={() => navigate('/proyectos')}>
            Volver a Proyectos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header dinámico */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <div>
          <h1 className="h2">{project.name}</h1>
          <p className="text-muted mb-0">{project.description}</p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate('/proyectos')}
          >
            <i className="bi bi-arrow-left"></i> Volver a Proyectos
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => setShowAddMemberModal(true)}
          >
            <i className="bi bi-person-plus"></i> Agregar Miembro
          </button>
        </div>
      </div>

      {/* 🔥 INFORMACIÓN DEL PROYECTO Y EQUIPO */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Información del Proyecto</h5>
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted">Estado</small>
                  <p className="mb-2">
                    <span className={`badge ${project.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                      {project.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Progreso</small>
                  <p className="mb-2">{calculateProgress()}% completado</p>
                </div>
                <div className="col-md-4">
                  <small className="text-muted">Tareas totales</small>
                  <p className="mb-2">{tasks.length} tareas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Equipo ({project.team.length})</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
              
              <div className="team-members">
                {project.team.map(member => (
                  <div key={member._id} className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                        style={{ width: '32px', height: '32px', fontSize: '12px' }}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="fw-medium" style={{ fontSize: '14px' }}>{member.name}</div>
                        <small className="text-muted">{member.role}</small>
                      </div>
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemoveMember(member._id)}
                      title="Remover del equipo"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <ul className="nav nav-tabs mt-2" role="tablist">
        {tabs.map(tab => (
          <li key={tab.id} className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              role="tab"
            >
              <i className={`bi ${tab.icon} me-1`}></i> {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Contenido de las Pestañas */}
      <div className="tab-content pt-4">
        {renderTabContent()}
      </div>

      {/* 🔥 MODAL PARA AGREGAR MIEMBRO */}
      {showAddMemberModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agregar Miembro al Equipo</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddMemberModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Seleccionar Usuario</label>
                    <select 
                      className="form-select"
                      value={newMemberData.userId}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, userId: e.target.value }))}
                    >
                      <option value="">-- Selecciona un usuario --</option>
                      {availableUsers.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Rol en el Proyecto</label>
                    <select 
                      className="form-select"
                      value={newMemberData.role}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="viewer">Viewer - Solo lectura</option>
                      <option value="collaborator">Collaborator - Puede editar tareas</option>
                      <option value="manager">Manager - Gestión completa</option>
                      <option value="admin">Admin - Control total</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddMemberModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddMember}
                >
                  Agregar al Equipo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailPage;