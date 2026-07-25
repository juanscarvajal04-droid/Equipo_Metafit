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
};

module.exports = SeguimientoDiarioModel;
