// backend/models/configuracionModel.js
// ─── Tabla CONFIGURACION (clave-valor) ───────────────────────
'use strict';

const pool = require('../config/db');

const ConfiguracionModel = {

  get: async (clave) => {
    const [rows] = await pool.query(
      'SELECT valor FROM CONFIGURACION WHERE clave = ?',
      [clave]
    );
    return rows.length ? rows[0].valor : null;
  },

  set: async (clave, valor) => {
    await pool.query(
      'INSERT INTO CONFIGURACION (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
      [clave, valor, valor]
    );
  },
};

module.exports = ConfiguracionModel;
