// backend/models/registroEjercicioModel.js
// FASE 1: REGISTRO_EJERCICIO — ejecución REAL (series/reps/peso) de un ejercicio de la rutina.
'use strict';

const pool = require('../config/db');

const RegistroEjercicioModel = {

  // Inserta en la transacción abierta por el servicio (conn).
  insertar: async (conn, datos) => {
    const { id_usuario, id_ciclo, id_rutina, orden, fecha,
            series, repeticiones, peso_utilizado_kg, notas } = datos;
    const [r] = await conn.query(
      `INSERT INTO REGISTRO_EJERCICIO
         (id_usuario, id_ciclo, id_rutina, orden, fecha,
          series, repeticiones, peso_utilizado_kg, notas)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id_usuario, id_ciclo, id_rutina, orden, fecha,
       series, repeticiones, peso_utilizado_kg || null, notas || null]
    );
    return r.insertId;
  },

  getHistorial: async (id_usuario, { id_ciclo, fechaInicio, fechaFin }) => {
    let sql = `
      SELECT re.id_registro, re.id_ciclo, re.fecha, re.id_rutina, re.orden,
             re.series, re.repeticiones, re.peso_utilizado_kg, re.notas,
             e.id_ejercicio, e.nombre_ejercicio, e.grupo_muscular,
             ROUND(re.series * re.repeticiones * COALESCE(re.peso_utilizado_kg, 0), 2) AS volumen
      FROM REGISTRO_EJERCICIO re
      JOIN RUTINA_EJERCICIO rute ON re.id_rutina = rute.id_rutina AND re.orden = rute.orden
      JOIN EJERCICIO e           ON rute.id_ejercicio = e.id_ejercicio
      WHERE re.id_usuario = ?`;
    const params = [id_usuario];
    if (id_ciclo)    { sql += ` AND re.id_ciclo = ?`; params.push(id_ciclo); }
    if (fechaInicio) { sql += ` AND re.fecha >= ?`;   params.push(fechaInicio); }
    if (fechaFin)    { sql += ` AND re.fecha <= ?`;   params.push(fechaFin); }
    sql += ` ORDER BY re.fecha DESC, re.id_registro DESC LIMIT 300`;
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  getEvolucion: async (id_usuario, id_ejercicio, { fechaInicio, fechaFin }) => {
    let sql = `
      SELECT re.fecha, re.series, re.repeticiones, re.peso_utilizado_kg, re.notas,
             ROUND(re.series * re.repeticiones * COALESCE(re.peso_utilizado_kg, 0), 2) AS volumen
      FROM REGISTRO_EJERCICIO re
      JOIN RUTINA_EJERCICIO rute ON re.id_rutina = rute.id_rutina AND re.orden = rute.orden
      JOIN EJERCICIO e           ON rute.id_ejercicio = e.id_ejercicio
      WHERE re.id_usuario = ? AND e.id_ejercicio = ?`;
    const params = [id_usuario, id_ejercicio];
    if (fechaInicio) { sql += ` AND re.fecha >= ?`; params.push(fechaInicio); }
    if (fechaFin)    { sql += ` AND re.fecha <= ?`; params.push(fechaFin); }
    sql += ` ORDER BY re.fecha ASC`;
    const [rows] = await pool.query(sql, params);
    return rows;
  },
};

module.exports = RegistroEjercicioModel;