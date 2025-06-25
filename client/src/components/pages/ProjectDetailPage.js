import React, { useState } from 'react';
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

  // Datos del proyecto (simulados)
  const projectData = {
    'proyecto-alpha': {
      name: 'Proyecto Alpha',
      description: 'Sistema de gestión empresarial',
      progress: 75,
      members: 5,
      tasks: 14
    },
    'ecommerce-beta': {
      name: 'E-commerce Beta', 
      description: 'Plataforma de comercio electrónico',
      progress: 45,
      members: 3,
      tasks: 8
    }
  };

  const project = projectData[projectId] || projectData['proyecto-alpha'];

  const tabs = [
    { id: 'tablero', label: 'Tablero', icon: 'bi-kanban' },
    { id: 'comunicacion', label: 'Comunicación', icon: 'bi-chat-left-dots-fill' },
    { id: 'social', label: 'Calendario Social', icon: 'bi-calendar-event' },
    { id: 'reportes', label: 'Reportes', icon: 'bi-file-earmark-text' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tablero':
        return <KanbanBoard projectId={projectId} />;
      case 'comunicacion':
        return <ProjectCommunication projectId={projectId} />;
      case 'social':
        return <ProjectSocial projectId={projectId} />;
      case 'reportes':
        return <ProjectReports projectId={projectId} />;
      default:
        return <KanbanBoard projectId={projectId} />;
    }
  };

  return (
    <div>
      {/* Header del Proyecto */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-2">
            <button 
              className="btn btn-outline-secondary me-3"
              onClick={() => navigate('/proyectos')}
            >
              <i className="bi bi-arrow-left"></i> Volver a Proyectos
            </button>
            <h1 className="h2 mb-0">{project.name}</h1>
          </div>
          <p className="text-muted">{project.description}</p>
        </div>
        <div className="d-flex gap-2">
          <span className="badge bg-success fs-6">{project.progress}% completado</span>
          <span className="badge bg-primary fs-6">{project.members} miembros</span>
          <span className="badge bg-secondary fs-6">{project.tasks} tareas</span>
        </div>
      </div>

      {/* Pestañas de Navegación del Proyecto */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        {tabs.map((tab) => (
          <li key={tab.id} className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              role="tab"
            >
              <i className={`bi ${tab.icon} me-2`}></i>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Contenido de la Pestaña Activa */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ProjectDetailPage;