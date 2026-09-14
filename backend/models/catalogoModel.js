// backend/models/catalogoModel.js
// ─── Catálogos: ejercicios, alimentos, restricciones ──────────
// Capa de acceso a datos de los catálogos maestros (EJERCICIO, ALIMENTO,
// RESTRICCION) y las operaciones relacionadas con restricciones por afiliado,
// progreso físico y KPIs del dashboard. Varias queries usan la técnica de
// "2 queries planas + resamblado en Maps" para evitar el problema N+1.
'use strict';

const pool = require('../config/db');

const CatalogoModel = {

  // ── EJERCICIOS ────────────────────────────────────────────
  // ANTES: N+1 — 1 query base + N queries de restricciones (una por ejercicio).
  // AHORA: 2 queries planas + resamblado en Maps.
  /**
   * Devuelve todos los ejercicios del catálogo con sus restricciones excluidas
   * asociadas. Evita el N+1 con 2 queries planas: la lista base de ejercicios y
   * UNA query que trae todas las exclusiones de esos ejercicios; luego se
   * resamblan agrupando en un Map (O(n) total en vez de O(n²)).
   *
   * @returns {Promise<Array<Object>>} Ejercicios ordenados por grupo muscular,
   *   cada uno con su array `restricciones_excluidas`.
   */
  getAllEjercicios: async () => {
    const [ejercicios] = await pool.query(
      'SELECT id_ejercicio, nombre_ejercicio, grupo_muscular, descripcion, nivel_minimo FROM EJERCICIO ORDER BY grupo_muscular, nombre_ejercicio'
    );
    if (!ejercicios.length) return [];

    const ids = ejercicios.map(e => e.id_ejercicio);

    // Una sola query para todas las restricciones excluidas
    const [excluidas] = await pool.query(`
      SELECT ere.id_ejercicio,
             r.id_restriccion,
             r.nombre_restriccion,
             r.tipo              AS tipo_restriccion
      FROM EJERCICIO_RESTRICCION_EXCLUIDA ere
      JOIN RESTRICCION r ON ere.id_restriccion = r.id_restriccion
      WHERE ere.id_ejercicio IN (?)
    `, [ids]);

    // Mapear en O(n)
    const exclMap = new Map();
    for (const ex of excluidas) {
      if (!exclMap.has(ex.id_ejercicio)) exclMap.set(ex.id_ejercicio, []);
      exclMap.get(ex.id_ejercicio).push({
        id_restriccion:    ex.id_restriccion,
        nombre_restriccion: ex.nombre_restriccion,
        tipo_restriccion:  ex.tipo_restriccion,
      });
    }

    return ejercicios.map(e => ({
      ...e,
      restricciones_excluidas: exclMap.get(e.id_ejercicio) || [],
    }));
  },

  /**
   * Agrega un ejercicio nuevo al catálogo con su nivel mínimo requerido.
   * La descripción (instrucciones) es opcional.
   *
   * @param {Object} ejercicio - { nombre_ejercicio, grupo_muscular,
   *   descripcion, nivel_minimo }
   * @returns {Promise<number>} insertId del ejercicio creado.
   */
  createEjercicio: async ({ nombre_ejercicio, grupo_muscular, descripcion, nivel_minimo }) => {
    const [r] = await pool.query(
      'INSERT INTO EJERCICIO (nombre_ejercicio, grupo_muscular, descripcion, nivel_minimo) VALUES (?,?,?,?)',
      [nombre_ejercicio, grupo_muscular, descripcion || null, nivel_minimo]
    );
    return r.insertId;
  },

  // ── ALIMENTOS ─────────────────────────────────────────────
  // Usa la VIEW v_alimento_calorias definida en el schema SQL
  /**
   * Devuelve el catálogo de alimentos con sus macros. Lee de la VIEW
   * `v_alimento_calorias` (definida en el schema SQL) que ya calcula
   * calorias_por_100g con la fórmula de Atwater, manteniendo el cálculo en un
   * solo lugar.
   *
   * @returns {Promise<Array<Object>>} Alimentos con macros y calorías por 100g.
   */
  getAllAlimentos: async () => {
    const [rows] = await pool.query(
      'SELECT id_alimento, nombre_alimento, proteinas, carbohidratos, grasas, calorias_por_100g FROM v_alimento_calorias'
    );
    return rows;
  },

  /**
   * Agrega un alimento al catálogo con sus macronutrientes.
   *
   * @param {Object} alimento - { nombre_alimento, proteinas, carbohidratos,
   *   grasas }
   * @returns {Promise<number>} insertId del alimento creado.
   */
  createAlimento: async ({ nombre_alimento, proteinas, carbohidratos, grasas }) => {
    const [r] = await pool.query(
      'INSERT INTO ALIMENTO (nombre_alimento, proteinas, carbohidratos, grasas) VALUES (?,?,?,?)',
      [nombre_alimento, proteinas, carbohidratos, grasas]
    );
    return r.insertId;
  },

  /**
   * Elimina un ejercicio del catálogo. Fallará si algún plan lo está usando
   * (FK RESTRICT): quien invoque esto debe validar la dependencia antes.
   *
   * @param {number} id - ID del ejercicio
   * @returns {Promise<number>} Filas eliminadas (0 si no existía).
   */
  deleteEjercicio: async (id) => {
    const [r] = await pool.query('DELETE FROM EJERCICIO WHERE id_ejercicio = ?', [id]);
    return r.affectedRows;
  },

  /**
   * Elimina un alimento del catálogo. Fallará si se usa en algún detalle
   * nutricional (FK RESTRICT), igual que deleteEjercicio.
   *
   * @param {number} id - ID del alimento
   * @returns {Promise<number>} Filas eliminadas (0 si no existía).
   */
  deleteAlimento: async (id) => {
    const [r] = await pool.query('DELETE FROM ALIMENTO WHERE id_alimento = ?', [id]);
    return r.affectedRows;
  },

  /**
   * Actualiza los datos editables de un ejercicio. `descripcion` opcional
   * (se vacía con null si se manda vacío).
   *
   * @param {number} id - ID del ejercicio
   * @param {Object} datos - { nombre_ejercicio, grupo_muscular, nivel_minimo,
   *   descripcion }
   * @returns {Promise<number>} Filas afectadas.
   */
  updateEjercicio: async (id, { nombre_ejercicio, grupo_muscular, nivel_minimo, descripcion }) => {
    const [r] = await pool.query(
      'UPDATE EJERCICIO SET nombre_ejercicio = ?, grupo_muscular = ?, nivel_minimo = ?, descripcion = ? WHERE id_ejercicio = ?',
      [nombre_ejercicio, grupo_muscular, nivel_minimo, descripcion || null, id]
    );
    return r.affectedRows;
  },

  /**
   * Actualiza los macros editables de un alimento del catálogo.
   *
   * @param {number} id - ID del alimento
   * @param {Object} datos - { nombre_alimento, proteinas, carbohidratos, grasas }
   * @returns {Promise<number>} Filas afectadas.
   */
  updateAlimento: async (id, { nombre_alimento, proteinas, carbohidratos, grasas }) => {
    const [r] = await pool.query(
      'UPDATE ALIMENTO SET nombre_alimento = ?, proteinas = ?, carbohidratos = ?, grasas = ? WHERE id_alimento = ?',
      [nombre_alimento, proteinas, carbohidratos, grasas, id]
    );
    return r.affectedRows;
  },

  // ── RESTRICCIONES ─────────────────────────────────────────
  /**
   * Lista las restricciones médicas del catálogo. Nota sobre la query: el
   * nombre real de la columna del schema es 'tipo' (no 'tipo_restriccion'),
   * por eso se selecciona `tipo` sin alias.
   *
   * @returns {Promise<Array<Object>>} Restricciones ordenadas por tipo.
   */
  getAllRestricciones: async () => {
    const [rows] = await pool.query(
      // nombre real de columna según schema: 'tipo', no 'tipo_restriccion'
      'SELECT id_restriccion, nombre_restriccion, tipo, efecto_relevante FROM RESTRICCION ORDER BY tipo, nombre_restriccion'
    );
    return rows;
  },

  /**
   * Crea una restricción en el catálogo con su categoría y efecto relevante.
   *
   * @param {Object} restriccion - { nombre_restriccion, tipo, efecto_relevante }
   * @returns {Promise<number>} insertId de la restricción creada.
   */
  createRestriccion: async ({ nombre_restriccion, tipo, efecto_relevante }) => {
    const [r] = await pool.query(
      'INSERT INTO RESTRICCION (nombre_restriccion, tipo, efecto_relevante) VALUES (?,?,?)',
      [nombre_restriccion, tipo, efecto_relevante || null]
    );
    return r.insertId;
  },

  /**
   * Actualiza los datos editables de una restricción del catálogo.
   *
   * @param {number} id - ID de la restricción
   * @param {Object} restriccion - { nombre_restriccion, tipo, efecto_relevante }
   * @returns {Promise<number>} Filas afectadas.
   */
  updateRestriccion: async (id, { nombre_restriccion, tipo, efecto_relevante }) => {
    const [r] = await pool.query(
      'UPDATE RESTRICCION SET nombre_restriccion = ?, tipo = ?, efecto_relevante = ? WHERE id_restriccion = ?',
      [nombre_restriccion, tipo, efecto_relevante || null, id]
    );
    return r.affectedRows;
  },

  /**
   * Elimina una restricción del catálogo.
   *
   * @param {number} id - ID de la restricción
   * @returns {Promise<number>} Filas eliminadas (0 si no existía).
   */
  deleteRestriccion: async (id) => {
    const [r] = await pool.query('DELETE FROM RESTRICCION WHERE id_restriccion = ?', [id]);
    return r.affectedRows;
  },

  // ── EJERCICIOS DISPONIBLES POR AFILIADO ────────────────────
  /**
   * Ejercicios que SÍ puede usar un afiliado según sus restricciones y nivel.
   * La query excluye ejercicios que estén en EJERCICIO_RESTRICCION_EXCLUIDA para
   * las restricciones del afiliado, y filtra por experiencia: solo muestra
   * ejercicios con nivel_minimo <= el nivel del último ciclo del afiliado
   * (o TODOS si el afiliado no tiene ningún ciclo aún: COALESCE ≤ sí mismo,
   * condición siempre verdadera).
   *
   * @param {number} id_usuario - ID del afiliado
   * @returns {Promise<Array<Object>>} Ejercicios disponibles ordenados.
   */
  getEjerciciosDisponibles: async (id_usuario) => {
    const [rows] = await pool.query(`
      SELECT e.id_ejercicio, e.nombre_ejercicio, e.grupo_muscular,
             e.nivel_minimo, e.descripcion
      FROM EJERCICIO e
      WHERE e.id_ejercicio NOT IN (
        SELECT ere.id_ejercicio
        FROM AFILIADO_RESTRICCION ar
        JOIN EJERCICIO_RESTRICCION_EXCLUIDA ere ON ar.id_restriccion = ere.id_restriccion
        WHERE ar.id_usuario = ?
      )
      AND e.nivel_minimo <= COALESCE(
        (SELECT c.nivel_experiencia
         FROM CICLO c
         WHERE c.id_usuario = ?
         ORDER BY c.fecha_inicio DESC
         LIMIT 1),
        e.nivel_minimo
      )
      ORDER BY e.grupo_muscular, e.nombre_ejercicio
    `, [id_usuario, id_usuario]);
    return rows;
  },

  // ── ALIMENTOS DISPONIBLES POR AFILIADO ─────────────────────
  /**
   * Alimentos que SÍ puede consumir un afiliado: todos los del catálogo menos
   * los excluidos por sus restricciones (tabla ALIMENTO_RESTRICCION_EXCLUIDA).
   *
   * @param {number} id_usuario - ID del afiliado
   * @returns {Promise<Array<Object>>} Alimentos disponibles ordenados alfabéticamente.
   */
  getAlimentosDisponibles: async (id_usuario) => {
    const [rows] = await pool.query(`
      SELECT al.id_alimento, al.nombre_alimento,
             al.proteinas, al.carbohidratos, al.grasas
      FROM ALIMENTO al
      WHERE al.id_alimento NOT IN (
        SELECT are.id_alimento
        FROM AFILIADO_RESTRICCION ar
        JOIN ALIMENTO_RESTRICCION_EXCLUIDA are ON ar.id_restriccion = are.id_restriccion
        WHERE ar.id_usuario = ?
      )
      ORDER BY al.nombre_alimento
    `, [id_usuario]);
    return rows;
  },

  // ── RESTRICCIONES POR AFILIADO ────────────────────────────
  // Schema: AFILIADO_RESTRICCION tiene id_usuario, no id_afiliado
  /**
   * Restricciones médicas registradas para un afiliado (une AFILIADO_RESTRICCION
   * con RESTRICCION). Nota de schema: la tabla puente usa `id_usuario` (no
   * id_afiliado), igual que las demás tablas del afiliado.
   *
   * @param {number} id_usuario - ID del afiliado
   * @returns {Promise<Array<Object>>} Restricciones del afiliado.
   */
  getRestriccionesByAfiliado: async (id_usuario) => {
    const [rows] = await pool.query(`
      SELECT r.id_restriccion, r.nombre_restriccion, r.tipo, r.efecto_relevante
      FROM AFILIADO_RESTRICCION ar
      JOIN RESTRICCION r ON ar.id_restriccion = r.id_restriccion
      WHERE ar.id_usuario = ?
    `, [id_usuario]);
    return rows;
  },

  /**
   * Asocia una restricción a un afiliado. INSERT IGNORE: si la relación ya
   * existía no lanza error (idempotente).
   *
   * @param {number} id_usuario - ID del afiliado
   * @param {number} id_restriccion - ID de la restricción a añadir
   * @returns {Promise<void>} No devuelve valor.
   */
  addRestriccionToAfiliado: async (id_usuario, id_restriccion) => {
    await pool.query(
      'INSERT IGNORE INTO AFILIADO_RESTRICCION (id_usuario, id_restriccion) VALUES (?,?)',
      [id_usuario, id_restriccion]
    );
  },

  /**
   * Desasocia una restricción de un afiliado.
   *
   * @param {number} id_usuario - ID del afiliado
   * @param {number} id_restriccion - ID de la restricción a quitar
   * @returns {Promise<number>} Filas eliminadas (0 si no existía la relación).
   */
  removeRestriccionFromAfiliado: async (id_usuario, id_restriccion) => {
    const [r] = await pool.query(
      'DELETE FROM AFILIADO_RESTRICCION WHERE id_usuario=? AND id_restriccion=?',
      [id_usuario, id_restriccion]
    );
    return r.affectedRows;
  },

  // ── PROGRESO FÍSICO ───────────────────────────────────────
  // Schema: PROGRESO_FISICO no tiene id_afiliado directo → JOIN via CICLO
  // Campo peso → peso_kg; campo fecha_inicio_ciclo → fecha_inicio
  /**
   * Historial de mediciones físicas de un afiliado (PROGRESO_FISICO). Como la
   * tabla no tiene id_afiliado directo, se llega por JOIN vía CICLO. Además de
   * los campos medidos devuelve el IMC calculado en la query
   * (peso_kg / (estatura_m)²) y quién tomó la medición.
   *
   * @param {number} id_usuario - ID del afiliado
   * @returns {Promise<Array<Object>>} Mediciones de más reciente a más antigua.
   */
  getProgresoByAfiliado: async (id_usuario) => {
    const [rows] = await pool.query(`
      SELECT pf.id_ciclo, pf.fecha_registro,
             pf.peso_kg, pf.porcentaje_grasa,
             pf.medida_cintura, pf.medida_brazo, pf.medida_pierna,
             pf.observaciones,
             ROUND(pf.peso_kg / POW(a.estatura_cm / 100.0, 2), 2) AS imc,
             c.fecha_inicio, c.fecha_fin,
             u.nombres AS registrado_por_nombre
      FROM PROGRESO_FISICO pf
      JOIN CICLO    c  ON pf.id_ciclo  = c.id_ciclo
      JOIN AFILIADO a  ON c.id_usuario = a.id_usuario
      LEFT JOIN USUARIO u ON pf.registrado_por = u.id_usuario
      WHERE c.id_usuario = ?
      ORDER BY pf.fecha_registro DESC
    `, [id_usuario]);
    return rows;
  },

  /**
   * Registra una medición física nueva para un ciclo. Acepta `peso` (legacy,
   * era el nombre de columna anterior) o `peso_kg` (schema nuevo) para no
   * romper clientes viejos. Los campos de medidas y observaciones son opcionales.
   *
   * @param {Object} datos - { id_ciclo, fecha_registro, peso_kg, porcentaje_grasa,
   *   medida_cintura, medida_brazo, medida_pierna, observaciones }
   * @param {number} registrado_por - ID del usuario (staff) que carga la medición
   * @returns {Promise<void>} No devuelve valor.
   */
  createProgreso: async (datos, registrado_por) => {
    const { id_ciclo, fecha_registro, peso_kg, porcentaje_grasa,
            medida_cintura, medida_brazo, medida_pierna, observaciones } = datos;
    // Acepta 'peso' (legacy) o 'peso_kg' (nuevo schema)
    const peso = peso_kg || datos.peso;
    await pool.query(
      `INSERT INTO PROGRESO_FISICO
         (id_ciclo, fecha_registro, peso_kg, porcentaje_grasa,
          medida_cintura, medida_brazo, medida_pierna, observaciones, registrado_por)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id_ciclo, fecha_registro, peso, porcentaje_grasa || null,
       medida_cintura || null, medida_brazo || null, medida_pierna || null,
       observaciones || null, registrado_por]
    );
  },

  // ── DASHBOARD KPIs ────────────────────────────────────────
  // Consolidado en una sola query para evitar roundtrips
  /**
   * KPIs del dashboard consolidados en UNA query con subconsultas escalares
   * (evita 10 roundtrips a la BD): totales de afiliados por estado, staff por
   * rol, ciclos activos, afiliados con restricciones, pagos, ingresos y
   * vencimientos próximos. Una segunda query agrupa los ciclos activos por
   * objetivo físico para el gráfico. Nota: los nombres de columna del schema
   * son `estado` (USUARIO) y `estado_afiliacion` (AFILIADO).
   *
   * @returns {Promise<Object>} KPIs planos + `por_objetivo` (conteo por objetivo).
   */
  getDashboardKPIs: async () => {
    // Campos reales del schema: estado en USUARIO, estado_afiliacion en AFILIADO
    const [[kpis]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM AFILIADO)                                          AS total_afiliados,
        (SELECT COUNT(*) FROM AFILIADO WHERE estado_afiliacion = 'Activo')       AS afiliados_activos,
        (SELECT COUNT(*) FROM AFILIADO WHERE estado_afiliacion = 'Inactivo')     AS afiliados_inactivos,
        (SELECT COUNT(*) FROM USUARIO WHERE rol = 'Entrenador')                  AS entrenadores,
        (SELECT COUNT(*) FROM USUARIO WHERE rol = 'Recepcionista')                AS recepcionistas,
        (SELECT COUNT(*) FROM CICLO WHERE activo = 1)                            AS ciclos_en_curso,
        (SELECT COUNT(DISTINCT id_usuario) FROM AFILIADO_RESTRICCION)            AS con_restricciones,
        (SELECT COUNT(*) FROM PAGO)                                              AS pagos_registrados,
        (SELECT IFNULL(SUM(valor_pagado), 0) FROM PAGO)                          AS ingresos,
        (SELECT COUNT(*) FROM PAGO WHERE fecha_vencimiento < CURDATE() AND estado <> 'Pagado') AS proximos_vencimientos
    `);

    const [por_objetivo] = await pool.query(`
      SELECT objetivo_fisico AS objetivo, COUNT(*) AS cantidad
      FROM CICLO
      WHERE activo = 1
      GROUP BY objetivo_fisico
    `);

    return { ...kpis, por_objetivo };
  },
};

module.exports = CatalogoModel;