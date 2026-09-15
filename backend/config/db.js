// config/db.js
// ─── Pool de conexiones MySQL (mysql2/promise) ─────────────────
//
// DECISIÓN DE ARQUITECTURA: se usa un POOL de conexiones en lugar de una
// conexión única porque Express atiende múltiples requests simultáneos y cada
// uno necesita su propia conexión a MySQL. mysql2 reutiliza conexiones libres
// del pool y crea nuevas si la demanda sube, evitando el overhead de abrir una
// conexión TCP en cada query y los estados muertos de una sola conexión.
//
// Soporta dos formas de configuración:
//   1) DATABASE_URL (estilo Railway/Heroku, p.ej. mysql://user:pass@host:3306/db)
//   2) Variables DB_* individuales (DB_HOST, DB_PORT, DB_USER, ...)
// También soporta conexión por socket Unix (DB_SOCKET) para entornos que no
// exponen MySQL por TCP (por ejemplo Cloud Run con Cloud SQL).
//
// DECISIÓN: se eliminan los fallbacks `||` que enmascaraban variables de
// entorno no definidas. Si una variable crítica falta, el proceso falla con un
// mensaje claro en lugar de conectarse con credenciales equivocadas o vacías.
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
if (!process.env.DB_SOCKET && !process.env.DATABASE_URL) {
  const configMap = { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME };
  for (const [key, val] of Object.entries(configMap)) {
    if (!val) {
      console.error(`[db.js] ❌ Variable requerida no definida: ${key}`);
      console.error('[db.js] Define DATABASE_URL, DB_SOCKET o las variables DB_* individuales.');
      process.exit(1);
    }
  }
}

// ── Creación del pool (soporta socket Unix) ────────────────────
const poolConfig = {
  // waitForConnections: si el límite se alcanzó, las queries esperan en cola
  // en lugar de fallar, lo que mantiene la API disponible bajo picos de carga.
  waitForConnections: true,
  // connectionLimit: 10 es suficiente para este volumen de tráfico; un número
  // demasiado alto saturaría MySQL con conexiones idle (cada una consume
  // memoria del servidor de BD).
  connectionLimit   : 10,
  // queueLimit: 0 = cola ilimitada. No rechazamos queries por saturación
  // momentánea; preferimos encolarlas brevemente antes que responder 500.
  queueLimit        : 0,
  authPlugins       : undefined,
  // keepAlive evita que MySQL cierre conexiones inactivas del pool cuando hay
  // quiet periods, lo que causaba "Connection lost: server closed the connection".
  enableKeepAlive   : true,
  keepAliveInitialDelay: 10000,
  // typeCast para columnas JSON: mysql2 devuelve por defecto un string JSON.
  // Mantenerlo como string (en lugar de objeto) evita que los clientes reciban
  // dobles serializaciones y permite que el tipo original se decida en la capa
  // que consume el dato (service/controller).
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const val = field.string('utf8');
      if (val != null) return val;
    }
    return next();
  },
};

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

if (DB_SSL === 'true' || DB_SSL === '1') {
  // rejectUnauthorized: false se usa porque los CA públicos de Railway/RDS no
  // siempre están en la tienda de certificados del runtime; así se encripta el
  // tráfico sin romper el handshake TLS.
  poolConfig.ssl = { rejectUnauthorized: false };
  console.log('[db.js] SSL habilitado para la conexión MySQL (rejectUnauthorized: false)');
}

const pool = mysql.createPool(poolConfig);

// ── Prueba de conexión al iniciar ─────────────────────────────
// Falla rápido y explícito si la BD no está disponible.
// DECISIÓN: el servidor NO aborta si la BD está caída (el log lo reporta);
// así la app puede arrancar en entornos de despliegue donde MySQL tarda en
// estar listo y /health reporta estado "degraded" hasta que reconecte.
pool.getConnection()
  .then(conn => {
    const loc = process.env.DB_SOCKET ? `socket: ${process.env.DB_SOCKET}` : `host: ${DB_HOST}`;
    console.log(`✅ MySQL conectado — ${loc} | db: ${DB_NAME}`);
    conn.release();
  })
  .catch(err => {
    console.error('[db.js] ❌ Error al conectar a MySQL:', err.message);
    console.error('[db.js] El servidor iniciará sin BD. Corregí DATABASE_URL o las variables DB_* para la conexión.');
  });

// Pool de conexiones compartido: todos los modelos (usuarioModel, afiliadoModel, …)
// lo importan y ejecutan sus queries sobre pool.query(…) o pool.getConnection().
module.exports = pool;