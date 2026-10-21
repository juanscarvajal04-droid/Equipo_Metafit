// backend/migrations/migracionFotoUsuario.js
// Migración idempotente ejecutada al arrancar el servidor:
//   Crea la columna USUARIO.foto si no existe (foto de perfil del staff).
'use strict';

const pool = require('../config/db');

async function asegurarColumnaFotoUsuario() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'USUARIO'
        AND COLUMN_NAME = 'foto'`
  );
  if (rows[0].n === 0) {
    await pool.query('ALTER TABLE USUARIO ADD COLUMN foto VARCHAR(255) NULL');
    console.log('[migracion] Columna USUARIO.foto creada correctamente');
  } else {
    console.log('[migracion] Columna USUARIO.foto ya existe');
  }
}

async function runMigraciones() {
  await asegurarColumnaFotoUsuario();
}

module.exports = { runMigraciones, asegurarColumnaFotoUsuario };
