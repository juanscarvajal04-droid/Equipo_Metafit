// backend/models/configuracionModel.js
// ─── Tabla CONFIGURACION (clave-valor) ───────────────────────
// Acceso a datos de la tabla CONFIGURACION, un almacén clave-valor genérico
// para parámetros del sistema (ej. precio de membresía, textos configurables).
'use strict';

const pool = require('../config/db');

const ConfiguracionModel = {

  /**
   * Lee un valor de configuración por su clave.
   *
   * @param {string} clave - Identificador único del parámetro
   * @returns {Promise<string|null>} Valor almacenado, o null si la clave no
   *                                 existe en la tabla.
   */
  get: async (clave) => {
    const [rows] = await pool.query(
      'SELECT valor FROM CONFIGURACION WHERE clave = ?',
      [clave]
    );
    return rows.length ? rows[0].valor : null;
  },

  /**
   * Escribe un valor de configuración. UPSERT: si la clave ya existe se
   * actualiza el valor; si no, se inserta. Operación idempotente.
   *
   * @param {string} clave - Identificador único del parámetro
   * @param {string} valor - Valor a guardar
   * @returns {Promise<void>} No devuelve valor.
   */
  set: async (clave, valor) => {
    await pool.query(
      'INSERT INTO CONFIGURACION (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
      [clave, valor, valor]
    );
  },
};

module.exports = ConfiguracionModel;