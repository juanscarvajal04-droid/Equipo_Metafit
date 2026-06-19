// backend/models/pagoModel.js
// FIX 5: Módulo de pagos — interactúa con la tabla PAGO del schema real.
// Columnas de la tabla PAGO:
//   id_pago, id_usuario, fecha_pago, valor_pagado, estado, fecha_vencimiento,
//   observaciones, fecha_creacion
'use strict';

const pool = require('../config/db');

const PagoModel = {

  /** Retorna todos los pagos de un afiliado (id_usuario), más recientes primero */
  findByAfiliado: async (id_usuario) => {
    const [rows] = await pool.query(
      `SELECT * FROM PAGO WHERE id_usuario = ? ORDER BY fecha_pago DESC`,
      [id_usuario]
    );
    return rows;
  },

  /** Crea un nuevo registro de pago.
   *  Si fecha_vencimiento no se provee, se calcula como fecha_pago + 30 días. */
  create: async (id_usuario, datos) => {
    const fecha_pago       = datos.fecha_pago       || new Date().toISOString().split('T')[0];
    const valor_pagado     = datos.valor_pagado      ?? 80000;
    const estado           = datos.estado            || 'Pagado';
    const observaciones    = datos.observaciones     || null;

    // Fecha de vencimiento: se puede pasar o se calcula automáticamente
    let fecha_vencimiento;
    if (datos.fecha_vencimiento) {
      fecha_vencimiento = datos.fecha_vencimiento;
    } else {
      const base = new Date(fecha_pago);
      base.setDate(base.getDate() + 30);
      fecha_vencimiento = base.toISOString().split('T')[0];
    }

    const [result] = await pool.query(
      `INSERT INTO PAGO (id_usuario, fecha_pago, valor_pagado, estado, fecha_vencimiento, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, fecha_pago, valor_pagado, estado, fecha_vencimiento, observaciones]
    );
    return { id_pago: result.insertId, fecha_vencimiento };
  },

  /** Retorna el pago más reciente del afiliado (o null si no tiene ninguno) */
  getUltimo: async (id_usuario) => {
    const [rows] = await pool.query(
      `SELECT * FROM PAGO WHERE id_usuario = ? ORDER BY fecha_pago DESC LIMIT 1`,
      [id_usuario]
    );
    return rows[0] || null;
  },
};

module.exports = PagoModel;
