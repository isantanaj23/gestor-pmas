import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Context de autenticación (corregido: context no contexts)
import { AuthProvider } from './context/AuthContext';
// Componentes de autenticación (corregido: están en auth/ no en common/)
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
// Layout principal
import MainLayout from './components/layout/MainLayout';
// Páginas principales
import Dashboard from './components/Dashboard';
import ProjectsPage from './components/pages/ProjectsPage';
import ProjectDetailPage from './components/pages/ProjectDetailPage';
import CRMPage from './components/pages/CRMPage';
import ReportsPage from './components/pages/ReportsPage';
// Estilos
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
function App() {
return (
<AuthProvider>
<Router>
<div className="App">
<Routes>
{/* Rutas de Autenticación (públicas) */}
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
        {/* Rutas principales (protegidas) */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/proyectos" element={
          <ProtectedRoute>
            <MainLayout>
              <ProjectsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/proyecto/:projectId" element={
          <ProtectedRoute>
            <MainLayout>
              <ProjectDetailPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/crm" element={
          <ProtectedRoute>
            <MainLayout>
              <CRMPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/reportes" element={
          <ProtectedRoute>
            <MainLayout>
              <ReportsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Rutas adicionales para roles específicos */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole={['admin', 'manager']}>
            <MainLayout>
              <div className="container mt-4">
                <h1>Panel de Administración</h1>
                <p>Esta página solo es accesible para administradores y managers.</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Redirección de rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  </Router>
</AuthProvider>
);
}
export default App;