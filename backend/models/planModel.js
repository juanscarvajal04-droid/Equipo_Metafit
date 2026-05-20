// models/planModel.js
// ─── Planes de entrenamiento y nutricionales ──────────────────
const pool = require('../config/db');

const PlanModel = {

  // ── ENTRENAMIENTO ─────────────────────────────────────────
  getEntrenamientoByCiclo: async (id_ciclo) => {
    const [planes] = await pool.query(
      'SELECT * FROM PLAN_ENTRENAMIENTO WHERE id_ciclo = ?', [id_ciclo]
    );
    if (!planes.length) return null;
    const plan = planes[0];

    const [rutinas] = await pool.query(
      'SELECT * FROM RUTINA WHERE id_plan_entrenamiento = ? ORDER BY dia_numero',
      [plan.id_plan_entrenamiento]
    );
    for (const rut of rutinas) {
      const [ejercicios] = await pool.query(`
        SELECT re.*, e.nombre_ejercicio, e.grupo_muscular, e.descripcion, e.nivel_minimo
        FROM RUTINA_EJERCICIO re
        JOIN EJERCICIO e ON re.id_ejercicio = e.id_ejercicio
        WHERE re.id_rutina = ? ORDER BY re.orden
      `, [rut.id_rutina]);
      rut.ejercicios = ejercicios;
    }
    plan.rutinas = rutinas;
    return plan;
  },

  createEntrenamiento: async (id_ciclo, es_automatico, modificado_por, observaciones) => {
    const [r] = await pool.query(
      `INSERT INTO PLAN_ENTRENAMIENTO
         (id_ciclo, es_automatico, modificado_por, observaciones)
       VALUES (?,?,?,?)`,
      [id_ciclo, es_automatico ?? 1, modificado_por, observaciones || null]
    );
    return r.insertId;
  },

  updateEntrenamiento: async (id, campos, modificado_por) => {
    const [r] = await pool.query(
      `UPDATE PLAN_ENTRENAMIENTO
       SET es_automatico=?, modificado_por=?, observaciones=?
       WHERE id_plan_entrenamiento=?`,
      [campos.es_automatico ?? 0, modificado_por, campos.observaciones || null, id]
    );
    return r.affectedRows;
  },

  // ── RUTINAS ───────────────────────────────────────────────
  createRutina: async (id_plan_entrenamiento, nombre_rutina, enfoque_muscular, dia_numero) => {
    const [r] = await pool.query(
      'INSERT INTO RUTINA (id_plan_entrenamiento, nombre_rutina, enfoque_muscular, dia_numero) VALUES (?,?,?,?)',
      [id_plan_entrenamiento, nombre_rutina, enfoque_muscular, dia_numero]
    );
    return r.insertId;
  },

  addEjercicioToRutina: async (id_rutina, id_ejercicio, series, repeticiones, orden) => {
    await pool.query(
      'INSERT INTO RUTINA_EJERCICIO (id_rutina, id_ejercicio, series, repeticiones, orden) VALUES (?,?,?,?,?)',
      [id_rutina, id_ejercicio, series, repeticiones, orden]
    );
  },

  removeEjercicioFromRutina: async (id_rutina, id_ejercicio) => {
    const [r] = await pool.query(
      'DELETE FROM RUTINA_EJERCICIO WHERE id_rutina=? AND id_ejercicio=?',
      [id_rutina, id_ejercicio]
    );
    return r.affectedRows;
  },

  // ── NUTRICIONAL ───────────────────────────────────────────
  getNutricionalByCiclo: async (id_ciclo) => {
    const [planes] = await pool.query(
      'SELECT * FROM PLAN_NUTRICIONAL WHERE id_ciclo = ?', [id_ciclo]
    );
    if (!planes.length) return null;
    const plan = planes[0];

    const [detalle] = await pool.query(`
      SELECT dn.*, al.nombre_alimento, al.proteinas, al.carbohidratos, al.grasas,
             ROUND((al.proteinas*4 + al.carbohidratos*4 + al.grasas*9), 2) AS calorias_por_100g
      FROM DETALLE_NUTRICIONAL dn
      JOIN ALIMENTO al ON dn.id_alimento = al.id_alimento
      WHERE dn.id_plan_nutricional = ?
      ORDER BY dn.numero_comida, al.nombre_alimento
    `, [plan.id_plan_nutricional]);
    plan.detalle = detalle;
    return plan;
  },

  createNutricional: async (id_ciclo, calorias_estimadas, num_comidas_diarias, modificado_por, observaciones) => {
    const [r] = await pool.query(
      `INSERT INTO PLAN_NUTRICIONAL
         (id_ciclo, calorias_estimadas, num_comidas_diarias, es_automatico, modificado_por, observaciones)
       VALUES (?,?,?,0,?,?)`,
      [id_ciclo, calorias_estimadas, num_comidas_diarias, modificado_por, observaciones || null]
    );
    return r.insertId;
  },

  addAlimentoToDetalle: async (id_plan_nutricional, id_alimento, numero_comida, cantidad) => {
    await pool.query(
      'INSERT INTO DETALLE_NUTRICIONAL (id_plan_nutricional, id_alimento, numero_comida, cantidad) VALUES (?,?,?,?)',
      [id_plan_nutricional, id_alimento, numero_comida, cantidad]
    );
  },
};

module.exports = PlanModel;