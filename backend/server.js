// server.js
// ─── Configuración de Express y registro de rutas ─────────────
// Refactorizado: BUG-003 (validación Content-Type en POST/PUT/PATCH),
//               BUG-005 (rate limiting en /login con express-rate-limit),
//               BUG-010 (error handler global ya no filtra stack traces — mantenido)
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const app = express();

const IS_PROD = process.env.NODE_ENV === 'production';


// ── CORS ──────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(o => o.trim());

// Rutas que deben estar accesibles sin restricción de origen
// (Swagger UI, health check, herramientas de desarrollo)
const CORS_OPEN_PATHS = ['/api-docs', '/swagger', '/health', '/api-docs.json'];

app.use((req, res, next) => {
  // Si la ruta es de documentación o health, aplicar CORS abierto y continuar
  const isOpenPath = CORS_OPEN_PATHS.some(p => req.path === p || req.path.startsWith(p + '/'));
  if (isOpenPath) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  }

  // Para el resto de rutas, aplicar CORS estricto
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin: Postman, curl, herramientas server-to-server
      // Solo bloquear si el origin existe pero NO está en la lista permitida
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })(req, res, next);
});

// ── ISO 25000 / 3.1: Helmet — cabeceras HTTP seguras ──────────
// Desactivamos contentSecurityPolicy para que Swagger UI pueda
// cargar sus scripts y estilos inline sin bloquearse.
app.use(helmet({ contentSecurityPolicy: false }));

// ── Límite de tamaño de body (evita DoS por payloads enormes) ─
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));


// ── BUG-003: Validación de Content-Type ───────────────────────
// Los endpoints POST, PUT y PATCH deben recibir JSON.
// Sin esta validación, un body enviado como text/plain o form-data
// resulta en req.body = undefined y errores silenciosos difíciles de depurar.
// Excepción: rutas de Swagger UI realizan requests internos sin application/json.
app.use((req, res, next) => {
  const isSwaggerPath = req.path.startsWith('/api-docs') || req.path.startsWith('/swagger');
  if (!isSwaggerPath && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || '';
    if (!ct.includes('application/json')) {
      return res.status(415).json({
        error: 'Content-Type debe ser application/json',
      });
    }
  }
  next();
});

// ── BUG-005: Rate limiting en /login ──────────────────────────
// bcrypt con 12 rondas consume ~250-400ms por llamada.
// Sin rate limiting, un atacante puede saturar el event loop con
// ataques de fuerza bruta o generar DoS involuntario con carga alta.
// Límite: 10 intentos por IP cada 15 minutos.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 10,               // máx. 10 intentos por ventana
  standardHeaders: true,             // expone RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.' },
  skipSuccessfulRequests: true,         // los logins exitosos no cuentan contra el límite
});

// ── Rutas ──────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const afiliadoRoutes = require('./routes/afiliadoRoutes');
const planRoutes = require('./routes/planRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const pagoRoutes = require('./routes/pagoRoutes');        // FIX 5: rutas de pagos
const pagoAdminRoutes = require('./routes/pagoAdminRoutes'); // FASE FINANZAS: admin
const configuracionRoutes = require('./routes/configuracionRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');

// BUG-005: El rate limiter se aplica SOLO al endpoint de login
app.use('/', loginLimiter, authRoutes);   // POST /login (con rate limit)
app.use('/usuarios', usuarioRoutes);              // GET/POST/PATCH/DELETE /usuarios
app.use('/afiliados', afiliadoRoutes);             // CRUD afiliados + ciclos + progreso
app.use('/afiliados', pagoRoutes);                // FIX 5: GET|POST /afiliados/:id/pagos
app.use('/pagos', pagoAdminRoutes);              // FASE FINANZAS: GET /pagos, GET /pagos/metricas
app.use('/planes', planRoutes);                 // Planes entrenamiento y nutricional
app.use('/catalogo', catalogoRoutes);             // GET /catalogo/ejercicios|alimentos|restricciones
app.use('/dashboard', dashboardRoutes);            // GET /dashboard/kpis
app.use('/configuracion', configuracionRoutes);     // GET|PUT /configuracion/precio-membresia
app.use('/notificaciones', notificacionRoutes);    // GET /notificaciones

// ── Swagger UI — /api-docs y /swagger (alias) ────────────────
const swaggerSetup = swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'MetaFit API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
});
app.use('/api-docs', swaggerUi.serve, swaggerSetup);
app.use('/swagger', swaggerUi.serve, swaggerSetup);  // alias amigable

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
  // Log completo solo en servidor, NUNCA al cliente (BUG-010)
  console.error('[ERROR GLOBAL]', err.stack || err.message);

  // Error de CORS → 403, no 500
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  // Error de JWT malformado que escapa de requireAuth
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Error de Content-Type (express.json falla al parsear body inválido)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON malformado en el body' });
  }

  // Nunca filtrar stack traces al cliente
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;