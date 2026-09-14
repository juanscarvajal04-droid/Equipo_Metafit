// backend/models/pagoModel.js
// ─── Consultas SQL de la tabla PAGO ───────────────────────────
// Capa de acceso a datos de los pagos de membresía. Un pago pertenece a un
// afiliado (id_usuario), registra cuánto pagó, cuándo, hasta cuándo tiene
// cobertura (fecha_vencimiento) y quién lo recibió (registrado_por).
// FIX 5 + FASE FINANZAS: getAll, getMetricas, create con registrado_por.
// Columnas de la tabla PAGO:
//   id_pago, id_usuario, fecha_pago, valor_pagado, estado, fecha_vencimiento,
//   observaciones, registrado_por, fecha_creacion
'use strict';

const pool = require('../config/db');

/**
 * Construye la cláusula WHERE y los parámetros a partir de filtros opcionales
 * que comparten los reportes de finanzas (listado y métricas). Centralizar la
 * construcción acá mantiene consistentes los filtros entre endpoints.
 *
 * @param {Object} filters - Filtros opcionales:
 *   { string } filters.fecha_inicio - Fecha mínima de pago (YYYY-MM-DD)
 *   { string } filters.fecha_fin - Fecha máxima de pago (YYYY-MM-DD)
 *   { number } filters.id_recepcionista - Filtrar por quien registró el pago
 * @param {string} prefix - Prefijo de tabla (ej. 'p' para PAGO p) o '' en
 *                          queries de una sola tabla
 * @returns {Object} { where: string, params: Array } — 'WHERE col >= ? …' y
 *                   los valores que lo acompañan.
 */
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

  /**
   * Devuelve todos los pagos de un afiliado (id_usuario), más recientes
   * primero. Se usa en el perfil del afiliado y en el móvil para mostrar el
   * estado de la membresía.
   *
   * @param {number} id_usuario - ID del afiliado
   * @returns {Promise<Array<Object>>} Lista de pagos del afiliado.
   */
  findByAfiliado: async (id_usuario) => {
    const [rows] = await pool.query(
      `SELECT * FROM PAGO WHERE id_usuario = ? ORDER BY fecha_pago DESC`,
      [id_usuario]
    );
    return rows;
  },

  /**
   * Devuelve TODOS los pagos del sistema (panel de Finanzas, rol Admin) con
   * datos del afiliado y del recepcionista que registró el pago. Une PAGO con
   * AFILIADO→USUARIO (nombres del afiliado) y LEFT JOIN USUARIO (LEFT porque
   * registrado_por puede ser null en pagos antiguos). Acepta filtros de fecha
   * y de recepcionista.
   *
   * @param {Object} filters - Filtros opcionales (ver buildFilters)
   * @returns {Promise<Array<Object>>} Lista de pagos enriquecida.
   */
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

  /**
   * Calcula las métricas financieras del panel de Finanzas con filtros
   * opcionales: ingresos agrupados por mes, total recaudado por recepcionista,
   * total general y los 10 últimos pagos. Nota: se re-construye el filtro por
   * query con buildFilters para poder combinar `WHERE` y `AND` en la query de
   * recepcionistas.
   *
   * @param {Object} filters - Filtros opcionales (fecha_inicio, fecha_fin,
   *                           id_recepcionista)
   * @returns {Promise<Object>} { ingresos_por_mes, pagos_por_recepcionista,
   *   total_recaudado, ultimos_pagos }.
   */
  getMetricas: async (filters = {}) => {
    const pf = buildFilters(filters, 'p');

    // Ingresos agrupados por mes/año: cada fila = total recaudado en un mes.
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

    // Recaudo por recepcionista: JOIN con USUARIO para el nombre. El filtro de
    // fecha se re-aplica con AND porque la query ya tiene un WHERE por rol.
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

    // Total general recaudado (COALESCE devuelve 0 en vez de null sin pagos).
    const [[{ total }]] = await pool.query(
      `SELECT COALESCE(SUM(p.valor_pagado), 0) AS total FROM PAGO p ${buildFilters(filters, 'p').where}`,
      buildFilters(filters, 'p').params
    );

    // Vista rápida de los 10 pagos más recientes (mismo shape que getAll).
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

  /**
   * Crea un registro de pago nuevo. REGLA DE NEGOCIO: si no se provee
   * `fecha_vencimiento`, se calcula automáticamente como fecha_pago + 30 días
   * (mensualidad estándar); si tampoco viene `valor_pagado`, usa el precio de
   * membresía por defecto ($80.000). El campo `registrado_por` traza quién
   * recibió el pago (recepcionista/admin).
   *
   * @param {number} id_usuario - ID del afiliado que paga
   * @param {Object} datos - { fecha_pago, valor_pagado, estado,
   *                          fecha_vencimiento, observaciones, registrado_por }
   * @returns {Promise<Object>} { id_pago, fecha_vencimiento } — la fecha de
   *                             vencimiento efectiva (calculada si no vino).
   */
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
      // Vencimiento por defecto = 30 días después del pago (mensualidad).
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

  /**
   * Devuelve el pago más reciente del afiliado (o null si no tiene ninguno).
   * Se usa para derivar el estado de membresía (vigente/vencida) en vistas y
   * notificaciones.
   *
   * @param {number} id_usuario - ID del afiliado
   * @returns {Promise<Object|null>} Último pago o null.
   */
  getUltimo: async (id_usuario) => {
    const [rows] = await pool.query(
      `SELECT * FROM PAGO WHERE id_usuario = ? ORDER BY fecha_pago DESC LIMIT 1`,
      [id_usuario]
    );
    return rows[0] || null;
  },
};

module.exports = PagoModel;