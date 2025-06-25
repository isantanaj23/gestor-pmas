import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/Dashboard';
import ProjectsPage from './components/pages/ProjectsPage';
import ProjectDetailPage from './components/pages/ProjectDetailPage';
import CRMPage from './components/pages/CRMPage';
import ReportsPage from './components/pages/ReportsPage';
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
          <Route path="/proyecto/:projectId" element={<ProjectDetailPage />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/reportes" element={<ReportsPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;