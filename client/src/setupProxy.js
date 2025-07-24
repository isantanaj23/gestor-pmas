const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para API
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true
    })
  );
  
  // Proxy específico para Socket.io
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      ws: true, // Habilitar WebSockets
      onProxyReqWs: (proxyReq, req, socket) => {
        console.log('🔌 Proxying WebSocket:', req.url);
      }
    })
  );
};