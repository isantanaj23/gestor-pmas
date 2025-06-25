import React from 'react';

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top border-bottom">
      <div className="container-fluid">
        <a className="navbar-brand" href="#" style={{ color: '#3001ff', fontWeight: 800 }}>
          Planifica+
        </a>
        <form className="d-flex mx-auto">
          <input
            className="form-control me-2"
            type="search"
            placeholder="Buscar proyectos, tareas, personas..."
            aria-label="Buscar"
            style={{ width: '400px' }}
          />
        </form>
        <div className="d-flex align-items-center">
          <a href="#" className="text-secondary me-3 fs-5">
            <i className="bi bi-bell-fill"></i>
          </a>
          <img
            src="https://placehold.co/40x40/964ef9/white?text=U"
            alt="Avatar de usuario"
            className="rounded-circle"
            style={{ border: '2px solid #3001ff' }}
          />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;