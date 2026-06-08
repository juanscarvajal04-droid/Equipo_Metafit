// server.js
// ─── Configuración de Express y registro de rutas ─────────────
'use strict';
const express       = require('express');
const cors          = require('cors');
const swaggerUi     = require('swagger-ui-express');
const swaggerSpec   = require('./config/swagger');
const app           = express();

const IS_PROD = process.env.NODE_ENV === 'production';

// ── CORS ──────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // En producción, bloquear requests sin origin (evita CSRF desde scripts)
    if (!origin && IS_PROD) return callback(new Error('CORS: origin requerido en producción'));
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  methods : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Límite de tamaño de body (evita DoS por payloads enormes) ─
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Rutas ──────────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const usuarioRoutes   = require('./routes/usuarioRoutes');
const afiliadoRoutes  = require('./routes/afiliadoRoutes');
const planRoutes      = require('./routes/planRoutes');
const catalogoRoutes  = require('./routes/catalogoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/',           authRoutes);       // POST /login
app.use('/usuarios',   usuarioRoutes);    // GET/POST/PATCH/DELETE /usuarios
app.use('/afiliados',  afiliadoRoutes);   // CRUD afiliados + ciclos + progreso
app.use('/planes',     planRoutes);       // Planes entrenamiento y nutricional
app.use('/660',        catalogoRoutes);   // GET /660/ejercicios  /660/alimentos
app.use('/catalogo',   catalogoRoutes);   // GET /catalogo/ejercicios (alias)
app.use('/dashboard',  dashboardRoutes);  // GET /dashboard/kpis

// ── Swagger UI — /api-docs ────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'MetaFit API Docs',
  swaggerOptions: {
    persistAuthorization: true,      // mantiene el token entre recargas
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
}));

// Endpoint que sirve el JSON crudo de la spec (para Postman, etc.)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Health check ───────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const pool = require('./config/db');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'MySQL conectado', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'MySQL desconectado' });
  }
});

// ── Ruta no encontrada ─────────────────────────────────────────
// ⚠️ NO reflejar req.path: evita path-reflection XSS/log-injection
app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// ── Manejo global de errores ───────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log completo solo en servidor, NUNCA al cliente
  console.error('[ERROR]', err.stack || err.message);

  // Error de CORS → 403, no 500
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  // Error de JWT malformado que escapa de requireAuth
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Nunca filtrar stack traces al cliente
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;