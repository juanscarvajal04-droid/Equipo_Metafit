// config/db.js
// ─── Conexión al pool de MySQL ────────────────────────────────
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host              : process.env.DB_HOST     || 'localhost',
  port              : process.env.DB_PORT     || 3306,
  user              : process.env.DB_USER     || 'root',
  password          : process.env.DB_PASSWORD || '',
  database          : process.env.DB_NAME     || 'metafit',
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0,
});

// Verifica la conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado a MySQL — base de datos:', process.env.DB_NAME || 'metafit');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;