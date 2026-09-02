// backend/migrations/migracionNutrientesConsumo.js
// Migración idempotente ejecutada al arrancar el servidor:
//   Agrega a CONSUMO_ALIMENTO_REAL las columnas de macronutrientes
//   (proteinas_consumidas, carbohidratos_consumidos, grasas_consumidas)
//   y recalcula los registros existentes desde ALIMENTO con la fórmula Atwater
//   (misma proporción que calorias_consumidas):
//     macro_consumido = ROUND(macro_por_100g * cantidad_g_consumida / 100, 2)
// 'use strict';

const pool = require('../config/db');

const COLUMNAS = [
  { nombre: 'proteinas_consumidas',      ddl: 'ADD COLUMN proteinas_consumidas DECIMAL(8,2) NOT NULL DEFAULT 0' },
  { nombre: 'carbohidratos_consumidos',  ddl: 'ADD COLUMN carbohidratos_consumidos DECIMAL(8,2) NOT NULL DEFAULT 0' },
  { nombre: 'grasas_consumidas',         ddl: 'ADD COLUMN grasas_consumidas DECIMAL(8,2) NOT NULL DEFAULT 0' },
];

async function asegurarColumna(columna) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'CONSUMO_ALIMENTO_REAL'
        AND COLUMN_NAME = ?`,
    [columna.nombre]
  );
  if (rows[0].n === 0) {
    await pool.query(`ALTER TABLE CONSUMO_ALIMENTO_REAL ${columna.ddl}`);
    console.log(`[migracion] Columna CONSUMO_ALIMENTO_REAL.${columna.nombre} creada correctamente`);
  } else {
    console.log(`[migracion] Columna CONSUMO_ALIMENTO_REAL.${columna.nombre} ya existe`);
  }
}

// Recalcula macros de registros históricos (solo los que quedaron en 0).
async function recalcularHistoricos() {
  const [r] = await pool.query(
    `UPDATE CONSUMO_ALIMENTO_REAL c
     JOIN ALIMENTO a ON a.id_alimento = c.id_alimento
     SET c.proteinas_consumidas     = ROUND(a.proteinas * c.cantidad_g_consumida / 100, 2),
         c.carbohidratos_consumidos = ROUND(a.carbohidratos * c.cantidad_g_consumida / 100, 2),
         c.grasas_consumidas        = ROUND(a.grasas * c.cantidad_g_consumida / 100, 2)
     WHERE c.proteinas_consumidas     = 0
       AND c.carbohidratos_consumidos = 0
       AND c.grasas_consumidas        = 0`
  );
  console.log(
    `[migracion] Macronutrientes recalculados en ${r.affectedRows} consumos históricos de CONSUMO_ALIMENTO_REAL`
  );
}

async function runMigraciones() {
  for (const columna of COLUMNAS) {
    await asegurarColumna(columna);
  }
  await recalcularHistoricos();
}

module.exports = { runMigraciones };