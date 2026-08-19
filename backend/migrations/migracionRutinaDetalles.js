// backend/migrations/migracionRutinaDetalles.js
// Migración idempotente ejecutada al arrancar el servidor:
//   Agrega a RUTINA_EJERCICIO las columnas peso_kg y descanso_seg (HU43 CA2)
//   si no existen. No altera datos existentes (las nuevas columnas son NULL).
//   La descripción del ejercicio (EJERCICIO.descripcion) ya existía en el schema.
'use strict';

const pool = require('../config/db');

const COLUMNAS = [
  { nombre: 'peso_kg',      ddl: 'ADD COLUMN peso_kg DECIMAL(5,2) NULL CHECK (peso_kg IS NULL OR peso_kg > 0)' },
  { nombre: 'descanso_seg', ddl: 'ADD COLUMN descanso_seg INT NULL CHECK (descanso_seg IS NULL OR descanso_seg >= 0)' },
];

async function asegurarColumna(columna) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'RUTINA_EJERCICIO'
        AND COLUMN_NAME = ?`,
    [columna.nombre]
  );
  if (rows[0].n === 0) {
    await pool.query(`ALTER TABLE RUTINA_EJERCICIO ${columna.ddl}`);
    console.log(`[migracion] Columna RUTINA_EJERCICIO.${columna.nombre} creada correctamente`);
  } else {
    console.log(`[migracion] Columna RUTINA_EJERCICIO.${columna.nombre} ya existe`);
  }
}

async function runMigraciones() {
  for (const columna of COLUMNAS) {
    await asegurarColumna(columna);
  }
  await poblarDatosDemo();
}

// Datos de demostración (HU43 CA2/CA3) para el ciclo activo de Sofía (id_ciclo=8).
// Se aplican SOLO donde el dato está vacío (NULL/'') para no pisar datos reales.
// Idempotente: en la 2ª ejecución no encuentra filas vacías y no hace nada.
async function poblarDatosDemo() {
  const instrucciones = {
    1: 'Colócate con los pies al ancho de los hombros y la espalda neutra. Baja flexionando rodillas y cadera como si fueras a sentarte, manteniendo el pecho arriba. Empuja con todo el pie para volver a la posición inicial.',
    2: 'Acuéstate en el banco con los pies firmes en el suelo. Baja la barra hasta el pecho con control y empújala hacia arriba hasta extender los brazos, sin bloquear los codos.',
    4: 'De pie o sentado, toma la barra a la altura de los hombros. Empuja hacia arriba hasta extender los brazos y baja con control hasta los hombros.',
    5: 'De pie, con los codos pegados al torso, flexiona los codos levantando las mancuernas hacia los hombros. Baja con control sin balancear el torso.',
    6: 'De pie o sentado, extiende los codos llevando las mancuernas o polea hacia abajo hasta bloquear los brazos. Vuelve a la posición inicial con control.',
    7: 'Recuéstate boca arriba con la espalda apoyada en el banco y la barra o disco sobre la cadera. Empuja con la cadera hacia arriba apretando los glúteos y baja con control.',
    9: 'De pie, da un paso largo hacia adelante y baja hasta que ambas rodillas formen 90 grados. Empuja con el pie delantero para volver y alterna las piernas.',
  };

  for (const [idEjercicio, texto] of Object.entries(instrucciones)) {
    await pool.query(
      `UPDATE EJERCICIO SET descripcion = ?
       WHERE id_ejercicio = ? AND (descripcion IS NULL OR descripcion = '')`,
      [texto, Number(idEjercicio)]
    );
  }

  const cargas = [
    [22, 1, 20.00, 90], [22, 2, 25.00, 90], [22, 3, 8.00, 60],
    [23, 1, 12.00, 60], [23, 2, 20.00, 90], [23, 3, 15.00, 90],
    [24, 1, 25.00, 90], [24, 2, 30.00, 120], [24, 3, 12.00, 60],
  ];
  for (const [idRutina, orden, peso, descanso] of cargas) {
    await pool.query(
      `UPDATE RUTINA_EJERCICIO SET peso_kg = ?, descanso_seg = ?
       WHERE id_rutina = ? AND orden = ? AND (peso_kg IS NULL OR descanso_seg IS NULL)`,
      [peso, descanso, idRutina, orden]
    );
  }
  console.log('[migracion] Datos demo HU43 (peso/descanso/instrucciones) verificados');
}

module.exports = { runMigraciones };