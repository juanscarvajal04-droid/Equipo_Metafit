// models/catalogoModel.js
// ─── Catálogos: ejercicios, alimentos, restricciones ─────────
const pool = require('../config/db');

const CatalogoModel = {

  // ── EJERCICIOS ────────────────────────────────────────────
  getAllEjercicios: async () => {
    const [rows] = await pool.query(
      'SELECT * FROM EJERCICIO ORDER BY grupo_muscular, nombre_ejercicio'
    );
    for (const ej of rows) {
      const [excl] = await pool.query(`
        SELECT r.id_restriccion, r.nombre_restriccion, r.tipo_restriccion
        FROM EJERCICIO_RESTRICCION_EXCLUIDA ere
        JOIN RESTRICCION r ON ere.id_restriccion = r.id_restriccion
        WHERE ere.id_ejercicio = ?
      `, [ej.id_ejercicio]);
      ej.restricciones_excluidas = excl;
    }
    return rows;
  },

  createEjercicio: async ({ nombre_ejercicio, grupo_muscular, descripcion, nivel_minimo }) => {
    const [r] = await pool.query(
      'INSERT INTO EJERCICIO (nombre_ejercicio, grupo_muscular, descripcion, nivel_minimo) VALUES (?,?,?,?)',
      [nombre_ejercicio, grupo_muscular, descripcion || null, nivel_minimo]
    );
    return r.insertId;
  },

  // ── ALIMENTOS (usa la VIEW del schema que calcula calorías) ─
  getAllAlimentos: async () => {
    const [rows] = await pool.query(
      'SELECT * FROM alimento_con_calorias ORDER BY nombre_alimento'
    );
    return rows;
  },

  createAlimento: async ({ nombre_alimento, proteinas, carbohidratos, grasas }) => {
    const [r] = await pool.query(
      'INSERT INTO ALIMENTO (nombre_alimento, proteinas, carbohidratos, grasas) VALUES (?,?,?,?)',
      [nombre_alimento, proteinas, carbohidratos, grasas]
    );
    return r.insertId;
  },

  // ── RESTRICCIONES ─────────────────────────────────────────
  getAllRestricciones: async () => {
    const [rows] = await pool.query(
      'SELECT * FROM RESTRICCION ORDER BY tipo_restriccion, nombre_restriccion'
    );
    return rows;
  },

  getRestriccionesByAfiliado: async (id_afiliado) => {
    const [rows] = await pool.query(`
      SELECT r.* FROM AFILIADO_RESTRICCION ar
      JOIN RESTRICCION r ON ar.id_restriccion = r.id_restriccion
      WHERE ar.id_afiliado = ?
    `, [id_afiliado]);
    return rows;
  },

  addRestriccionToAfiliado: async (id_afiliado, id_restriccion) => {
    await pool.query(
      'INSERT IGNORE INTO AFILIADO_RESTRICCION (id_afiliado, id_restriccion) VALUES (?,?)',
      [id_afiliado, id_restriccion]
    );
  },

  removeRestriccionFromAfiliado: async (id_afiliado, id_restriccion) => {
    const [r] = await pool.query(
      'DELETE FROM AFILIADO_RESTRICCION WHERE id_afiliado=? AND id_restriccion=?',
      [id_afiliado, id_restriccion]
    );
    return r.affectedRows;
  },

  // ── PROGRESO FÍSICO ───────────────────────────────────────
  getProgresoByAfiliado: async (id_afiliado) => {
    const [rows] = await pool.query(`
      SELECT pf.*, c.fecha_inicio_ciclo, c.fecha_fin_ciclo,
             u.nombres_usuario AS registrado_por_nombre
      FROM PROGRESO_FISICO pf
      JOIN CICLO c ON pf.id_ciclo = c.id_ciclo
      LEFT JOIN USUARIO u ON pf.registrado_por = u.id_usuario
      WHERE c.id_afiliado = ?
      ORDER BY pf.fecha_registro DESC
    `, [id_afiliado]);
    return rows;
  },

  createProgreso: async (datos, registrado_por) => {
    const { id_ciclo, fecha_registro, peso, porcentaje_grasa,
            medida_cintura, medida_brazo, medida_pierna, observaciones } = datos;
    await pool.query(
      `INSERT INTO PROGRESO_FISICO
         (id_ciclo, fecha_registro, peso, porcentaje_grasa,
          medida_cintura, medida_brazo, medida_pierna, observaciones, registrado_por)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id_ciclo, fecha_registro, peso, porcentaje_grasa || null,
       medida_cintura || null, medida_brazo || null, medida_pierna || null,
       observaciones || null, registrado_por]
    );
  },

  // ── DASHBOARD KPIs ────────────────────────────────────────
  getDashboardKPIs: async () => {
    const [[{ total }]]     = await pool.query('SELECT COUNT(*) AS total FROM AFILIADO');
    const [[{ activos }]]   = await pool.query("SELECT COUNT(*) AS activos FROM AFILIADO WHERE estado_afiliacion='Activo'");
    const [[{ ciclos }]]    = await pool.query('SELECT COUNT(*) AS ciclos FROM CICLO WHERE activo=1');
    const [[{ con_restr }]] = await pool.query('SELECT COUNT(DISTINCT id_afiliado) AS con_restr FROM AFILIADO_RESTRICCION');
    const [por_objetivo]    = await pool.query(`
      SELECT objetivo_fisico_afiliado AS objetivo, COUNT(*) AS cantidad
      FROM AFILIADO GROUP BY objetivo_fisico_afiliado
    `);
    return { total_afiliados: total, afiliados_activos: activos, ciclos_en_curso: ciclos, con_restricciones: con_restr, por_objetivo };
  },
};

module.exports = CatalogoModel;