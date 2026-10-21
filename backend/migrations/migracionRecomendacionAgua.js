// backend/migrations/migracionRecomendacionAgua.js
// Migración idempotente ejecutada al arrancar el servidor:
//   Crea PLAN_NUTRICIONAL.recomendacion_agua_vasos (recomendación diaria
//   de agua que el entrenador define junto con la dieta).
'use strict';

const pool = require('../config/db');

async function asegurarColumnaRecomendacionAgua() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'PLAN_NUTRICIONAL'
        AND COLUMN_NAME = 'recomendacion_agua_vasos'`
  );
  if (rows[0].n === 0) {
    await pool.query(
      `ALTER TABLE PLAN_NUTRICIONAL
         ADD COLUMN recomendacion_agua_vasos TINYINT NULL
         COMMENT 'Recomendación diaria de agua en vasos (0-50). Opcional.'
         AFTER observaciones`
    );
    console.log('[migracion] Columna PLAN_NUTRICIONAL.recomendacion_agua_vasos creada correctamente');
  } else {
    console.log('[migracion] Columna PLAN_NUTRICIONAL.recomendacion_agua_vasos ya existe');
  }
}

async function runMigraciones() {
  await asegurarColumnaRecomendacionAgua();
}

module.exports = { runMigraciones, asegurarColumnaRecomendacionAgua };
