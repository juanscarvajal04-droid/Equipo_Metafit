// server.js
// ─── Configuración de Express y registro de rutas ─────────────
const express    = require('express');
const cors       = require('cors');
const app        = express();

// ── Middlewares globales ───────────────────────────────────────
app.use(cors({
  origin : ['http://localhost:5173', 'http://localhost:3000'],
  methods : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no existe` });
});

// ── Manejo global de errores ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;