// models/cicloModel.js
const pool = require('../config/db');

const CicloModel = {

  findByAfiliado: async (id_afiliado) => {
    const [rows] = await pool.query(`
      SELECT c.*, ccn.numero_ciclo
      FROM CICLO c
      JOIN ciclo_con_numero ccn ON c.id_ciclo = ccn.id_ciclo
      WHERE c.id_usuario = ?
      ORDER BY c.fecha_inicio DESC
    `, [id_afiliado]);
    return rows;
  },

  create: async (id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo, registrado_por, objetivo_fisico = 'Mantenimiento', nivel_experiencia = 'Principiante', disponibilidad_dias = 3) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Cierra ciclos anteriores activos
      await conn.query(
        'UPDATE CICLO SET activo = 0 WHERE id_usuario = ? AND activo = 1',
        [id_afiliado]
      );
      const [result] = await conn.query(
        'INSERT INTO CICLO (id_usuario, fecha_inicio, fecha_fin, activo, registrado_por, objetivo_fisico, nivel_experiencia, disponibilidad_dias) VALUES (?,?,?,1,?,?,?,?)',
        [id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo, registrado_por, objetivo_fisico, nivel_experiencia, disponibilidad_dias]
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

  update: async (id, campos) => {
    const sets = [];
    const vals = [];
    if (campos.activo !== undefined)       { sets.push('activo=?');          vals.push(campos.activo); }
    if (campos.fecha_fin)                  { sets.push('fecha_fin=?');       vals.push(campos.fecha_fin); }
    if (!sets.length) return 0;
    vals.push(id);
    const [r] = await pool.query(`UPDATE CICLO SET ${sets.join(',')} WHERE id_ciclo=?`, vals);
    return r.affectedRows;
  },
};

module.exports = CicloModel;