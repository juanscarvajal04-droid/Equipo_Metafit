// models/cicloModel.js
// ─── Consultas SQL de la tabla CICLO ──────────────────────────
// Un CICLO es un período de entrenamiento del afiliado (con fecha de inicio y
// fin, objetivo, nivel de experiencia y disponibilidad semanal). Solo puede
// haber un ciclo ACTIVO por afiliado a la vez: crear uno nuevo cierra los
// anteriores y la BD valida que las fechas no se solapen.
//
// FIX 2: Corregidos nombres de columna para coincidir con el schema real de la tabla CICLO.
//  - id_afiliado        → id_usuario        (FK a AFILIADO.id_usuario)
//  - fecha_inicio_ciclo → fecha_inicio       (nombre real en el schema)
//  - fecha_fin_ciclo    → fecha_fin          (nombre real en el schema)
//  - Agregados campos NOT NULL: objetivo_fisico, nivel_experiencia, disponibilidad_dias, registrado_por
'use strict';

const pool = require('../config/db');

const CicloModel = {

  /**
   * Lista todos los ciclos (activos e históricos) de un afiliado, ordenados
   * de más reciente a más antiguo. Calcula el número ordinal de cada ciclo
   * con una subconsulta (cuántos ciclos anteriores tiene el afiliado) para
   * mostrarlo como "Ciclo 1", "Ciclo 2", etc. en las vistas.
   *
   * @param {number} id_usuario - ID del afiliado
   * @returns {Promise<Array<Object>>} Lista de ciclos con `numero_ciclo`.
   */
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
  /**
   * Crea un ciclo nuevo en transacción. PRIMERO cierra (activo=0) cualquier
   * ciclo activo previo del mismo afiliado, garantizando la regla de negocio
   * "un solo ciclo activo por afiliado" de forma atómica (si el INSERT falla,
   * se revierte el cierre del ciclo anterior). El trigger del schema
   * `trg_ciclo_no_solapamiento_insert` rechaza además fechas que se crucen.
   *
   * @param {Object} datos - Datos del ciclo:
   *   @param {number} datos.id_usuario
   *   @param {string} datos.fecha_inicio - Formato YYYY-MM-DD
   *   @param {string} datos.fecha_fin - Formato YYYY-MM-DD (debe ser > inicio)
   *   @param {string} datos.objetivo_fisico
   *   @param {string} datos.nivel_experiencia
   *   @param {number} datos.disponibilidad_dias - 1 a 7
   *   @param {string} [datos.grupo_muscular_prioritario]
   *   @param {string} [datos.observaciones]
   *   @param {number} datos.registrado_por - ID del staff que crea el ciclo
   * @returns {Promise<number>} ID (insertId) del ciclo creado.
   * @throws {Error} Con código ER_CHECK_CONSTRAINT_VIOLATED si no se cumple el
   *                 CHECK (fecha_fin > fecha_inicio, disponibilidad 1-7).
   */
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

  /**
   * Busca un ciclo por su ID (dato crudo de la tabla, sin enriquecer).
   * Se usa, entre otros, por el middleware requireOwnCiclo para verificar
   * propiedad del ciclo antes de operaciones del afiliado.
   *
   * @param {number} id_ciclo - ID del ciclo
   * @returns {Promise<Object|null>} Fila de CICLO o null si no existe.
   */
  findById: async (id_ciclo) => {
    const [rows] = await pool.query('SELECT * FROM CICLO WHERE id_ciclo = ?', [id_ciclo]);
    return rows[0] || null;
  },

  // CRUD completo: PATCH /ciclos/:id_ciclo (Parte 1, HU "Ciclos gestionables")
  // Actualiza SOLO los campos enviados. Disponibilidad 1-7, fechas con
  // fecha_fin > fecha_inicio (CHECK real del schema) validadas en el service.
  /**
   * Actualiza parcialmente un ciclo (PATCH). Construye dinámicamente el SET
   * SOLO con los campos presentes en `campos`, y usa un operador `in` para
   * permitir poner observaciones en null (los demás campos solo se aceptan si
   * vienen definidos). Las validaciones semánticas (disponibilidad 1-7,
   * fecha_fin > fecha_inicio) las aplica el service antes de llegar aquí y el
   * CHECK constraint del schema como última barrera.
   *
   * @param {number} id - ID del ciclo a actualizar
   * @param {Object} campos - Campos soportados: activo, fecha_inicio, fecha_fin,
   *                          objetivo_fisico, nivel_experiencia,
   *                          disponibilidad_dias, grupo_muscular_prioritario,
   *                          observaciones
   * @returns {Promise<number>} Filas afectadas (0 si no cambió nada).
   */
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
  /**
   * Elimina un ciclo con su historial completo en una transacción. Por las
   * FKs de las tablas hijas con ON DELETE RESTRICT, MySQL rechazaría un
   * DELETE directo de CICLO; por eso este método borra primero los hijos
   * (registros de ejercicio, consumos, planes, progreso, notas y rutinas) en
   * el orden que exigen las FK compuestas y deja al padre (CICLO) para el
   * final. Todo es atómico: si algo falla, nada se elimina.
   *
   * @param {number} id_ciclo - ID del ciclo a eliminar
   * @returns {Promise<number>} Filas afectadas del borrado final de CICLO.
   * @throws {Error} Rollback y relanzamiento si alguna FK rechaza el borrado.
   */
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