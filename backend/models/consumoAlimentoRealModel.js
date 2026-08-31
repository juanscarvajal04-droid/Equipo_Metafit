// backend/models/consumoAlimentoRealModel.js
// FASE 1: CONSUMO_ALIMENTO_REAL — lo que el afiliado REALMENTE consumió de su plan.
// calorias_consumidas = fórmula Atwater ((P*4)+(C*4)+(G*9)) x cantidad/100 (igual que v_alimento_calorias).
'use strict';

const pool = require('../config/db');

const ConsumoAlimentoRealModel = {

  // Inserta en la transacción abierta por el servicio (conn).
  // Las calorías se derivan en la MISMA query desde ALIMENTO (evita doble roundtrip).
  insertar: async (conn, datos) => {
    const { id_usuario, id_ciclo, num_comida, id_alimento, fecha, cantidad_g_consumida } = datos;
    const [r] = await conn.query(
      `INSERT INTO CONSUMO_ALIMENTO_REAL
         (id_usuario, id_ciclo, num_comida, id_alimento, fecha,
          cantidad_g_consumida, calorias_consumidas)
       SELECT ?, ?, ?, ?, ?, ?,
              ROUND(((a.proteinas * 4) + (a.carbohidratos * 4) + (a.grasas * 9)) * ? / 100, 2)
       FROM ALIMENTO a
       WHERE a.id_alimento = ?
       LIMIT 1`,
      [id_usuario, id_ciclo, num_comida, id_alimento, fecha,
       cantidad_g_consumida, cantidad_g_consumida, id_alimento]
    );
    if (r.affectedRows === 0) {
      const err = new Error('El alimento no existe en el catálogo');
      err.code = 'ALIMENTO_NO_ENCONTRADO';
      throw err;
    }
    // Recuperar el valor calculado para devolverlo al cliente
    const [cal] = await conn.query(
      `SELECT calorias_consumidas FROM CONSUMO_ALIMENTO_REAL WHERE id_consumo = ?`,
      [r.insertId]
    );
    return { id_consumo: r.insertId, calorias_consumidas: cal.length ? cal[0].calorias_consumidas : null };
  },

  getHistorial: async (id_usuario, { id_ciclo, fechaInicio, fechaFin }) => {
    let sql = `
      SELECT c.id_consumo, c.id_ciclo, c.num_comida, c.fecha,
             c.cantidad_g_consumida, c.calorias_consumidas,
             a.id_alimento, a.nombre_alimento
      FROM CONSUMO_ALIMENTO_REAL c
      JOIN ALIMENTO a ON c.id_alimento = a.id_alimento
      WHERE c.id_usuario = ?`;
    const params = [id_usuario];
    if (id_ciclo)    { sql += ` AND c.id_ciclo = ?`; params.push(id_ciclo); }
    if (fechaInicio) { sql += ` AND c.fecha >= ?`;   params.push(fechaInicio); }
    if (fechaFin)    { sql += ` AND c.fecha <= ?`;   params.push(fechaFin); }
    sql += ` ORDER BY c.fecha DESC, c.num_comida, c.id_consumo DESC LIMIT 300`;
    const [rows] = await pool.query(sql, params);
    return rows;
  },
};

module.exports = ConsumoAlimentoRealModel;