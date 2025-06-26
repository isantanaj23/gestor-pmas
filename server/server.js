// Importar dependencias
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const connectDB = require("./config/database");

// Cargar variables de entorno
require("dotenv").config();

// Crear aplicación Express
const app = express();

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

// CORS - permitir requests desde el frontend
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
  });
});

// Ruta de prueba para el API
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API endpoints funcionando",
    availableRoutes: ["GET /", "GET /health", "GET /api"],
  });
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/contacts', require('./routes/contacts'));   
app.use('/api/activities', require('./routes/activities'))
app.use('/api/dashboard', require('./routes/dashboard'));


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

const server = app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🚀 PLANIFICA+ SERVER INICIADO");
  console.log("=".repeat(50));
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔧 Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`⏰ Iniciado: ${new Date().toLocaleString("es-ES")}`);
  console.log("=".repeat(50));
  console.log("✅ Servidor listo para recibir requests");
  console.log("");
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
