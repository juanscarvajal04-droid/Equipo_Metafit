// backend/models/progresoDiarioModel.js
// FASE 1: PROGRESO_DIARIO — resumen diario del afiliado (1 fila por día).
// Agrega: calorías (CONSUMO_ALIMENTO_REAL), agua (REGISTRO_AGUA) y ejercicios (REGISTRO_EJERCICIO).
'use strict';

const pool = require('../config/db');

const ProgresoDiarioModel = {

  // Recalcula los agregados de un día desde las tablas fuente y hace UPSERT.
  // conn es opcional: si se pasa (transacción del registro), se usa esa conexión.
  sincronizar: async (conn, id_usuario, fecha) => {
    const db = conn || pool;
    const [[fila]] = await db.query(
      `SELECT
         COALESCE((SELECT SUM(calorias_consumidas) FROM CONSUMO_ALIMENTO_REAL WHERE id_usuario = ? AND fecha = ?), 0) AS calorias_consumidas,
         COALESCE((SELECT vasos FROM REGISTRO_AGUA WHERE id_usuario = ? AND fecha = ?), 0) AS agua_vasos,
         (SELECT COUNT(*) FROM REGISTRO_EJERCICIO WHERE id_usuario = ? AND fecha = ?) AS ejercicios_realizados`,
      [id_usuario, fecha, id_usuario, fecha, id_usuario, fecha]
    );

    await db.query(
      `INSERT INTO PROGRESO_DIARIO
         (id_usuario, fecha, calorias_consumidas, agua_vasos, ejercicios_realizados)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         calorias_consumidas   = VALUES(calorias_consumidas),
         agua_vasos            = VALUES(agua_vasos),
         ejercicios_realizados = VALUES(ejercicios_realizados),
         updated_at            = NOW()`,
      [id_usuario, fecha, fila.calorias_consumidas, fila.agua_vasos, fila.ejercicios_realizados]
    );

    // Estado actual (energía/ánimo/observaciones) se conserva si ya existía fila.
    const [rows] = await db.query(
      `SELECT id_progreso_diario, id_usuario, fecha,
              calorias_consumidas, agua_vasos, ejercicios_realizados,
              duracion_minutos, nivel_energia, estado_animo, observaciones,
              created_at, updated_at
       FROM PROGRESO_DIARIO
       WHERE id_usuario = ? AND fecha = ?`,
      [id_usuario, fecha]
    );
    return rows[0] || { id_usuario, fecha };
  },

  // Guarda el estado subjetivo del día (energía, ánimo, observaciones, duración).
  // No toca los agregados calculados (calorías/agua/ejercicios).
  guardarEstado: async (id_usuario, fecha, { nivel_energia, estado_animo, observaciones, duracion_minutos }) => {
    await pool.query(
      `INSERT INTO PROGRESO_DIARIO
         (id_usuario, fecha, nivel_energia, estado_animo, observaciones, duracion_minutos)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         nivel_energia    = COALESCE(VALUES(nivel_energia), nivel_energia),
         estado_animo     = COALESCE(VALUES(estado_animo), estado_animo),
         observaciones    = COALESCE(VALUES(observaciones), observaciones),
         duracion_minutos = COALESCE(VALUES(duracion_minutos), duracion_minutos),
         updated_at       = NOW()`,
      [id_usuario, fecha, nivel_energia || null, estado_animo || null,
       observaciones || null, duracion_minutos || null]
    );
    const [rows] = await pool.query(
      `SELECT * FROM PROGRESO_DIARIO WHERE id_usuario = ? AND fecha = ?`,
      [id_usuario, fecha]
    );
    return rows[0];
  },

  getByFecha: async (id_usuario, fecha) => {
    const [rows] = await pool.query(
      `SELECT * FROM PROGRESO_DIARIO WHERE id_usuario = ? AND fecha = ?`,
      [id_usuario, fecha]
    );
    return rows[0];
  },

  getHistorial: async (id_usuario, { fechaInicio, fechaFin }) => {
    let sql = `SELECT * FROM PROGRESO_DIARIO WHERE id_usuario = ?`;
    const params = [id_usuario];
    if (fechaInicio) { sql += ` AND fecha >= ?`; params.push(fechaInicio); }
    if (fechaFin)    { sql += ` AND fecha <= ?`; params.push(fechaFin); }
    sql += ` ORDER BY fecha DESC LIMIT 90`;
    const [rows] = await pool.query(sql, params);
    return rows;
  },
};

module.exports = ProgresoDiarioModel;