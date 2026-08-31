const pool = require('../config/db');

const SeguimientoDiarioModel = {

  saveProgresoEjercicio: async (idUsuario, idCiclo, fecha, ejercicios) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const ej of ejercicios) {
        await conn.query(
          `INSERT INTO PROGRESO_EJERCICIO_DIARIO
             (id_usuario, id_ciclo, id_ejercicio, fecha, completado)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE completado = VALUES(completado), updated_at = NOW()`,
          [idUsuario, idCiclo, ej.id_ejercicio, fecha, ej.completado ? 1 : 0]
        );
      }
      await conn.commit();
      return { message: 'Progreso guardado correctamente' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  getProgresoEjercicio: async (idUsuario, idCiclo, fecha) => {
    const [rows] = await pool.query(
      `SELECT id_ejercicio, completado
       FROM PROGRESO_EJERCICIO_DIARIO
       WHERE id_usuario = ? AND id_ciclo = ? AND fecha = ?`,
      [idUsuario, idCiclo, fecha]
    );
    return rows;
  },

  saveAgua: async (idUsuario, fecha, vasos) => {
    await pool.query(
      `INSERT INTO REGISTRO_AGUA (id_usuario, fecha, vasos)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE vasos = VALUES(vasos), updated_at = NOW()`,
      [idUsuario, fecha, vasos]
    );
    return { message: 'Agua registrada correctamente' };
  },

  getAgua: async (idUsuario, fecha) => {
    const [rows] = await pool.query(
      `SELECT vasos FROM REGISTRO_AGUA WHERE id_usuario = ? AND fecha = ?`,
      [idUsuario, fecha]
    );
    return rows.length ? rows[0] : { vasos: 0 };
  },

  saveConsumoAlimento: async (idUsuario, idCiclo, fecha, alimentos) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const al of alimentos) {
        await conn.query(
          `INSERT INTO CONSUMO_ALIMENTO_DIARIO
             (id_usuario, id_ciclo, id_alimento, num_comida, fecha, consumido)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE consumido = VALUES(consumido), updated_at = NOW()`,
          [idUsuario, idCiclo, al.id_alimento, al.num_comida, fecha, al.consumido ? 1 : 0]
        );
      }
      await conn.commit();
      return { message: 'Consumo guardado correctamente' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  getAguaHistorial: async (idUsuario, fechaInicio, fechaFin) => {
    let sql = `SELECT fecha, vasos FROM REGISTRO_AGUA WHERE id_usuario = ?`;
    const params = [idUsuario];
    if (fechaInicio) { sql += ` AND fecha >= ?`; params.push(fechaInicio); }
    if (fechaFin)   { sql += ` AND fecha <= ?`; params.push(fechaFin); }
    sql += ` ORDER BY fecha DESC LIMIT 30`;
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  getConsumoHistorial: async (idUsuario, fechaInicio, fechaFin) => {
    let sql = `SELECT ca.fecha, ca.id_ciclo, ca.id_alimento, ca.num_comida, ca.consumido,
                      al.nombre_alimento
               FROM CONSUMO_ALIMENTO_DIARIO ca
               JOIN ALIMENTO al ON ca.id_alimento = al.id_alimento
               WHERE ca.id_usuario = ?`;
    const params = [idUsuario];
    if (fechaInicio) { sql += ` AND ca.fecha >= ?`; params.push(fechaInicio); }
    if (fechaFin)   { sql += ` AND ca.fecha <= ?`; params.push(fechaFin); }
    sql += ` ORDER BY ca.fecha DESC, ca.num_comida LIMIT 100`;
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  getProgresoEjercicioHistorial: async (idUsuario, idCiclo, fechaInicio, fechaFin) => {
    let sql = `SELECT pe.fecha, pe.id_ejercicio, pe.completado, e.nombre_ejercicio
               FROM PROGRESO_EJERCICIO_DIARIO pe
               JOIN EJERCICIO e ON pe.id_ejercicio = e.id_ejercicio
               WHERE pe.id_usuario = ?`;
    const params = [idUsuario];
    if (idCiclo)    { sql += ` AND pe.id_ciclo = ?`; params.push(idCiclo); }
    if (fechaInicio) { sql += ` AND pe.fecha >= ?`; params.push(fechaInicio); }
    if (fechaFin)   { sql += ` AND pe.fecha <= ?`; params.push(fechaFin); }
    sql += ` ORDER BY pe.fecha DESC, pe.id_ejercicio LIMIT 200`;
    const [rows] = await pool.query(sql, params);
    return rows;
  },
};

module.exports = SeguimientoDiarioModel;
