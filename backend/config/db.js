// config/db.js
// ─── Pool de conexiones MySQL (mysql2/promise) ─────────────────
// Refactorizado: elimina fallbacks || que enmascaran variables de entorno
// no definidas. Si una variable critica falta, el proceso falla con mensaje
// claro en lugar de conectar con credenciales equivocadas.
'use strict';

const mysql = require('mysql2/promise');

// ── Validación de variables criticas antes de crear el pool ────
const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const key of required) {
  if (!process.env[key] && process.env[key] !== '') {
    console.error(`[db.js] ❌ Variable de entorno requerida no definida: ${key}`);
    console.error('[db.js] Asegúrate de que tu archivo .env o docker-compose.yml define todas las variables de DB.');
    process.exit(1);
  }
}

// ── Creación del pool ──────────────────────────────────────────
const pool = mysql.createPool({
  host              : process.env.DB_HOST,
  port              : parseInt(process.env.DB_PORT || '3306', 10),
  user              : process.env.DB_USER,
  password          : process.env.DB_PASSWORD,
  database          : process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0,
  // Compatibilidad con MySQL 8 y autenticación caching_sha2_password
  authPlugins       : undefined,
  // Reconexión automática en caso de timeout de conexión
  enableKeepAlive   : true,
  keepAliveInitialDelay: 10000,
  // typeCast: JSON columns → string (mysql2 devuelve JsonBinary que se serializa como @{})
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const val = field.string('utf8');
      if (val != null) return val;
    }
    return next();
  },
});

// ── Prueba de conexión al iniciar ─────────────────────────────
// Falla rápido y explícito si la BD no está disponible
pool.getConnection()
  .then(conn => {
    console.log(`✅ MySQL conectado — host: ${process.env.DB_HOST} | db: ${process.env.DB_NAME}`);
    conn.release();
  })
  .catch(err => {
    console.error('[db.js] ❌ Error al conectar a MySQL:', err.message);
    console.error('[db.js] Verifica que el contenedor de MySQL esté corriendo y que DB_HOST sea correcto.');
    console.error('[db.js] En Docker: DB_HOST debe ser el nombre del servicio (ej: "db"), no "localhost".');
    process.exit(1);
  });

module.exports = pool;