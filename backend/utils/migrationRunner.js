'use strict';

const pool = require('../config/db');

// Espera activa: la BD puede estar aún inicializándose al levantar (Docker).
async function esperarBaseDeDatos(intentos = 30, cadaMs = 2000) {
  for (let i = 1; i <= intentos; i += 1) {
    try {
      await pool.query('SELECT 1');
      console.log('[migraciones] Base de datos disponible');
      return;
    } catch (err) {
      if (i === intentos) throw err;
      console.log(`[migraciones] BD aún no lista (${i}/${intentos}), reintento en ${cadaMs}ms…`);
      await new Promise((r) => setTimeout(r, cadaMs));
    }
  }
}

// Ejecuta una migración idempotente sin bloquear el arranque del servidor.
function ejecutarMigracion(nombre, etiqueta, cargar) {
  esperarBaseDeDatos()
    .then(cargar)
    .then(() => console.log(`✅ ${nombre}`))
    .catch((err) => console.error(`[${etiqueta}] error:`, err.message));
}

module.exports = { esperarBaseDeDatos, ejecutarMigracion };
