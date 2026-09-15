// backend/models/registroEjercicioModel.js
// ─── Consultas SQL de REGISTRO_EJERCICIO — ejecución REAL ─────
// Capa de acceso a datos de REGISTRO_EJERCICIO: la ejecución real
// (series/reps/peso/volumen) que el afiliado anota al entrenar un ejercicio
// de su rutina. El `insertar` se ejecuta sobre una CONEXIÓN compartida (conn)
// para participar en la transacción que abre RegistroService (FASE 1);
// las lecturas (historial y evolución) usan el pool.
// El volumen se calcula SIEMPRE en SQL: series × reps × peso (peso 0 si null).
'use strict';

const pool = require('../config/db');

const RegistroEjercicioModel = {

  /**
   * insertar — Inserta un registro de ejecución real de un ejercicio.
   * Se llama con la conexión (conn) de la transacción abierta por
   * RegistroService: las FK id_ciclo, id_rutina y orden deben ser válidas
   * (el backend ya validó la pertenencia del afiliado al ciclo/rutina).
   * peso_utilizado_kg y notas nullables → se guardan como NULL.
   *
   * @param {import('mysql2/promise').PoolConnection} conn - Conexión transaccional.
   * @param {Object} datos - Datos del registro:
   *   { id_usuario, id_ciclo, id_rutina, orden, fecha, series, repeticiones,
   *     peso_utilizado_kg, notas }
   * @returns {Promise<number>} id_registro autogenerado (insertId).
   */
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

  /**
   * getHistorial — Registros REALES de ejecución del afiliado con el nombre del
   * ejercicio y su grupo muscular (JOIN con RUTINA_EJERCICIO y EJERCICIO).
   * Filtros opcionales por ciclo y rango de fechas; siempre acotado por
   * id_usuario (el token manda) y limitado a 300 registros (protección de
   * volumen en pantallas de historial). Orden: más reciente primero.
   *
   * @param {number} id_usuario - Afiliado autenticado (req.user.sub).
   * @param {Object} [filtros]  - { id_ciclo, fechaInicio, fechaFin } (todos opcionales).
   * @returns {Promise<Array<Object>>} Registros con volumen calculado (series×reps×peso).
   */
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

  /**
   * getEvolucion — Progresión de cargas de UN ejercicio a lo largo del tiempo
   * (para el gráfico de evolución). Filtra por id_usuario + id_ejercicio;
   * rango de fechas opcional. Sin LIMIT: el gráfico necesita el histórico
   * completo, y ya está acotado a un solo ejercicio. Orden: cronológico.
   *
   * @param {number} id_usuario   - Afiliado autenticado (req.user.sub).
   * @param {number} id_ejercicio - Ejercicio a graficar.
   * @param {Object} [filtros]    - { fechaInicio, fechaFin } (opcionales).
   * @returns {Promise<Array<Object>>} Puntos de evolución con volumen calculado.
   */
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