// models/afiliadoModel.js
// ─── Consultas SQL de AFILIADO con datos relacionados ─────────
const pool = require('../config/db');

const AfiliadoModel = {

  findAll: async () => {
    const [afiliados] = await pool.query(`
      SELECT a.*, u.nombres_usuario AS registrado_por_nombre
      FROM AFILIADO a
      LEFT JOIN USUARIO u ON a.registrado_por = u.id_usuario
      ORDER BY a.id_afiliado
    `);

    for (const af of afiliados) {
      // Restricciones médicas
      const [restr] = await pool.query(`
        SELECT r.id_restriccion, r.nombre_restriccion,
               r.tipo_restriccion, r.efecto_relevante
        FROM AFILIADO_RESTRICCION ar
        JOIN RESTRICCION r ON ar.id_restriccion = r.id_restriccion
        WHERE ar.id_afiliado = ?
      `, [af.id_afiliado]);
      af.restricciones = restr;

      // Ciclo activo con planes y progreso
      af.ciclo_activo = await AfiliadoModel._getCicloActivo(af.id_afiliado);
    }
    return afiliados;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT * FROM AFILIADO WHERE id_afiliado = ?', [id]
    );
    if (!rows.length) return null;
    const af = rows[0];
    const [restr] = await pool.query(`
      SELECT r.* FROM AFILIADO_RESTRICCION ar
      JOIN RESTRICCION r ON ar.id_restriccion = r.id_restriccion
      WHERE ar.id_afiliado = ?
    `, [id]);
    af.restricciones = restr;
    af.ciclo_activo  = await AfiliadoModel._getCicloActivo(id);
    return af;
  },

  _getCicloActivo: async (id_afiliado) => {
    const [ciclos] = await pool.query(`
      SELECT c.*
      FROM CICLO c
      WHERE c.id_afiliado = ? AND c.activo = 1
      ORDER BY c.fecha_inicio_ciclo DESC LIMIT 1
    `, [id_afiliado]);
    if (!ciclos.length) return null;

    const ciclo = ciclos[0];

    // Plan de entrenamiento
    const [planes_e] = await pool.query(
      'SELECT * FROM PLAN_ENTRENAMIENTO WHERE id_ciclo = ?', [ciclo.id_ciclo]
    );
    if (planes_e.length) {
      const pe = planes_e[0];
      const [rutinas] = await pool.query(
        'SELECT * FROM RUTINA WHERE id_plan_entrenamiento = ? ORDER BY dia_numero',
        [pe.id_plan_entrenamiento]
      );
      for (const rut of rutinas) {
        const [ejercicios] = await pool.query(`
          SELECT re.*, e.nombre_ejercicio, e.grupo_muscular, e.descripcion
          FROM RUTINA_EJERCICIO re
          JOIN EJERCICIO e ON re.id_ejercicio = e.id_ejercicio
          WHERE re.id_rutina = ? ORDER BY re.orden
        `, [rut.id_rutina]);
        rut.ejercicios = ejercicios;
      }
      pe.rutinas = rutinas;
      ciclo.plan_entrenamiento = pe;
    }

    // Plan nutricional
    const [planes_n] = await pool.query(
      'SELECT * FROM PLAN_NUTRICIONAL WHERE id_ciclo = ?', [ciclo.id_ciclo]
    );
    if (planes_n.length) {
      const pn = planes_n[0];
      const [detalle] = await pool.query(`
        SELECT dn.*, al.nombre_alimento, al.proteinas, al.carbohidratos, al.grasas,
               ROUND((al.proteinas*4 + al.carbohidratos*4 + al.grasas*9),2) AS calorias_por_100g
        FROM DETALLE_NUTRICIONAL dn
        JOIN ALIMENTO al ON dn.id_alimento = al.id_alimento
        WHERE dn.id_plan_nutricional = ? ORDER BY dn.numero_comida
      `, [pn.id_plan_nutricional]);
      pn.detalle = detalle;
      ciclo.plan_nutricional = pn;
    }

    // Progreso físico
    const [progreso] = await pool.query(`
      SELECT pf.*, u.nombres_usuario AS registrado_por_nombre
      FROM PROGRESO_FISICO pf
      LEFT JOIN USUARIO u ON pf.registrado_por = u.id_usuario
      WHERE pf.id_ciclo = ? ORDER BY pf.fecha_registro DESC
    `, [ciclo.id_ciclo]);
    ciclo.progreso_fisico = progreso;

    return ciclo;
  },

  create: async (datos, registrado_por) => {
    const {
      nombres_afiliado, apellidos_afiliado, documento_afiliado,
      fecha_nacimiento_afiliado, sexo_afiliado, correo_afiliado,
      direccion_afiliado, telefono_afiliado, estatura_afiliado,
      objetivo_fisico_afiliado, grupo_muscular_prioritario,
      nivel_experiencia_afiliado, disponibilidad_semanal_afiliado,
      estado_afiliacion,
    } = datos;

    const [result] = await pool.query(`
      INSERT INTO AFILIADO
        (nombres_afiliado, apellidos_afiliado, documento_afiliado,
         fecha_nacimiento_afiliado, sexo_afiliado, correo_afiliado,
         direccion_afiliado, telefono_afiliado, estatura_afiliado,
         objetivo_fisico_afiliado, grupo_muscular_prioritario,
         nivel_experiencia_afiliado, disponibilidad_semanal_afiliado,
         estado_afiliacion, registrado_por)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [nombres_afiliado, apellidos_afiliado, documento_afiliado,
       fecha_nacimiento_afiliado, sexo_afiliado, correo_afiliado,
       direccion_afiliado, telefono_afiliado, estatura_afiliado,
       objetivo_fisico_afiliado, grupo_muscular_prioritario,
       nivel_experiencia_afiliado, disponibilidad_semanal_afiliado,
       estado_afiliacion || 'Activo', registrado_por]
    );
    return result.insertId;
  },

  update: async (id, campos) => {
    const permitidos = [
      'nombres_afiliado','apellidos_afiliado','documento_afiliado',
      'fecha_nacimiento_afiliado','sexo_afiliado','correo_afiliado',
      'direccion_afiliado','telefono_afiliado','estatura_afiliado',
      'objetivo_fisico_afiliado','grupo_muscular_prioritario',
      'nivel_experiencia_afiliado','disponibilidad_semanal_afiliado',
      'estado_afiliacion','fecha_ultima_modificacion','fecha_ultimo_cambio_estado',
    ];
    const sets = [];
    const vals = [];
    for (const key of permitidos) {
      if (campos[key] !== undefined) { sets.push(`${key}=?`); vals.push(campos[key]); }
    }
    if (!sets.length) return 0;
    vals.push(id);
    const [result] = await pool.query(
      `UPDATE AFILIADO SET ${sets.join(',')} WHERE id_afiliado=?`, vals
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query(
      'DELETE FROM AFILIADO WHERE id_afiliado=?', [id]
    );
    return result.affectedRows;
  },
};

module.exports = AfiliadoModel;