// backend/models/pagoModel.js
// FIX 5 + FASE FINANZAS: getAll, getMetricas, create con registrado_por.
// Columnas de la tabla PAGO:
//   id_pago, id_usuario, fecha_pago, valor_pagado, estado, fecha_vencimiento,
//   observaciones, registrado_por, fecha_creacion
'use strict';

const pool = require('../config/db');

/** Construye cláusula WHERE y params a partir de filtros opcionales.
 *  @param {Object} filters  { fecha_inicio, fecha_fin, id_recepcionista }
 *  @param {string} prefix   Prefijo de tabla (ej. 'p') o '' si es single-table */
const buildFilters = (filters = {}, prefix = '') => {
  const conditions = [];
  const params = [];
  const col = prefix ? `${prefix}.` : '';

  if (filters.fecha_inicio) {
    conditions.push(`${col}fecha_pago >= ?`);
    params.push(filters.fecha_inicio);
  }
  if (filters.fecha_fin) {
    conditions.push(`${col}fecha_pago <= ?`);
    params.push(filters.fecha_fin);
  }
  if (filters.id_recepcionista) {
    conditions.push(`${col}registrado_por = ?`);
    params.push(filters.id_recepcionista);
  }

  return { where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', params };
};

const PagoModel = {

  /** Retorna todos los pagos de un afiliado (id_usuario), más recientes primero */
  findByAfiliado: async (id_usuario) => {
    const [rows] = await pool.query(
      `SELECT * FROM PAGO WHERE id_usuario = ? ORDER BY fecha_pago DESC`,
      [id_usuario]
    );
    return rows;
  },

  /** Retorna TODOS los pagos del sistema con datos del afiliado (Admin).
   *  Acepta filtros opcionales: fecha_inicio, fecha_fin, id_recepcionista. */
  getAll: async (filters = {}) => {
    const { where, params } = buildFilters(filters, 'p');
    const [rows] = await pool.query(
      `SELECT
         p.id_pago,
         p.id_usuario,
         u.nombres       AS nombres_afiliado,
         u.apellidos     AS apellidos_afiliado,
         p.fecha_pago,
         p.valor_pagado,
         p.estado,
         p.fecha_vencimiento,
         p.observaciones,
         ru.nombres      AS nombres_recepcionista,
         ru.apellidos    AS apellidos_recepcionista
       FROM PAGO p
       JOIN AFILIADO a  ON p.id_usuario = a.id_usuario
       JOIN USUARIO  u  ON a.id_usuario = u.id_usuario
       LEFT JOIN USUARIO ru ON p.registrado_por = ru.id_usuario
       ${where}
       ORDER BY p.fecha_pago DESC`,
      params
    );
    return rows;
  },

  /** Métricas financieras agregadas (Admin). Acepta filtros opcionales. */
  getMetricas: async (filters = {}) => {
    const pf = buildFilters(filters, 'p');

    const [ingresosPorMes] = await pool.query(
      `SELECT
         MONTH(p.fecha_pago) AS mes,
         YEAR(p.fecha_pago)  AS anio,
         SUM(p.valor_pagado) AS total
       FROM PAGO p
       ${pf.where}
       GROUP BY YEAR(p.fecha_pago), MONTH(p.fecha_pago)
       ORDER BY anio DESC, mes DESC`,
      pf.params
    );

    const pf2 = buildFilters(filters, 'p');
    const rpWhere = pf2.params.length > 0 ? 'AND ' + pf2.where.replace('WHERE ', '') : '';
    const [pagosPorRecepcionista] = await pool.query(
      `SELECT
         ru.id_usuario,
         ru.nombres,
         ru.apellidos,
         COALESCE(SUM(p.valor_pagado), 0) AS total_recaudado,
         COUNT(*)                          AS cantidad_pagos
       FROM PAGO p
       JOIN USUARIO ru ON p.registrado_por = ru.id_usuario
       WHERE ru.rol = 'Recepcionista' ${rpWhere}
       GROUP BY ru.id_usuario, ru.nombres, ru.apellidos`,
      pf2.params
    );

    const [[{ total }]] = await pool.query(
      `SELECT COALESCE(SUM(p.valor_pagado), 0) AS total FROM PAGO p ${buildFilters(filters, 'p').where}`,
      buildFilters(filters, 'p').params
    );

    const [ultimosPagos] = await pool.query(
      `SELECT
         p.id_pago,
         p.id_usuario,
         u.nombres       AS nombres_afiliado,
         u.apellidos     AS apellidos_afiliado,
         p.fecha_pago,
         p.valor_pagado,
         p.estado,
         p.fecha_vencimiento,
         p.observaciones,
         ru.nombres      AS nombres_recepcionista,
         ru.apellidos    AS apellidos_recepcionista
       FROM PAGO p
       JOIN AFILIADO a  ON p.id_usuario = a.id_usuario
       JOIN USUARIO  u  ON a.id_usuario = u.id_usuario
       LEFT JOIN USUARIO ru ON p.registrado_por = ru.id_usuario
       ${buildFilters(filters, 'p').where}
       ORDER BY p.fecha_pago DESC
       LIMIT 10`,
      buildFilters(filters, 'p').params
    );

    return {
      ingresos_por_mes:      ingresosPorMes,
      pagos_por_recepcionista: pagosPorRecepcionista,
      total_recaudado:        Number(total),
      ultimos_pagos:          ultimosPagos,
    };
  },

  /** Crea un nuevo registro de pago.
   *  Si fecha_vencimiento no se provee, se calcula como fecha_pago + 30 días. */
  create: async (id_usuario, datos) => {
    const fecha_pago       = datos.fecha_pago       || new Date().toISOString().split('T')[0];
    const valor_pagado     = datos.valor_pagado      ?? 80000;
    const estado           = datos.estado            || 'Pagado';
    const observaciones    = datos.observaciones     || null;
    const registrado_por   = datos.registrado_por    || null;

    let fecha_vencimiento;
    if (datos.fecha_vencimiento) {
      fecha_vencimiento = datos.fecha_vencimiento;
    } else {
      const base = new Date(fecha_pago);
      base.setDate(base.getDate() + 30);
      fecha_vencimiento = base.toISOString().split('T')[0];
    }

    const [result] = await pool.query(
      `INSERT INTO PAGO (id_usuario, fecha_pago, valor_pagado, estado, fecha_vencimiento, observaciones, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_usuario, fecha_pago, valor_pagado, estado, fecha_vencimiento, observaciones, registrado_por]
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
