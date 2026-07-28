// config/db.js
// ─── Pool de conexiones MySQL (mysql2/promise) ─────────────────
// Soporta DATABASE_URL (Railway) o variables DB_* individuales.
// Refactorizado: elimina fallbacks || que enmascaran variables de entorno
// no definidas. Si una variable critica falta, el proceso falla con mensaje
// claro en lugar de conectar con credenciales equivocadas.
'use strict';

const mysql = require('mysql2/promise');
const { URL } = require('url');

// ── Parsear DATABASE_URL (Railway) o usar variables individuales ──
let DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL;

if (process.env.DATABASE_URL) {
  const parsed = new URL(process.env.DATABASE_URL);
  DB_HOST     = parsed.hostname;
  DB_PORT     = parsed.port || '3306';
  DB_USER     = decodeURIComponent(parsed.username);
  DB_PASSWORD = decodeURIComponent(parsed.password);
  DB_NAME     = parsed.pathname.replace(/^\//, '');
  DB_SSL      = parsed.searchParams.get('ssl') || process.env.DB_SSL || 'true';
  console.log(`[db.js] Usando DATABASE_URL → host: ${DB_HOST} | db: ${DB_NAME}`);
} else {
  DB_HOST     = process.env.DB_HOST;
  DB_PORT     = process.env.DB_PORT || '3306';
  DB_USER     = process.env.DB_USER;
  DB_PASSWORD = process.env.DB_PASSWORD;
  DB_NAME     = process.env.DB_NAME;
  DB_SSL      = process.env.DB_SSL || 'false';
}

// ── Validación de variables criticas antes de crear el pool ────
const configMap = { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME };
for (const [key, val] of Object.entries(configMap)) {
  if (!val) {
    console.error(`[db.js] ❌ Variable requerida no definida: ${key}`);
    console.error('[db.js] Define DATABASE_URL o las variables DB_* individuales.');
    process.exit(1);
  }
}

// ── Creación del pool (soporta socket Unix) ────────────────────
const poolConfig = {};
if (process.env.DB_SOCKET) {
  poolConfig.socketPath = process.env.DB_SOCKET;
  console.log(`[db.js] Usando socket Unix: ${process.env.DB_SOCKET}`);
} else {
  poolConfig.host = DB_HOST;
  poolConfig.port = parseInt(DB_PORT, 10);
}
poolConfig.user = DB_USER;
poolConfig.password = DB_PASSWORD;
poolConfig.database = DB_NAME;
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0,
  authPlugins       : undefined,
  enableKeepAlive   : true,
  keepAliveInitialDelay: 10000,
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const val = field.string('utf8');
      if (val != null) return val;
    }
    return next();
  },
};

if (DB_SSL === 'true' || DB_SSL === '1') {
  poolConfig.ssl = { rejectUnauthorized: false };
  console.log('[db.js] SSL habilitado para la conexión MySQL (rejectUnauthorized: false)');
}

const pool = mysql.createPool(poolConfig);

// ── Prueba de conexión al iniciar ─────────────────────────────
// Falla rápido y explícito si la BD no está disponible
pool.getConnection()
  .then(conn => {
    console.log(`✅ MySQL conectado — host: ${DB_HOST} | db: ${DB_NAME}`);
    conn.release();
  })
  .catch(err => {
    console.error('[db.js] ❌ Error al conectar a MySQL:', err.message);
    console.error(`[db.js] Host: ${DB_HOST} | DB: ${DB_NAME}`);
    console.error('[db.js] El servidor iniciará sin BD. Corregí DATABASE_URL o las variables DB_* para la conexión.');
  });

module.exports = pool;