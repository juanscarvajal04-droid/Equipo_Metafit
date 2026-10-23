'use strict';

/**
 * Construye y ejecuta una consulta de historial con filtros opcionales.
 * Evita repetir el mismo bloque de filtros en los modelos de registro real.
 */
async function consultarHistorial(pool, id_usuario, filtros, config) {
  const { select, from, orderBy, alias = '', limite = 300 } = config;
  const prefijo = alias ? `${alias}.` : '';
  let sql = `SELECT ${select} FROM ${from} WHERE ${prefijo}id_usuario = ?`;
  const params = [id_usuario];

  if (filtros.id_ciclo) {
    sql += ` AND ${prefijo}id_ciclo = ?`;
    params.push(filtros.id_ciclo);
  }
  if (filtros.fechaInicio) {
    sql += ` AND ${prefijo}fecha >= ?`;
    params.push(filtros.fechaInicio);
  }
  if (filtros.fechaFin) {
    sql += ` AND ${prefijo}fecha <= ?`;
    params.push(filtros.fechaFin);
  }

  sql += ` ORDER BY ${orderBy} LIMIT ${limite}`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { consultarHistorial };
