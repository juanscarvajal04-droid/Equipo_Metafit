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

  // CRUD completo: PATCH /ciclos/:id_ciclo (Parte 1, HU "Ciclos gestionables")
  // Actualiza SOLO los campos enviados. Disponibilidad 1-7, fechas con
  // fecha_fin > fecha_inicio (CHECK real del schema) validadas en el service.
  update: async (id, campos) => {
    const sets = [];
    const vals = [];
    if (campos.activo                 !== undefined) { sets.push('activo=?');                  vals.push(campos.activo); }
    if (campos.fecha_inicio           !== undefined) { sets.push('fecha_inicio=?');            vals.push(campos.fecha_inicio); }
    if (campos.fecha_fin              !== undefined) { sets.push('fecha_fin=?');               vals.push(campos.fecha_fin); }
    if (campos.objetivo_fisico        !== undefined) { sets.push('objetivo_fisico=?');         vals.push(campos.objetivo_fisico); }
    if (campos.nivel_experiencia      !== undefined) { sets.push('nivel_experiencia=?');       vals.push(campos.nivel_experiencia); }
    if (campos.disponibilidad_dias    !== undefined) { sets.push('disponibilidad_dias=?');     vals.push(campos.disponibilidad_dias); }
    if (campos.grupo_muscular_prioritario !== undefined) { sets.push('grupo_muscular_prioritario=?'); vals.push(campos.grupo_muscular_prioritario); }
    if ('observaciones' in campos)    { sets.push('observaciones=?');        vals.push(campos.observaciones ?? null); }
    if (!sets.length) return 0;
    vals.push(id);
    const [r] = await pool.query(`UPDATE CICLO SET ${sets.join(',')} WHERE id_ciclo=?`, vals);
    return r.affectedRows;
  },

  // DELETE /ciclos/:id_ciclo (Parte 1) — borrado en cascada EXPLÍCITO.
  // En el schema real las FKs hijas (PLAN_ENTRENAMIENTO, PLAN_NUTRICIONAL,
  // PROGRESO_FISICO, REGISTRO_EJERCICIO, CONSUMO_ALIMENTO_REAL…) usan
  // ON DELETE RESTRICT o compuestas, así que MySQL rechazaría el DELETE directo.
  // Orden: primero los hijos con FK RESTRICT, luego sus padres.
  remove: async (id_ciclo) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // REGISTRO_EJERCICIO: FK compuesta (id_rutina, orden) a RUTINA_EJERCICIO RESTRICT
      await conn.query('DELETE FROM REGISTRO_EJERCICIO WHERE id_ciclo = ?', [id_ciclo]);
      // CONSUMO_ALIMENTO_REAL: FK compuesta a DETALLE_NUTRICIONAL RESTRICT
      await conn.query('DELETE FROM CONSUMO_ALIMENTO_REAL WHERE id_ciclo = ?', [id_ciclo]);
      // Seguimiento diario (CASCADE en CICLO, se borran igual por claridad)
      await conn.query('DELETE FROM PROGRESO_EJERCICIO_DIARIO WHERE id_ciclo = ?', [id_ciclo]);
      await conn.query('DELETE FROM CONSUMO_ALIMENTO_DIARIO WHERE id_ciclo = ?', [id_ciclo]);
      // RUTINA_EJERCICIO (FK a RUTINA RESTRICT) antes que RUTINA
      await conn.query(
        'DELETE re FROM RUTINA_EJERCICIO re JOIN RUTINA r ON r.id_rutina = re.id_rutina WHERE r.id_ciclo = ?',
        [id_ciclo]
      );
      await conn.query('DELETE FROM RUTINA WHERE id_ciclo = ?', [id_ciclo]);
      await conn.query('DELETE FROM DETALLE_NUTRICIONAL WHERE id_ciclo = ?', [id_ciclo]);
      await conn.query('DELETE FROM PLAN_ENTRENAMIENTO WHERE id_ciclo = ?', [id_ciclo]);
      await conn.query('DELETE FROM PLAN_NUTRICIONAL WHERE id_ciclo = ?', [id_ciclo]);
      await conn.query('DELETE FROM PROGRESO_FISICO WHERE id_ciclo = ?', [id_ciclo]);
      // Notas del afiliado sobre ejercicios (Parte 3)
      await conn.query('DELETE FROM NOTA_EJERCICIO WHERE id_ciclo = ?', [id_ciclo]);

      const [r] = await conn.query('DELETE FROM CICLO WHERE id_ciclo = ?', [id_ciclo]);
      await conn.commit();
      return r.affectedRows;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = CicloModel;