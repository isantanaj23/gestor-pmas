const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');
require('dotenv').config();
// Importar rutas
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const contactRoutes = require('./routes/contacts');
const activityRoutes = require('./routes/activities');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const app = express();
// Helmet para seguridad HTTP
app.use(helmet({
crossOriginEmbedderPolicy: false,
contentSecurityPolicy: {
directives: {
defaultSrc: ["'self'"],
styleSrc: ["'self'", "'unsafe-inline'"],
scriptSrc: ["'self'"],
imgSrc: ["'self'", "data:", "https:"],
},
},
}));
// Configuración CORS
const corsOptions = {
origin: [
'http://localhost:3000',
'http://127.0.0.1:3000',
process.env.CLIENT_URL || 'http://localhost:3000'
],
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
allowedHeaders: [
'Content-Type',
'Authorization',
'X-Requested-With',
'Accept',
'Origin',
'Cache-Control',
'Pragma'
],
credentials: true,
optionsSuccessStatus: 200,
preflightContinue: false
};
app.use(cors(corsOptions));
// Manejar preflight requests
app.options('', (req, res) => {
res.header('Access-Control-Allow-Origin', req.headers.origin || '');
res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,Pragma');
res.header('Access-Control-Allow-Credentials', 'true');
res.header('Access-Control-Max-Age', '86400');
res.sendStatus(200);
});
// Compression para optimizar respuestas
app.use(compression());
// Logging de requests
if (process.env.NODE_ENV === 'development') {
app.use(morgan('dev'));
} else {
app.use(morgan('combined'));
}
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));
// Conexión a base de datos
const connectDB = async () => {
try {
console.log('🔄 Conectando a MongoDB...');
const conn = await mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log('✅ MongoDB conectado:', conn.connection.host);
console.log('📊 Base de datos:', conn.connection.name);
} catch (error) {
console.error('❌ Error conectando a MongoDB:', error.message);
process.exit(1);
}
};
// Ruta de salud del servidor
app.get('/', (req, res) => {
res.json({
success: true,
message: '🚀 Planifica+ API funcionando correctamente',
version: process.env.API_VERSION || '1.0.0',
environment: process.env.NODE_ENV || 'development',
timestamp: new Date().toISOString(),
endpoints: {
auth: '/api/auth',
projects: '/api/projects',
tasks: '/api/tasks',
contacts: '/api/contacts',
activities: '/api/activities',
dashboard: '/api/dashboard',
users: '/api/users'
}
});
});
// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
// Middleware para rutas no encontradas
app.use('*', (req, res) => {
res.status(404).json({
success: false,
message: 'Ruta no encontrada: ' + req.method + ' ' + req.originalUrl,
availableEndpoints: {
health: 'GET /',
auth: 'POST /api/auth/login, POST /api/auth/register',
projects: 'GET /api/projects',
tasks: 'GET /api/tasks/my-tasks',
contacts: 'GET /api/contacts',
activities: 'GET /api/activities',
users: 'GET /api/users/search'
}
});
});
// Middleware global de manejo de errores
app.use((error, req, res, next) => {
console.error('🚨 Error del servidor:', {
message: error.message,
stack: error.stack,
url: req.originalUrl,
method: req.method,
body: req.body,
params: req.params,
query: req.query
});
res.status(error.status || 500).json({
success: false,
message: error.message || 'Error interno del servidor',
details: process.env.NODE_ENV === 'development' ? {
stack: error.stack,
url: req.originalUrl,
method: req.method,
timestamp: new Date().toISOString()
} : undefined
});
});
// Configuración del puerto
const PORT = process.env.PORT || 3001;
const startServer = async () => {
try {
// Conectar a la base de datos
await connectDB();
// Iniciar servidor
app.listen(PORT, () => {
  console.log('==================================================');
  console.log('🚀 PLANIFICA+ SERVER INICIADO');
  console.log('==================================================');
  console.log('📡 Puerto:', PORT);
  console.log('🌐 URL: http://localhost:' + PORT);
  console.log('🔧 Entorno:', process.env.NODE_ENV || 'development');
  console.log('⏰ Iniciado:', new Date().toLocaleString());
  console.log('==================================================');
  console.log('✅ Servidor listo para recibir requests');
  console.log('📋 Endpoints disponibles:');
  console.log('   - GET  / (health check)');
  console.log('   - POST /api/auth/login');
  console.log('   - POST /api/auth/register');
  console.log('   - GET  /api/projects');
  console.log('   - GET  /api/tasks/my-tasks');
  console.log('   - PATCH /api/tasks/:id/move');
  console.log('   - GET  /api/contacts');
  console.log('   - GET  /api/activities');
  console.log('   - GET  /api/dashboard/stats');
  console.log('   - GET  /api/users/search');
  console.log('==================================================');
});
} catch (error) {
console.error('❌ Error iniciando el servidor:', error);
process.exit(1);
}
};
// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
console.log('👋 SIGTERM recibido. Cerrando servidor...');
process.exit(0);
});
process.on('SIGINT', () => {
console.log('👋 SIGINT recibido. Cerrando servidor...');
process.exit(0);
});
// Iniciar el servidor
startServer();