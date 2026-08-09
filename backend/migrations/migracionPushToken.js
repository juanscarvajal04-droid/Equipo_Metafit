// backend/migrations/migracionPushToken.js
// Migración idempotente ejecutada al arrancar el servidor:
//   Crea la columna USUARIO.push_token (Expo Push Token) si no existe.
'use strict';

const pool = require('../config/db');

async function asegurarColumnaPushToken() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'USUARIO'
        AND COLUMN_NAME = 'push_token'`
  );
  if (rows[0].n === 0) {
    await pool.query('ALTER TABLE USUARIO ADD COLUMN push_token VARCHAR(255) NULL');
    console.log('[migracion] Columna USUARIO.push_token creada correctamente');
  } else {
    console.log('[migracion] Columna USUARIO.push_token ya existe');
  }
}

async function runMigraciones() {
  await asegurarColumnaPushToken();
}

module.exports = { runMigraciones, asegurarColumnaPushToken };