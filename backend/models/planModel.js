// backend/models/planModel.js
// ─── Planes de entrenamiento y nutricionales ──────────────────
// Schema real (metafit.sql):
//   PLAN_ENTRENAMIENTO: id_ciclo (PK=FK), modificado_por, observaciones
//                       ⚠️ SIN es_automatico (eliminado en diseño, YAGNI)
//   RUTINA: id_rutina, id_ciclo (FK directo, NO id_plan_entrenamiento)
//   PLAN_NUTRICIONAL: id_ciclo (PK=FK), calorias_objetivo, num_comidas, modificado_por, observaciones
//   DETALLE_NUTRICIONAL: id_ciclo, num_comida, id_alimento, cantidad_g
'use strict';

const pool = require('../config/db');

const PlanModel = {

  // ── ENTRENAMIENTO ─────────────────────────────────────────
  getEntrenamientoByCiclo: async (id_ciclo) => {
    const [planes] = await pool.query(
      'SELECT id_ciclo, modificado_por, observaciones FROM PLAN_ENTRENAMIENTO WHERE id_ciclo = ?',
      [id_ciclo]
    );
    if (!planes.length) return null;
    const plan = planes[0];

    // RUTINA referencia id_ciclo directamente (no id_plan_entrenamiento)
    const [rutinas] = await pool.query(`
      SELECT r.id_rutina, r.nombre_rutina, r.enfoque_muscular, r.dia_numero,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'orden',          re.orden,
            'id_ejercicio',   e.id_ejercicio,
            'nombre_ejercicio', e.nombre_ejercicio,
            'grupo_muscular', e.grupo_muscular,
            'series',         re.series,
            'repeticiones',   re.repeticiones
          )
        ) AS ejercicios
      FROM RUTINA r
      LEFT JOIN RUTINA_EJERCICIO re ON r.id_rutina = re.id_rutina
      LEFT JOIN EJERCICIO e ON re.id_ejercicio = e.id_ejercicio
      WHERE r.id_ciclo = ?
      GROUP BY r.id_rutina
      ORDER BY r.dia_numero
    `, [id_ciclo]);

    rutinas.forEach(r => {
      if (typeof r.ejercicios === 'string') {
        r.ejercicios = JSON.parse(r.ejercicios);
      }
      r.ejercicios = (r.ejercicios || []).filter(e => e && e.id_ejercicio != null);
    });
    plan.rutinas = rutinas;
    return plan;
  },

  // Sin es_automatico (eliminado en schema: decisión YAGNI)
  createEntrenamiento: async (id_ciclo, modificado_por, observaciones) => {
    const [r] = await pool.query(
      `INSERT INTO PLAN_ENTRENAMIENTO (id_ciclo, modificado_por, observaciones)
       VALUES (?,?,?)`,
      [id_ciclo, modificado_por || null, observaciones || null]
    );
    return r.insertId;
  },

  updateEntrenamiento: async (id_ciclo, campos, modificado_por) => {
    const [r] = await pool.query(
      `UPDATE PLAN_ENTRENAMIENTO
       SET modificado_por=?, observaciones=?
       WHERE id_ciclo=?`,
      [modificado_por, campos.observaciones || null, id_ciclo]
    );
    return r.affectedRows;
  },

  // ── RUTINAS ───────────────────────────────────────────────
  // RUTINA.id_ciclo es FK directo a PLAN_ENTRENAMIENTO.id_ciclo
  createRutina: async (id_ciclo, nombre_rutina, enfoque_muscular, dia_numero) => {
    const [r] = await pool.query(
      'INSERT INTO RUTINA (id_ciclo, nombre_rutina, enfoque_muscular, dia_numero) VALUES (?,?,?,?)',
      [id_ciclo, nombre_rutina, enfoque_muscular, dia_numero]
    );
    return r.insertId;
  },

  addEjercicioToRutina: async (id_rutina, id_ejercicio, series, repeticiones, orden) => {
    await pool.query(
      'INSERT INTO RUTINA_EJERCICIO (id_rutina, orden, id_ejercicio, series, repeticiones) VALUES (?,?,?,?,?)',
      [id_rutina, orden, id_ejercicio, series, repeticiones]
    );
  },

  removeEjercicioFromRutina: async (id_rutina, id_ejercicio) => {
    const [r] = await pool.query(
      'DELETE FROM RUTINA_EJERCICIO WHERE id_rutina=? AND id_ejercicio=?',
      [id_rutina, id_ejercicio]
    );
    return r.affectedRows;
  },

  deleteRutina: async (id_rutina) => {
    await pool.query('DELETE FROM RUTINA_EJERCICIO WHERE id_rutina = ?', [id_rutina]);
    const [r] = await pool.query('DELETE FROM RUTINA WHERE id_rutina = ?', [id_rutina]);
    return r.affectedRows;
  },

  // ── NUTRICIONAL ───────────────────────────────────────────
  // Schema: calorias_objetivo (no calorias_estimadas), num_comidas (no num_comidas_diarias)
  // DETALLE_NUTRICIONAL: cantidad_g (no cantidad), num_comida (no numero_comida)
  getNutricionalByCiclo: async (id_ciclo) => {
    const [planes] = await pool.query(
      'SELECT id_ciclo, calorias_objetivo, num_comidas, modificado_por, observaciones FROM PLAN_NUTRICIONAL WHERE id_ciclo = ?',
      [id_ciclo]
    );
    if (!planes.length) return null;
    const plan = planes[0];

    const [detalle] = await pool.query(`
      SELECT dn.num_comida, dn.id_alimento, dn.cantidad_g,
             al.nombre_alimento, al.proteinas, al.carbohidratos, al.grasas,
             ROUND((al.proteinas*4 + al.carbohidratos*4 + al.grasas*9), 2) AS calorias_por_100g
      FROM DETALLE_NUTRICIONAL dn
      JOIN ALIMENTO al ON dn.id_alimento = al.id_alimento
      WHERE dn.id_ciclo = ?
      ORDER BY dn.num_comida, al.nombre_alimento
    `, [id_ciclo]);
    plan.detalle = detalle;
    return plan;
  },

  createNutricional: async (id_ciclo, calorias_objetivo, num_comidas, modificado_por, observaciones) => {
    const [r] = await pool.query(
      `INSERT INTO PLAN_NUTRICIONAL
         (id_ciclo, calorias_objetivo, num_comidas, modificado_por, observaciones)
       VALUES (?,?,?,?,?)`,
      [id_ciclo, calorias_objetivo, num_comidas, modificado_por || null, observaciones || null]
    );
    return r.insertId;
  },

  updateNutricional: async (id_ciclo, campos, modificado_por) => {
    const [r] = await pool.query(
      `UPDATE PLAN_NUTRICIONAL
       SET calorias_objetivo=?, num_comidas=?, modificado_por=?, observaciones=?
       WHERE id_ciclo=?`,
      [campos.calorias_objetivo, campos.num_comidas, modificado_por, campos.observaciones || null, id_ciclo]
    );
    return r.affectedRows;
  },

  clearDetalleNutricional: async (id_ciclo) => {
    const [r] = await pool.query(
      'DELETE FROM DETALLE_NUTRICIONAL WHERE id_ciclo = ?',
      [id_ciclo]
    );
    return r.affectedRows;
  },

  // DETALLE: PK natural (id_ciclo, num_comida, id_alimento)
  addAlimentoToDetalle: async (id_ciclo, id_alimento, num_comida, cantidad_g) => {
    await pool.query(
      'INSERT INTO DETALLE_NUTRICIONAL (id_ciclo, num_comida, id_alimento, cantidad_g) VALUES (?,?,?,?)',
      [id_ciclo, num_comida, id_alimento, cantidad_g]
    );
  },
};

module.exports = PlanModel;