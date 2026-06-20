// models/cicloModel.js
// FIX 2: Corregidos nombres de columna para coincidir con el schema real de la tabla CICLO.
//  - id_afiliado        → id_usuario        (FK a AFILIADO.id_usuario)
//  - fecha_inicio_ciclo → fecha_inicio       (nombre real en el schema)
//  - fecha_fin_ciclo    → fecha_fin          (nombre real en el schema)
//  - Agregados campos NOT NULL: objetivo_fisico, nivel_experiencia, disponibilidad_dias, registrado_por
'use strict';

const pool = require('../config/db');

const CicloModel = {

  findByAfiliado: async (id_usuario) => {
    const [rows] = await pool.query(`
      SELECT c.*,
        (
          SELECT COUNT(*)
          FROM CICLO c2
          WHERE c2.id_usuario   = c.id_usuario
            AND c2.fecha_inicio <= c.fecha_inicio
        ) AS numero_ciclo
      FROM CICLO c
      WHERE c.id_usuario = ?
      ORDER BY c.fecha_inicio DESC
    `, [id_usuario]);
    return rows;
  },

  // FIX 2: create ahora recibe un objeto con todos los campos requeridos por la tabla CICLO.
  create: async (datos) => {
    const {
      id_usuario,
      fecha_inicio,
      fecha_fin,
      objetivo_fisico,
      nivel_experiencia,
      disponibilidad_dias,
      grupo_muscular_prioritario = null,
      observaciones              = null,
      registrado_por,
    } = datos;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Cierra ciclos anteriores activos del mismo afiliado
      await conn.query(
        'UPDATE CICLO SET activo = 0 WHERE id_usuario = ? AND activo = 1',
        [id_usuario]
      );
      const [result] = await conn.query(
        `INSERT INTO CICLO
           (id_usuario, fecha_inicio, fecha_fin, activo,
            objetivo_fisico, nivel_experiencia, disponibilidad_dias,
            grupo_muscular_prioritario, observaciones, registrado_por)
         VALUES (?,?,?,1,?,?,?,?,?,?)`,
        [
          id_usuario,
          fecha_inicio,
          fecha_fin,
          objetivo_fisico,
          nivel_experiencia,
          disponibilidad_dias,
          grupo_muscular_prioritario,
          observaciones,
          registrado_por,
        ]
      );
      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  findById: async (id_ciclo) => {
    const [rows] = await pool.query('SELECT * FROM CICLO WHERE id_ciclo = ?', [id_ciclo]);
    return rows[0] || null;
  },

  update: async (id, campos) => {
    const sets = [];
    const vals = [];
    if (campos.activo    !== undefined) { sets.push('activo=?');    vals.push(campos.activo); }
    if (campos.fecha_fin !== undefined) { sets.push('fecha_fin=?'); vals.push(campos.fecha_fin); }
    if (!sets.length) return 0;
    vals.push(id);
    const [r] = await pool.query(`UPDATE CICLO SET ${sets.join(',')} WHERE id_ciclo=?`, vals);
    return r.affectedRows;
  },
};

module.exports = CicloModel;