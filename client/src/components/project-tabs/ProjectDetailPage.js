
import React, { useState } from 'react';
import ProjectKanban from './ProjectKanban';
import ProjectCommunication from './ProjectCommunication';
import ProjectSocial from './ProjectSocial';
import ProjectReports from './ProjectReports';
const ProjectDetailPage = ({ projectName = "Proyecto Alpha" }) => {
const [activeTab, setActiveTab] = useState('tablero');
const renderTabContent = () => {
switch (activeTab) {
case 'tablero':
return <ProjectKanban />;
case 'comunicacion':
return <ProjectCommunication />;
case 'social':
return <ProjectSocial />;
case 'reportes':
return <ProjectReports />;
default:
return <ProjectKanban />;
}
};
return (
<div className="container-fluid p-4">
{/* Header */}
<div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
<h1 className="h2">Detalles del {projectName}</h1>
<button
type="button"
className="btn btn-outline-secondary"
onClick={() => window.history.back()}
>
<i className="bi bi-arrow-left"></i> Volver a Proyectos
</button>
</div>
  {/* Pestañas de Navegación */}
  <ul className="nav nav-tabs mt-2" role="tablist">
    <li className="nav-item" role="presentation">
      <button
        className={`nav-link ${activeTab === 'tablero' ? 'active' : ''}`}
        onClick={() => setActiveTab('tablero')}
        type="button"
        role="tab"
      >
        <i className="bi bi-kanban me-1"></i> Tablero
      </button>
    </li>
    <li className="nav-item" role="presentation">
      <button
        className={`nav-link ${activeTab === 'comunicacion' ? 'active' : ''}`}
        onClick={() => setActiveTab('comunicacion')}
        type="button"
        role="tab"
      >
        <i className="bi bi-chat-left-dots-fill me-1"></i> Comunicación
      </button>
    </li>
    <li className="nav-item" role="presentation">
      <button
        className={`nav-link ${activeTab === 'social' ? 'active' : ''}`}
        onClick={() => setActiveTab('social')}
        type="button"
        role="tab"
      >
        <i className="bi bi-calendar-event me-1"></i> Calendario Social
      </button>
    </li>
    <li className="nav-item" role="presentation">
      <button
        className={`nav-link ${activeTab === 'reportes' ? 'active' : ''}`}
        onClick={() => setActiveTab('reportes')}
        type="button"
        role="tab"
      >
        <i className="bi bi-file-earmark-text me-1"></i> Reportes
      </button>
    </li>
  </ul>

  {/* Contenido de las Pestañas */}
  <div className="tab-content pt-4">
    {renderTabContent()}
  </div>
</div>
);
};
export default ProjectDetailPage;