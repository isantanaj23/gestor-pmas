import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/Dashboard';
import ProjectsPage from './components/pages/ProjectsPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/proyectos" element={<ProjectsPage />} />
          <Route path="/comunicacion" element={<div><h2>Comunicación</h2><p>Próximamente...</p></div>} />
          <Route path="/social" element={<div><h2>Redes Sociales</h2><p>Próximamente...</p></div>} />
          <Route path="/cliente" element={<div><h2>Portal de Cliente</h2><p>Próximamente...</p></div>} />
          <Route path="/reportes" element={<div><h2>Reportes</h2><p>Próximamente...</p></div>} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;