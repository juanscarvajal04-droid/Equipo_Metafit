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
            'repeticiones',   re.repeticiones,
            'peso_kg',        re.peso_kg,
            'descanso_seg',   re.descanso_seg,
            'instrucciones',  e.descripcion
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

  // ── RUTINA DEL DÍA (FASE A.3) ─────────────────────────────
  // Devuelve la rutina de UN día con SOLO los ejercicios del grupo
  // muscular del día (el enfoque_muscular de la rutina), opcionalmente
  // sobrescrito por ?grupo_muscular=. El contrato del móvil (todas las
  // rutinas con ejercicios) queda intacto vía getEntrenamientoByCiclo.
  getRutinaDiaria: async (id_ciclo, dia_numero, grupo_muscular) => {
    const [rutinas] = await pool.query(`
      SELECT r.id_rutina, r.nombre_rutina, r.enfoque_muscular, r.dia_numero,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'orden',          re.orden,
            'id_ejercicio',   e.id_ejercicio,
            'nombre_ejercicio', e.nombre_ejercicio,
            'grupo_muscular', e.grupo_muscular,
            'series',         re.series,
            'repeticiones',   re.repeticiones,
            'peso_kg',        re.peso_kg,
            'descanso_seg',   re.descanso_seg,
            'instrucciones',  e.descripcion
          )
        ) AS ejercicios
      FROM RUTINA r
      LEFT JOIN RUTINA_EJERCICIO re ON r.id_rutina = re.id_rutina
      LEFT JOIN EJERCICIO e ON re.id_ejercicio = e.id_ejercicio
      WHERE r.id_ciclo = ? AND r.dia_numero = ?
      GROUP BY r.id_rutina
    `, [id_ciclo, dia_numero]);
    if (!rutinas.length) return null;

    const rutina = rutinas[0];
    if (typeof rutina.ejercicios === 'string') {
      rutina.ejercicios = JSON.parse(rutina.ejercicios);
    }
    const todos = (rutina.ejercicios || [])
      .filter(e => e && e.id_ejercicio != null)
      .sort((a, b) => a.orden - b.orden);

    // Filtro por grupo muscular del día (default: el enfoque de la rutina)
    const grupo = (grupo_muscular || rutina.enfoque_muscular || '').toLowerCase();
    const filtrados = todos.filter(e =>
      (e.grupo_muscular || '').toLowerCase() === grupo
    );

    // Fallback: si ningún ejercicio coincide con el grupo del día
    // (datos mal etiquetados), mostrar TODA la rutina del día para que
    // el afiliado nunca reciba un plan vacío.
    rutina.ejercicios = filtrados.length ? filtrados : todos;
    return rutina;
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

  // Parte 2: PATCH /planes/rutinas/:id_rutina/ejercicios/:id_ejercicio
  // Actualiza la configuración del ejercicio DENTRO de la rutina
  // (series, repeticiones, peso_kg, descanso_seg). Si el mismo ejercicio
  // aparece en varias posiciones se actualizan todas las filas (PK real (id_rutina, orden)).
  updateEjercicioEnRutina: async (id_rutina, id_ejercicio, campos) => {
    const sets = [];
    const vals = [];
    if (campos.series       !== undefined) { sets.push('series=?');       vals.push(campos.series); }
    if (campos.repeticiones !== undefined) { sets.push('repeticiones=?'); vals.push(campos.repeticiones); }
    if (campos.peso_kg      !== undefined) { sets.push('peso_kg=?');      vals.push(campos.peso_kg); }
    if (campos.descanso_seg !== undefined) { sets.push('descanso_seg=?'); vals.push(campos.descanso_seg); }
    if (!sets.length) return 0;
    vals.push(id_rutina, id_ejercicio);
    const [r] = await pool.query(
      `UPDATE RUTINA_EJERCICIO SET ${sets.join(',')} WHERE id_rutina=? AND id_ejercicio=?`,
      vals
    );
    return r.affectedRows;
  },

  // Parte 2: la "descripcion" del ejercicio es EJERCICIO.descripcion (catálogo),
  // opcional en el mismo PATCH para que el entrenador pueda ajustar las instrucciones.
  updateDescripcionEjercicio: async (id_ejercicio, descripcion) => {
    const [r] = await pool.query(
      'UPDATE EJERCICIO SET descripcion = ? WHERE id_ejercicio = ?',
      [descripcion ?? null, id_ejercicio]
    );
    return r.affectedRows;
  },

  deleteRutina: async (id_rutina) => {
    // Transacción: limpia los ejercicios asociados y la rutina (todo o nada)
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM RUTINA_EJERCICIO WHERE id_rutina = ?', [id_rutina]);
      const [r] = await conn.query('DELETE FROM RUTINA WHERE id_rutina = ?', [id_rutina]);
      await conn.commit();
      return r.affectedRows;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
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

  // Parte 2: PATCH /planes/nutricional/:id_plan/detalle/:id_detalle
  //  · cantidad_g: UPDATE directo sobre el alimento en el ciclo.
  //  · num_comida (movida a otra comida): DELETE + INSERT, porque num_comida
  //    es parte de la PK natural triple. El cliente envía el num_comida ANTERIOR
  //    (num_comida_anterior) y el nuevo (num_comida) para poder localizar la fila.
  updateAlimentoEnDetalle: async (id_ciclo, id_alimento, campos) => {
    if (campos.num_comida !== undefined && campos.num_comida_anterior !== undefined
        && Number(campos.num_comida) !== Number(campos.num_comida_anterior)) {
      // Mover fila: borrar en la comida anterior e insertar en la nueva
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [del] = await conn.query(
          'DELETE FROM DETALLE_NUTRICIONAL WHERE id_ciclo=? AND num_comida=? AND id_alimento=?',
          [id_ciclo, campos.num_comida_anterior, id_alimento]
        );
        if (!del.affectedRows) return 0;
        await conn.query(
          'INSERT INTO DETALLE_NUTRICIONAL (id_ciclo, num_comida, id_alimento, cantidad_g) VALUES (?,?,?,?)',
          [id_ciclo, campos.num_comida, id_alimento, campos.cantidad_g ?? 100]
        );
        await conn.commit();
        return 1;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    // Update simple de cantidad_g. Si el cliente indica num_comida_anterior se
    // actualiza SOLO esa comida; sin él, todas las filas del alimento en el ciclo.
    if (campos.cantidad_g !== undefined) {
      let params, where;
      if (campos.num_comida_anterior !== undefined) {
        where = ' WHERE id_ciclo=? AND num_comida=? AND id_alimento=?';
        params = [campos.cantidad_g, id_ciclo, campos.num_comida_anterior, id_alimento];
      } else {
        where = ' WHERE id_ciclo=? AND id_alimento=?';
        params = [campos.cantidad_g, id_ciclo, id_alimento];
      }
      const [r] = await pool.query(
        `UPDATE DETALLE_NUTRICIONAL SET cantidad_g=? ${where}`, params
      );
      return r.affectedRows;
    }
    return 0;
  },

  // Parte 2: DELETE /planes/nutricional/:id_plan/detalle/:id_detalle
  // Si se pasa num_comida se borra SOLO esa fila; si no, todas las del alimento.
  removeAlimentoDeDetalle: async (id_ciclo, id_alimento, num_comida) => {
    if (num_comida !== undefined) {
      const [r] = await pool.query(
        'DELETE FROM DETALLE_NUTRICIONAL WHERE id_ciclo=? AND num_comida=? AND id_alimento=?',
        [id_ciclo, num_comida, id_alimento]
      );
      return r.affectedRows;
    }
    const [r] = await pool.query(
      'DELETE FROM DETALLE_NUTRICIONAL WHERE id_ciclo=? AND id_alimento=?',
      [id_ciclo, id_alimento]
    );
    return r.affectedRows;
  },
};

module.exports = PlanModel;