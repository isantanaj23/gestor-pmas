// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context de autenticación y sockets
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext'; // 🆕 NUEVO

// Componentes de autenticación
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
import SimpleChatPage from './components/pages/SimpleChatPage';
import RealtimeChatPage from './components/pages/RealtimeChatPage';
import EnhancedRealtimeChatPage from './components/pages/EnhancedRealtimeChatPage';
import GlobalNotificationsChatPage from './components/pages/GlobalNotificationsChatPage';





// 🆕 Componente de notificaciones en tiempo real
import SocketNotifications from './components/common/SocketNotifications';

// 🆕 Componente de notificaciones en tiempo real
import SocketNotifications from './components/common/SocketNotifications';

// Estilos
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider> {/* 🆕 NUEVO: Envolver toda la app con SocketProvider */}
        <Router>
          <div className="App">
            {/* 🆕 Componente de notificaciones que se muestra en toda la app */}
            <SocketNotifications />
            
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
              
              <Route path="/proyectos/:projectId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ProjectDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/simple-chat/:projectId" element={<SimpleChatPage />} />
              <Route path="/realtime-chat/:projectId" element={<RealtimeChatPage />} />
              <Route path="/enhanced-chat/:projectId" element={<EnhancedRealtimeChatPage />} />
              <Route path="/global-chat/:projectId" element={<GlobalNotificationsChatPage />} />



              
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
              
              {/* Redireccionar rutas no encontradas */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;