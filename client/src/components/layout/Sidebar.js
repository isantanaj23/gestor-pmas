import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      icon: 'bi-grid-1x2-fill',
      label: 'Dashboard',
      roles: ['admin', 'manager', 'developer', 'designer', 'client']
    },
    {
      path: '/proyectos',
      icon: 'bi-folder-fill',
      label: 'Proyectos',
      roles: ['admin', 'manager', 'developer', 'designer']
    },
    {
      path: '/crm',
      icon: 'bi-people-fill',
      label: 'CRM',
      roles: ['admin', 'manager']
    },
    {
      path: '/reportes',
      icon: 'bi-graph-up',
      label: 'Reportes y Analíticas',
      roles: ['admin', 'manager']
    }
  ];

  // Filtrar elementos del menú según el rol del usuario
  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div 
      className="offcanvas-lg offcanvas-start bg-white shadow-sm" 
      id="sidebar"
      style={{ width: '280px' }}
    >
      <div className="offcanvas-header d-lg-none border-bottom">
        <h5 className="offcanvas-title text-primary fw-bold">
          <i className="bi bi-kanban me-2"></i>
          Planifica+
        </h5>
        <button 
          type="button" 
          className="btn-close" 
          data-bs-dismiss="offcanvas" 
          data-bs-target="#sidebar"
        ></button>
      </div>

      <div className="offcanvas-body d-flex flex-column p-0">
        {/* Información del usuario (solo móvil) */}
        <div className="d-lg-none p-3 border-bottom">
          <div className="d-flex align-items-center">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Usuario')}&background=6f42c1&color=fff&size=50`}
              alt="Avatar"
              className="rounded-circle me-3"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
            <div>
              <div className="fw-bold">{user?.name || 'Usuario'}</div>
              <div className="text-muted small">{user?.email || 'Sin email'}</div>
              <span className={`badge badge-sm mt-1 ${
                user?.role === 'admin' ? 'bg-danger' :
                user?.role === 'manager' ? 'bg-warning' :
                'bg-primary'
              }`}>
                {user?.role || 'Sin rol'}
              </span>
            </div>
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="flex-grow-1 p-3">
          <ul className="nav flex-column">
            {filteredMenuItems.map((item) => (
              <li className="nav-item mb-1" key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center p-3 rounded transition ${
                      isActive
                        ? 'active bg-primary text-white shadow-sm'
                        : 'text-dark hover-bg-light'
                    }`
                  }
                  end={item.path === '/'}
                >
                  <i className={`bi ${item.icon} me-3 fs-5`}></i>
                  <span className="fw-medium">{item.label}</span>
                  
                  {/* Indicadores adicionales */}
                  {item.path === '/crm' && (
                    <span className="badge bg-danger ms-auto">5</span>
                  )}
                  {item.path === '/proyectos' && (
                    <span className="badge bg-warning ms-auto">2</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sección del equipo */}
        <div className="p-3 border-top bg-light">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="text-muted small text-uppercase mb-0 fw-bold">
              <i className="bi bi-people-fill me-2"></i>
              Mi Equipo
            </h6>
            <span className="badge bg-success">3 online</span>
          </div>

          {/* Lista del equipo */}
          <div className="team-list">
            {/* Miembro 1 */}
            <div className="d-flex align-items-center mb-2 p-2 rounded hover-bg-white">
              <div className="position-relative me-2">
                <img
                  src="https://ui-avatars.com/api/?name=Ana García&background=28a745&color=fff&size=32"
                  className="rounded-circle"
                  style={{ width: '32px', height: '32px' }}
                  alt="Ana García"
                />
                <span 
                  className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white"
                  style={{ width: '10px', height: '10px' }}
                ></span>
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="fw-medium small">Ana García</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Frontend Dev</div>
              </div>
              <button className="btn btn-sm btn-outline-primary btn-circle">
                <i className="bi bi-chat-dots" style={{ fontSize: '0.8rem' }}></i>
              </button>
            </div>

            {/* Miembro 2 */}
            <div className="d-flex align-items-center mb-2 p-2 rounded hover-bg-white">
              <div className="position-relative me-2">
                <img
                  src="https://ui-avatars.com/api/?name=Carlos López&background=ffc107&color=000&size=32"
                  className="rounded-circle"
                  style={{ width: '32px', height: '32px' }}
                  alt="Carlos López"
                />
                <span 
                  className="position-absolute bottom-0 end-0 bg-warning rounded-circle border border-white"
                  style={{ width: '10px', height: '10px' }}
                ></span>
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="fw-medium small">Carlos López</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Project Manager</div>
              </div>
              <button className="btn btn-sm btn-outline-warning btn-circle">
                <i className="bi bi-chat-dots" style={{ fontSize: '0.8rem' }}></i>
              </button>
            </div>

            {/* Miembro 3 */}
            <div className="d-flex align-items-center mb-2 p-2 rounded hover-bg-white">
              <div className="position-relative me-2">
                <img
                  src="https://ui-avatars.com/api/?name=Laura Martín&background=e83e8c&color=fff&size=32"
                  className="rounded-circle"
                  style={{ width: '32px', height: '32px' }}
                  alt="Laura Martín"
                />
                <span 
                  className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white"
                  style={{ width: '10px', height: '10px' }}
                ></span>
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="fw-medium small">Laura Martín</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>UI/UX Designer</div>
              </div>
              <button className="btn btn-sm btn-outline-primary btn-circle">
                <i className="bi bi-chat-dots" style={{ fontSize: '0.8rem' }}></i>
              </button>
            </div>
          </div>

          {/* Botón de chat grupal */}
          <button className="btn btn-primary btn-sm w-100 mt-2">
            <i className="bi bi-chat-square-text me-2"></i>
            Chat Grupal
          </button>
        </div>

        {/* Información adicional del usuario */}
        <div className="p-3 bg-primary text-white text-center">
          <div className="small">
            <i className="bi bi-shield-check me-1"></i>
            Conectado como {user?.role || 'Usuario'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;