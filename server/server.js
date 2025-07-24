// server/server.js
const express = require("express");
const cors = require('cors');
const path = require('path');
const http = require('http');
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const connectDB = require("./config/database");

// Importar rutas
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const contactRoutes = require('./routes/contacts');
const activityRoutes = require('./routes/activities');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const socialPostRoutes = require('./routes/socialPostRoutes'); // 🆕 NUEVA RUTA

// Socket.io
const SocketHandler = require('./socket/socketHandler');

// Cargar variables de entorno
require("dotenv").config();

// Crear aplicación Express
const app = express();

// Crear servidor HTTP para Socket.io
const server = http.createServer(app);

// =================================================================
// CONFIGURAR SOCKET.IO
// =================================================================
const socketHandler = new SocketHandler(server);
app.set('socketHandler', socketHandler);

// =================================================================
// MIDDLEWARE
// =================================================================

// Seguridad básica
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Compresión
app.use(compression());

// 🔥 CORS CORREGIDO - INCLUIR PATCH
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"]
  })
);

// Logging en desarrollo
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Parser para JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// =================================================================
// RUTAS
// =================================================================

// Ruta principal - API info
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Planifica+ API funcionando correctamente",
    version: "1.0.0",
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    endpoints: {
      health: "/health",
      api: "/api",
      auth: "/api/auth",
      projects: "/api/projects",
      tasks: "/api/tasks",
      contacts: "/api/contacts",
      activities: "/api/activities",
      dashboard: "/api/dashboard",
      notifications: "/api/notifications",
      socialPosts: "/api/social-posts" // 🆕 NUEVA RUTA
    },
  });
});

// Ruta de health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
    },
    connections: {
      activeConnections: socketHandler.getConnectionStats()
    }
  });
});

// Ruta de prueba para el API
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API endpoints funcionando",
    availableRoutes: [
      "GET /",
      "GET /health",
      "GET /api",
      "POST /api/auth/login",
      "GET /api/projects",
      "GET /api/social-posts/project/:projectId" // 🆕 NUEVA RUTA
    ],
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/social-posts', socialPostRoutes); // 🆕 NUEVA RUTA

// =================================================================
// MANEJO DE ERRORES
// =================================================================

// Ruta no encontrada
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: ["/", "/health", "/api"],
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: "Error interno del servidor",
    error:
      process.env.NODE_ENV === "development"
        ? {
            message: err.message,
            stack: err.stack,
          }
        : {},
  });
});

// =================================================================
// INICIAR SERVIDOR
// =================================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🚀 PLANIFICA+ SERVER INICIADO");
  console.log("=".repeat(50));
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔧 Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`⏰ Iniciado: ${new Date().toLocaleString("es-ES")}`);
  console.log("=".repeat(50));
  console.log(`🔔 Sistema de notificaciones activo`);
  console.log(`📱 Socket.io configurado para tiempo real`);
  console.log(`📅 Rutas de Social Posts disponibles`);
  console.log("✅ Servidor listo para recibir requests");
  console.log("✅ CORS configurado para métodos: GET, POST, PUT, DELETE, PATCH, OPTIONS");
  console.log("");
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err, promise) => {
  console.log('Error no manejado:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("🛑 Señal SIGTERM recibida, cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n🛑 Señal SIGINT recibida, cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado correctamente");
    process.exit(0);
  });
});

// Conectar a MongoDB
connectDB();