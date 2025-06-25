import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
    { path: '/proyectos', icon: 'bi-folder-fill', label: 'Proyectos' },
    { path: '/crm', icon: 'bi-people-fill', label: 'CRM' },
    { path: '/reportes', icon: 'bi-graph-up', label: 'Reportes y Analíticas' },
  ];

  const teamMembers = [
    { name: 'Carlos López', role: 'Project Manager', avatar: 'C', status: 'online' },
    { name: 'Ana García', role: 'Developer', avatar: 'A', status: 'online' },
    { name: 'Miguel Torres', role: 'QA Tester', avatar: 'M', status: 'offline' },
  ];

  return (
    <nav className="sidebar" style={{ 
      width: '260px', 
      position: 'fixed', 
      top: '70px', 
      left: 0, 
      bottom: 0, 
      backgroundColor: 'white',
      boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
      zIndex: 1000
    }}>
      <div className="position-sticky pt-3">
        <ul className="nav flex-column">
          {menuItems.map((item, index) => (
            <li key={index} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                style={{
                  color: location.pathname === item.path ? '#3001ff' : '#6c757d',
                  fontWeight: 500,
                  padding: '0.9rem 1.5rem',
                  backgroundColor: location.pathname === item.path ? '#e9e7ff' : 'transparent',
                  borderRight: location.pathname === item.path ? '3px solid #3001ff' : '3px solid transparent'
                }}
              >
                <i className={`bi ${item.icon} me-3`}></i>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Sección de Equipo Online */}
        <div className="mt-4">
          <h6 className="text-muted small text-uppercase px-3 mb-3">Equipo Online</h6>
          <ul className="nav flex-column">
            {teamMembers.map((member, index) => (
              <li key={index} className="px-3 mb-2">
                <div className="d-flex align-items-center">
                  <img 
                    src={`https://placehold.co/32x32/${member.status === 'online' ? '28a745' : '6c757d'}/FFFFFF?text=${member.avatar}`}
                    alt={`Avatar ${member.name}`}
                    className="rounded-circle me-2"
                  />
                  <div className="flex-grow-1">
                    <div className="small fw-bold">{member.name}</div>
                    <div className="small text-muted">{member.role}</div>
                  </div>
                  <span 
                    className={`badge ${member.status === 'online' ? 'bg-success' : 'bg-secondary'}`}
                    style={{ width: '8px', height: '8px', borderRadius: '50%' }}
                  ></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;