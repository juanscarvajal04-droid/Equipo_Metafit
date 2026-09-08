// backend/models/notaEjercicioModel.js — Parte 3
// Nota del afiliado sobre un ejercicio de su plan (feedback para el entrenador).
// Upsert idempotente por (id_usuario, id_ejercicio, id_ciclo, fecha_nota):
// el móvil toca "Guardar nota" varias veces sin duplicar filas.
'use strict';

const pool = require('../config/db');

const NotaEjercicioModel = {

  // Upsert: si ya existe nota del usuario para ese ejercicio/ciclo/día → actualiza;
  // si no → inserta. Devuelve el id_nota resultante.
  create: async (datos) => {
    const { id_usuario, id_ejercicio, id_ciclo, nota } = datos;
    const fecha_nota = datos.fecha_nota || new Date().toISOString().slice(0, 10);

    const [existe] = await pool.query(
      `SELECT id_nota FROM NOTA_EJERCICIO
        WHERE id_usuario=? AND id_ejercicio=? AND id_ciclo=? AND fecha_nota=?`,
      [id_usuario, id_ejercicio, id_ciclo, fecha_nota]
    );

    if (existe.length) {
      await pool.query(
        'UPDATE NOTA_EJERCICIO SET nota=? WHERE id_nota=?',
        [nota ?? null, existe[0].id_nota]
      );
      return existe[0].id_nota;
    }

    const [r] = await pool.query(
      `INSERT INTO NOTA_EJERCICIO (id_usuario, id_ejercicio, id_ciclo, nota, fecha_nota)
       VALUES (?,?,?,?,?)`,
      [id_usuario, id_ejercicio, id_ciclo, nota ?? null, fecha_nota]
    );
    return r.insertId;
  },

  // Notas del afiliado con el nombre del ejercicio (para listar/agrupar en web y móvil)
  findByUsuario: async (id_usuario) => {
    const [rows] = await pool.query(`
      SELECT n.id_nota, n.id_usuario, n.id_ejercicio, n.id_ciclo,
             n.nota, n.fecha_nota, e.nombre_ejercicio
      FROM NOTA_EJERCICIO n
      JOIN EJERCICIO e ON e.id_ejercicio = n.id_ejercicio
      WHERE n.id_usuario = ?
      ORDER BY n.fecha_nota DESC, n.id_nota DESC
    `, [id_usuario]);
    return rows;
  },

  // Notas del afiliado para UN ciclo concreto (la pantalla móvil de rutina)
  findByUsuarioYCiclo: async (id_usuario, id_ciclo) => {
    const [rows] = await pool.query(`
      SELECT n.id_nota, n.id_usuario, n.id_ejercicio, n.id_ciclo,
             n.nota, n.fecha_nota, e.nombre_ejercicio
      FROM NOTA_EJERCICIO n
      JOIN EJERCICIO e ON e.id_ejercicio = n.id_ejercicio
      WHERE n.id_usuario = ? AND n.id_ciclo = ?
      ORDER BY n.fecha_nota DESC, n.id_nota DESC
    `, [id_usuario, id_ciclo]);
    return rows;
  },

  // Editar nota propia (verifica propiedad; solo el afiliado edita las suyas)
  update: async (id_nota, id_usuario, nota) => {
    const [r] = await pool.query(
      'UPDATE NOTA_EJERCICIO SET nota=? WHERE id_nota=? AND id_usuario=?',
      [nota ?? null, id_nota, id_usuario]
    );
    return r.affectedRows;
  },

  // Borrar nota propia
  remove: async (id_nota, id_usuario) => {
    const [r] = await pool.query(
      'DELETE FROM NOTA_EJERCICIO WHERE id_nota=? AND id_usuario=?',
      [id_nota, id_usuario]
    );
    return r.affectedRows;
  },
};

module.exports = NotaEjercicioModel;