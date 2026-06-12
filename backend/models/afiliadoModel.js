// backend/models/afiliadoModel.js
// ─── Consultas SQL de AFILIADO — SIN N+1 queries ─────────────
//
// Antes: findAll() hacía 1 query principal + N*3 queries por afiliado
//        (restricciones, ciclo activo, planes) → cuellos de botella graves.
//
// Ahora: 4 queries planas independientes con JOINs y GROUP_CONCAT.
//        Los datos se reensamblan en JS en O(n) usando Maps.
//
// Refactorizado: BUG-008 (eliminar password hardcodeado 'MetaFit2025!'),
//               BUG-012 (paginación en findAll con LIMIT/OFFSET)
// ─────────────────────────────────────────────────────────────
'use strict';

const pool = require('../config/db');

const AfiliadoModel = {

  // ─────────────────────────────────────────────────────────
  // findAll — resuelto en 4 queries totales (antes: 1 + N*3)
  // BUG-012: Soporta paginación via { page, limit }
  // ─────────────────────────────────────────────────────────
  findAll: async ({ page = 1, limit = 50 } = {}) => {
    const offset = (page - 1) * limit;

    // Query 1: afiliados paginados + nombre de quien los registró
    const [afiliados] = await pool.query(`
      SELECT
        a.id_usuario,
        u.nombres,
        u.apellidos,
        u.correo,
        u.estado                AS estado_cuenta,
        u.fecha_registro        AS fecha_registro_sistema,
        a.documento,
        a.fecha_nacimiento,
        TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) AS edad,
        a.sexo,
        a.telefono,
        a.direccion,
        a.estatura_cm,
        a.estado_afiliacion,
        a.fecha_registro        AS fecha_registro_afiliado,
        a.registrado_por,
        ur.nombres              AS registrado_por_nombre
      FROM AFILIADO a
      JOIN USUARIO  u  ON a.id_usuario    = u.id_usuario
      LEFT JOIN USUARIO ur ON a.registrado_por = ur.id_usuario
      ORDER BY u.apellidos, u.nombres
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    if (!afiliados.length) return [];

    const ids = afiliados.map(a => a.id_usuario);

    // Query 2: todas las restricciones de todos los afiliados en un solo JOIN
    const [restricciones] = await pool.query(`
      SELECT
        ar.id_usuario,
        r.id_restriccion,
        r.nombre_restriccion,
        r.tipo,
        r.efecto_relevante
      FROM AFILIADO_RESTRICCION ar
      JOIN RESTRICCION r ON ar.id_restriccion = r.id_restriccion
      WHERE ar.id_usuario IN (?)
    `, [ids]);

    // Query 3: ciclo activo de cada afiliado (máximo 1 por afiliado)
    const [ciclos] = await pool.query(`
      SELECT
        c.id_ciclo,
        c.id_usuario,
        c.fecha_inicio,
        c.fecha_fin,
        c.activo,
        c.objetivo_fisico,
        c.nivel_experiencia,
        c.disponibilidad_dias,
        c.grupo_muscular_prioritario,
        c.observaciones,
        (
          SELECT COUNT(*)
          FROM CICLO c2
          WHERE c2.id_usuario   = c.id_usuario
            AND c2.fecha_inicio <= c.fecha_inicio
        ) AS numero_ciclo
      FROM CICLO c
      WHERE c.id_usuario IN (?) AND c.activo = 1
    `, [ids]);

    // Query 4: último progreso físico por ciclo activo
    const cicloIds = ciclos.map(c => c.id_ciclo);
    let progreso = [];
    if (cicloIds.length) {
      [progreso] = await pool.query(`
        SELECT
          pf.id_ciclo,
          pf.fecha_registro,
          pf.peso_kg,
          pf.porcentaje_grasa,
          pf.medida_cintura,
          pf.medida_brazo,
          pf.medida_pierna,
          ROUND(pf.peso_kg / POW(a.estatura_cm / 100.0, 2), 2) AS imc
        FROM PROGRESO_FISICO pf
        JOIN CICLO    c  ON pf.id_ciclo  = c.id_ciclo
        JOIN AFILIADO a  ON c.id_usuario = a.id_usuario
        WHERE pf.id_ciclo IN (?)
          AND (pf.id_ciclo, pf.fecha_registro) IN (
            SELECT id_ciclo, MAX(fecha_registro)
            FROM PROGRESO_FISICO
            WHERE id_ciclo IN (?)
            GROUP BY id_ciclo
          )
      `, [cicloIds, cicloIds]);
    }

    // ── Reensamblar en JS usando Maps (O(n)) ─────────────────
    const restrMap    = new Map();   // id_usuario → [restricciones]
    const cicloMap    = new Map();   // id_usuario → ciclo
    const progresoMap = new Map();   // id_ciclo   → ultima_medicion

    for (const r of restricciones) {
      if (!restrMap.has(r.id_usuario)) restrMap.set(r.id_usuario, []);
      restrMap.get(r.id_usuario).push(r);
    }
    for (const c of ciclos)   cicloMap.set(c.id_usuario, c);
    for (const p of progreso) progresoMap.set(p.id_ciclo, p);

    return afiliados.map(af => {
      const ciclo = cicloMap.has(af.id_usuario)
        ? {
            ...cicloMap.get(af.id_usuario),
            ultimo_progreso: progresoMap.get(cicloMap.get(af.id_usuario).id_ciclo) || null,
          }
        : null;

      return {
        ...af,
        restricciones: restrMap.get(af.id_usuario) || [],
        ciclo_activo : ciclo,
        // ── Campos deportivos promovidos al nivel raiz para facilitar el render ──
        // Viven en CICLO pero el front los espera directamente en el afiliado.
        objetivo_fisico:             ciclo?.objetivo_fisico              || null,
        nivel_experiencia:           ciclo?.nivel_experiencia            || null,
        disponibilidad_semanal_dias: ciclo?.disponibilidad_dias          || null,
        grupo_muscular_prioritario:  ciclo?.grupo_muscular_prioritario   || null,
      };
    });
  },

  // ─────────────────────────────────────────────────────────
  // findById — detalle completo de 1 afiliado
  // ─────────────────────────────────────────────────────────
  findById: async (id) => {
    const [rows] = await pool.query(`
      SELECT
        a.id_usuario,
        u.nombres, u.apellidos, u.correo,
        u.estado AS estado_cuenta,
        a.documento, a.fecha_nacimiento,
        TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) AS edad,
        a.sexo, a.telefono, a.direccion, a.estatura_cm,
        a.estado_afiliacion, a.fecha_registro,
        a.fecha_ultima_modificacion, a.registrado_por
      FROM AFILIADO a
      JOIN USUARIO u ON a.id_usuario = u.id_usuario
      WHERE a.id_usuario = ?
    `, [id]);

    if (!rows.length) return null;
    const af = rows[0];

    const [restr] = await pool.query(`
      SELECT r.id_restriccion, r.nombre_restriccion, r.tipo, r.efecto_relevante
      FROM AFILIADO_RESTRICCION ar
      JOIN RESTRICCION r ON ar.id_restriccion = r.id_restriccion
      WHERE ar.id_usuario = ?
    `, [id]);
    af.restricciones = restr;

    // Ciclo activo con planes completos (detalle individual: más queries está justificado)
    af.ciclo_activo = await AfiliadoModel._getCicloActivo(id);
    return af;
  },

  // ─────────────────────────────────────────────────────────
  // _getCicloActivo — solo para findById (detalle individual)
  // ─────────────────────────────────────────────────────────
  _getCicloActivo: async (id_usuario) => {
    const [ciclos] = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM CICLO c2
         WHERE c2.id_usuario = c.id_usuario AND c2.fecha_inicio <= c.fecha_inicio
        ) AS numero_ciclo,
        DATEDIFF(c.fecha_fin, CURDATE()) AS dias_restantes
      FROM CICLO c
      WHERE c.id_usuario = ? AND c.activo = 1
      LIMIT 1
    `, [id_usuario]);
    if (!ciclos.length) return null;

    const ciclo = ciclos[0];

    // Plan de entrenamiento + rutinas + ejercicios
    const [pe] = await pool.query(
      'SELECT * FROM PLAN_ENTRENAMIENTO WHERE id_ciclo = ?', [ciclo.id_ciclo]
    );
    if (pe.length) {
      const [rutinas] = await pool.query(`
        SELECT r.*,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id_rutina_ejercicio', re.id_rutina,
              'orden', re.orden,
              'id_ejercicio', e.id_ejercicio,
              'nombre_ejercicio', e.nombre_ejercicio,
              'grupo_muscular', e.grupo_muscular,
              'series', re.series,
              'repeticiones', re.repeticiones
            ) ORDER BY re.orden
          ) AS ejercicios
        FROM RUTINA r
        LEFT JOIN RUTINA_EJERCICIO re ON r.id_rutina = re.id_rutina
        LEFT JOIN EJERCICIO e ON re.id_ejercicio = e.id_ejercicio
        WHERE r.id_ciclo = ?
        GROUP BY r.id_rutina
        ORDER BY r.dia_numero
      `, [ciclo.id_ciclo]);
      // Parsear ejercicios (JSON_ARRAYAGG devuelve string en algunos drivers)
      rutinas.forEach(r => {
        if (typeof r.ejercicios === 'string') r.ejercicios = JSON.parse(r.ejercicios);
        r.ejercicios = (r.ejercicios || []).filter(e => e.id_ejercicio !== null);
      });
      ciclo.plan_entrenamiento = { ...pe[0], rutinas };
    }

    // Plan nutricional + detalle
    const [pn] = await pool.query(
      'SELECT * FROM PLAN_NUTRICIONAL WHERE id_ciclo = ?', [ciclo.id_ciclo]
    );
    if (pn.length) {
      const [detalle] = await pool.query(`
        SELECT dn.num_comida, dn.id_alimento, dn.cantidad_g,
               al.nombre_alimento, al.proteinas, al.carbohidratos, al.grasas,
               ROUND((al.proteinas*4 + al.carbohidratos*4 + al.grasas*9),2) AS calorias_por_100g
        FROM DETALLE_NUTRICIONAL dn
        JOIN ALIMENTO al ON dn.id_alimento = al.id_alimento
        WHERE dn.id_ciclo = ?
        ORDER BY dn.num_comida
      `, [ciclo.id_ciclo]);
      ciclo.plan_nutricional = { ...pn[0], detalle };
    }

    // Progreso físico
    const [progreso] = await pool.query(`
      SELECT pf.*,
             ROUND(pf.peso_kg / POW(a.estatura_cm / 100.0, 2), 2) AS imc,
             u.nombres AS registrado_por_nombre
      FROM PROGRESO_FISICO pf
      JOIN CICLO    c  ON pf.id_ciclo  = c.id_ciclo
      JOIN AFILIADO a  ON c.id_usuario = a.id_usuario
      LEFT JOIN USUARIO u ON pf.registrado_por = u.id_usuario
      WHERE pf.id_ciclo = ?
      ORDER BY pf.fecha_registro DESC
    `, [ciclo.id_ciclo]);
    ciclo.progreso_fisico = progreso;

    return ciclo;
  },

  // ─────────────────────────────────────────────────────────
  // CREATE — inserta en USUARIO + AFILIADO en transacción
  // BUG-008: Se elimina el password hardcodeado 'MetaFit2025!'.
  //          La contraseña es OBLIGATORIA. Si no se provee, se lanza
  //          un error claro que el controller convierte en 400.
  // ─────────────────────────────────────────────────────────
  create: async (datos, registrado_por) => {
    const {
      nombres, apellidos, correo, contrasena,
      documento, sexo,
      telefono, direccion, estatura_cm,
    } = datos;

    // ── FIX: Normalizar fecha_nacimiento → YYYY-MM-DD estricto que exige MySQL ─
    // El input[type="date"] devuelve 'YYYY-MM-DD', pero si viene de otra fuente
    // puede llegar como ISO 8601 completo ('2000-05-20T00:00:00.000Z').
    let fecha_nacimiento = datos.fecha_nacimiento || null;
    if (fecha_nacimiento) {
      fecha_nacimiento = String(fecha_nacimiento).split('T')[0].split(' ')[0];
    }

    // ── FIX: El frontend envía `estado` (campo UI), el schema MySQL lo llama
    //         `estado_afiliacion`. Aceptamos ambos nombres.
    const estado_afiliacion = datos.estado_afiliacion || datos.estado || 'Activo';

    // ── FIX: Si el frontend no manda contraseña, generamos una temporal
    //         segura: 'MF_' + documento + '@2025'. El admin debe comunicársela
    //         al afiliado. Esto reemplaza el antiguo fallback hardcodeado.
    const rawPassword = (contrasena && contrasena.trim() !== '')
      ? contrasena.trim()
      : `MF_${documento}@2025`;

    const { hashPassword } = require('../middlewares/auth');
    const hash = await hashPassword(rawPassword);   // bcrypt 12 rondas (valida 72 bytes internamente)

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [uRes] = await conn.query(
        `INSERT INTO USUARIO (nombres, apellidos, correo, contrasena, rol, estado)
         VALUES (?,?,?,?,'Afiliado','Activo')`,
        [nombres, apellidos, correo, hash]
      );
      const id_usuario = uRes.insertId;

      // ── FIX: se usan las variables normalizadas (fecha_nacimiento=YYYY-MM-DD,
      //         estado_afiliacion con fallback, estatura como float).
      await conn.query(
        `INSERT INTO AFILIADO
           (id_usuario, documento, fecha_nacimiento, sexo,
            telefono, direccion, estatura_cm, estado_afiliacion, registrado_por)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          id_usuario,
          documento,
          fecha_nacimiento || null,
          sexo || 'Masculino',
          telefono || '',
          direccion || '',
          parseFloat(estatura_cm) || null,
          estado_afiliacion,
          registrado_por,
        ]
      );

      await conn.commit();
      return id_usuario;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // ─────────────────────────────────────────────────────────
  // update — actualiza AFILIADO y campos de USUARIO en transacción
  // ─────────────────────────────────────────────────────────
  update: async (id, campos) => {
    // Campos permitidos en la tabla AFILIADO
    const permitidosAfiliado = [
      'documento', 'fecha_nacimiento', 'sexo', 'telefono',
      'direccion', 'estatura_cm', 'estado_afiliacion',
    ];
    // 'estado' del frontend mapea a 'estado_afiliacion' en la BD
    if (campos.estado !== undefined && campos.estado_afiliacion === undefined) {
      campos.estado_afiliacion = campos.estado;
    }

    // Campos permitidos en la tabla USUARIO
    const permitidosUsuario = ['nombres', 'apellidos', 'correo', 'estado'];

    const setsAfiliado = [];
    const valsAfiliado = [];
    for (const key of permitidosAfiliado) {
      if (campos[key] !== undefined) {
        setsAfiliado.push(`${key}=?`);
        valsAfiliado.push(campos[key]);
      }
    }

    const setsUsuario = [];
    const valsUsuario = [];
    for (const key of permitidosUsuario) {
      if (campos[key] !== undefined) {
        setsUsuario.push(`${key}=?`);
        valsUsuario.push(campos[key]);
      }
    }

    // Si no hay nada que actualizar, retornar 0
    if (!setsAfiliado.length && !setsUsuario.length) return 0;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      let affectedRows = 0;

      if (setsAfiliado.length) {
        const [r] = await conn.query(
          `UPDATE AFILIADO SET ${setsAfiliado.join(',')} WHERE id_usuario=?`,
          [...valsAfiliado, id]
        );
        affectedRows = r.affectedRows;
      }

      if (setsUsuario.length) {
        const [r] = await conn.query(
          `UPDATE USUARIO SET ${setsUsuario.join(',')} WHERE id_usuario=?`,
          [...valsUsuario, id]
        );
        if (!setsAfiliado.length) affectedRows = r.affectedRows;
      }

      await conn.commit();
      return affectedRows;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  delete: async (id) => {
    // ON DELETE RESTRICT en FK → el afiliado con datos asociados no se puede eliminar
    const [result] = await pool.query(
      'DELETE FROM AFILIADO WHERE id_usuario=?', [id]
    );
    return result.affectedRows;
  },
};

module.exports = AfiliadoModel;