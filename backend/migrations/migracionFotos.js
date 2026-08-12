// backend/migrations/migracionFotos.js
// Migración idempotente ejecutada al arrancar el servidor:
//   1. Crea la columna AFILIADO.foto si no existe (MySQL via socket local, sin acceso externo).
//   2. Limpia los datos temporales usados en la prueba de la factura
//      (PAGO 43 / AFILIADO 10 / USUARIO 10) si aún existen.
'use strict';

const pool = require('../config/db');

async function asegurarColumnaFoto() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'AFILIADO'
        AND COLUMN_NAME = 'foto'`
  );
  if (rows[0].n === 0) {
    await pool.query('ALTER TABLE AFILIADO ADD COLUMN foto VARCHAR(255) NULL');
    console.log('[migracion] Columna AFILIADO.foto creada correctamente');
  } else {
    console.log('[migracion] Columna AFILIADO.foto ya existe');
  }
}

async function limpiarDatosPruebaFactura() {
  const [p] = await pool.query('DELETE FROM PAGO WHERE id_pago = 43');
  const [a] = await pool.query('DELETE FROM AFILIADO WHERE id_usuario = 10');
  const [u] = await pool.query('DELETE FROM USUARIO WHERE id_usuario = 10');
  const total = p.affectedRows + a.affectedRows + u.affectedRows;
  if (total > 0) {
    console.log(`[migracion] Limpieza datos temporales factura: pagos=${p.affectedRows}, afiliado=${a.affectedRows}, usuario=${u.affectedRows}`);
  }
}

async function runMigraciones() {
  await asegurarColumnaFoto();
  await limpiarDatosPruebaFactura();
}

module.exports = { runMigraciones };