// models/cicloModel.js
const pool = require('../config/db');

const CicloModel = {

  findByAfiliado: async (id_afiliado) => {
    const [rows] = await pool.query(`
      SELECT c.*, ccn.numero_ciclo
      FROM CICLO c
      JOIN ciclo_con_numero ccn ON c.id_ciclo = ccn.id_ciclo
      WHERE c.id_afiliado = ?
      ORDER BY c.fecha_inicio_ciclo DESC
    `, [id_afiliado]);
    return rows;
  },

  create: async (id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Cierra ciclos anteriores activos
      await conn.query(
        'UPDATE CICLO SET activo = 0 WHERE id_afiliado = ? AND activo = 1',
        [id_afiliado]
      );
      const [result] = await conn.query(
        'INSERT INTO CICLO (id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo, activo) VALUES (?,?,?,1)',
        [id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo]
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
    if (campos.fecha_fin_ciclo)            { sets.push('fecha_fin_ciclo=?'); vals.push(campos.fecha_fin_ciclo); }
    if (!sets.length) return 0;
    vals.push(id);
    const [r] = await pool.query(`UPDATE CICLO SET ${sets.join(',')} WHERE id_ciclo=?`, vals);
    return r.affectedRows;
  },
};

module.exports = CicloModel;