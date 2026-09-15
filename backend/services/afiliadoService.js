// backend/services/afiliadoService.js
// ─── Lógica de negocio de AFILIADO — orquesta todos los modelos ──
// Capa de servicios de los afiliados: orquesta AfiliadoModel, CicloModel,
// CatalogoModel, SeguimientoDiarioModel, UsuarioModel y NotaEjercicioModel.
// Aquí se validan reglas de negocio (esquemas y rangos reales de BD), se
// normalizan fechas (fechaUtils) y se decide qué se expone al frontend.
// Cubre: CRUD de afiliados, /me (perfil, foto), ciclos, restricciones,
// progreso físico, seguimiento diario (ejercicio/agua/consumo) y notas de
// ejercicio sobre ejercicios (PARTE 3).
'use strict';

const AfiliadoModel          = require('../models/afiliadoModel');
const CicloModel             = require('../models/cicloModel');
const CatalogoModel          = require('../models/catalogoModel');
const SeguimientoDiarioModel = require('../models/seguimientoDiarioModel');
const UsuarioModel           = require('../models/usuarioModel');
const NotaEjercicioModel     = require('../models/notaEjercicioModel'); // Parte 3

// FIX 1.3 / ISO 25000: normalizarFecha extraída a utils/fechaUtils.js
// para que sea testeable sin dependencia de BD.
const { normalizarFecha } = require('../utils/fechaUtils');
const { normalizarObjetivoFisico, normalizarNivelExperiencia, OBJETIVOS_VALIDOS, NIVELES_VALIDOS }
  = require('../utils/objetivoUtils');


const AfiliadoService = {

  /** Lista afiliados paginados (delega directo en AfiliadoModel.findAll). */
  getAll: async ({ page, limit }) => {
    return AfiliadoModel.findAll({ page, limit });
  },

  /** Busca un afiliado por id_usuario (perfil + ciclo activo + planes). */
  getById: async (id) => {
    return AfiliadoModel.findById(id);
  },

  /**
   * create — Crea un afiliado. Valida nombres y documento; normaliza la
   * fecha_nacimiento (utils/fechaUtils) antes de insertar (FIX 1.3). El modelo
   * genera una contraseña temporal efectiva si el frontend no la envió; se
   * devuelve en la respuesta para el correo de bienvenida y el webhook n8n.
   *
   * @param {Object} datos    - Datos del afiliado (fecha_nacimiento acepta DD/MM/YYYY o ISO).
   * @param {number} creatorId - id_usuario del staff que registra.
   * @returns {Promise<{id:number, message:string, password_temporal:string}>}
   * @throws {Error} Si faltan nombres o documento.
   */
  create: async (datos, creatorId) => {
    if (!datos.nombres || !datos.documento) {
      throw new Error('Nombre y documento son requeridos');
    }

    // FIX 1.3: normalizar fecha_nacimiento antes de insertar
    const datosNormalizados = {
      ...datos,
      fecha_nacimiento: normalizarFecha(datos.fecha_nacimiento),
    };

    const creado = await AfiliadoModel.create(datosNormalizados, creatorId);
    return {
      id: creado.id_usuario,
      message: 'Afiliado creado correctamente',
      // Contraseña efectiva (generada por el modelo si el frontend no la envió).
      // Se usa para el correo de bienvenida y el webhook n8n.
      password_temporal: creado.password_temporal,
    };
  },

  /** Actualiza datos generales de un afiliado. @returns {Promise<boolean>} true si cambió. */
  update: async (id, datos) => {
    const affected = await AfiliadoModel.update(id, datos);
    return affected > 0;
  },

  // ── FASE A.1: el afiliado edita su PROPIO perfil (PATCH /afiliados/me) ──
  // Validaciones basadas en el esquema real:
  //   · peso  → PROGRESO_FISICO.peso_kg         → CHECK 20–300 kg
  //   · talla → AFILIADO.estatura_cm            → 1–300 cm
  //   · correo→ USUARIO.correo                  → regex + unicidad (uq_usuario_correo)
  /**
   * updateMe — El afiliado edita su PROPIO perfil (PATCH /afiliados/me).
   * Acepta alias de los frontends (peso|peso_kg, talla|altura_cm|estatura_cm)
   * y valida contra los esquemas reales de BD:
   *   · peso   → PROGRESO_FISICO.peso_kg  (CHECK 20–300 kg)
   *   · talla  → AFILIADO.estatura_cm     (1–300 cm)
   *   · teléfono ≤ 20 caracteres
   *   · correo → regex + unicidad (uq_usuario_correo, salvo su propio correo)
   * Tras persistir, recalcula el IMC con los datos guardados (redondeado a 2
   * decimales) y lo devuelve con el perfil actualizado.
   *
   * @param {number} id    - id_usuario autenticado (req.user.sub).
   * @param {Object} datos - { peso_kg|peso, estatura_cm|altura_cm|talla, telefono, correo }.
   * @returns {Promise<Object>} { message, imc, perfil }.
   * @throws {Error} err.code: DATOS_INVALIDOS / CORREO_EN_USO / NO_ENCONTRADO.
   */
  updateMe: async (id, datos) => {
    // Acepta alias usados por los frontends (peso o peso_kg, talla/altura_cm/estatura_cm)
    const pesoKg     = datos.peso_kg !== undefined ? datos.peso_kg : datos.peso;
    const estaturaCm = datos.estatura_cm !== undefined
      ? datos.estatura_cm
      : (datos.altura_cm !== undefined ? datos.altura_cm : datos.talla);
    const telefono   = datos.telefono;
    const correo     = datos.correo;

    if (pesoKg === undefined && estaturaCm === undefined
        && telefono === undefined && correo === undefined) {
      const err = new Error('No hay campos para actualizar. Envía peso, talla, telefono o correo.');
      err.code = 'DATOS_INVALIDOS';
      throw err;
    }

    // ── Validaciones individuales ──────────────────────────
    if (pesoKg !== undefined) {
      if (!Number.isFinite(Number(pesoKg)) || Number(pesoKg) < 20 || Number(pesoKg) > 300) {
        const err = new Error('El peso debe estar entre 20 y 300 kg');
        err.code = 'DATOS_INVALIDOS';
        throw err;
      }
    }

    if (estaturaCm !== undefined) {
      if (!Number.isFinite(Number(estaturaCm)) || Number(estaturaCm) < 1 || Number(estaturaCm) > 300) {
        const err = new Error('La altura debe estar entre 1 y 300 cm');
        err.code = 'DATOS_INVALIDOS';
        throw err;
      }
    }

    if (telefono !== undefined && String(telefono).length > 20) {
      const err = new Error('El teléfono no puede superar 20 caracteres');
      err.code = 'DATOS_INVALIDOS';
      throw err;
    }

    let correoNormalizado;
    if (correo !== undefined) {
      correoNormalizado = String(correo).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)) {
        const err = new Error('Formato de correo inválido');
        err.code = 'DATOS_INVALIDOS';
        throw err;
      }
      // Unicidad: uq_usuario_correo (excepto si es su propio correo)
      const existente = await UsuarioModel.findByEmail(correoNormalizado);
      if (existente && Number(existente.id_usuario) !== Number(id)) {
        const err = new Error('Ese correo ya está en uso por otro usuario');
        err.code = 'CORREO_EN_USO';
        throw err;
      }
    }

    // ── Persistir ──────────────────────────────────────────
    const act = await AfiliadoModel.updateMe(id, {
      telefono,
      estatura_cm: estaturaCm !== undefined ? Number(estaturaCm) : undefined,
      correo:      correoNormalizado,
      peso_kg:     pesoKg !== undefined ? Number(pesoKg) : undefined,
    });

    if (!act) {
      const err = new Error('Afiliado no encontrado');
      err.code = 'NO_ENCONTRADO';
      throw err;
    }

    // ── Recalcular IMC con los datos ya persistidos ────────
    const perfil = await AfiliadoModel.getMeData(id);
    let imc = null;
    if (perfil && perfil.estatura_cm && perfil.peso_kg && Number(perfil.estatura_cm) > 0) {
      imc = Math.round((perfil.peso_kg / Math.pow(perfil.estatura_cm / 100, 2)) * 100) / 100;
    }

    return {
      message: 'Perfil actualizado correctamente',
      imc,
      perfil: {
        id_usuario:  perfil?.id_usuario  ?? id,
        telefono:    perfil?.telefono    ?? null,
        estatura_cm: perfil?.estatura_cm ?? null,
        correo:      perfil?.correo      ?? null,
        peso_kg:     perfil?.peso_kg     ?? null,
      },
    };
  },

  /** Devuelve la ruta de la foto de perfil del afiliado. */
  getFoto: async (id) => {
    return AfiliadoModel.getFoto(id);
  },

  /** Persiste la foto de perfil del afiliado. */
  setFoto: async (id, foto) => {
    return AfiliadoModel.setFoto(id, foto);
  },

  /** Elimina el afiliado (y su USUARIO, cascada en el modelo). @returns {Promise<boolean>} */
  delete: async (id) => {
    const affected = await AfiliadoModel.delete(id);
    return affected > 0;
  },

  /** Lista los ciclos del afiliado (activo + históricos). */
  getCiclos: async (id) => {
    return CicloModel.findByAfiliado(id);
  },

  /**
   * createCiclo — Crea un ciclo de entrenamiento para un afiliado.
   * Valida los campos requeridos por CICLO (FIX 2): usa id_usuario (no
   * id_afiliado) y exige objetivo_fisico, nivel_experiencia (ENUMs de BD),
   * disponibilidad_dias (1–7) y registrado_por (NOT NULL).
   *
   * @param {Object} datos - { id_usuario, fecha_inicio, fecha_fin, objetivo_fisico,
   *   nivel_experiencia, disponibilidad_dias, grupo_muscular_prioritario?, observaciones? }.
   * @param {number} registradoPor - id_usuario del staff que crea el ciclo.
   * @returns {Promise<{id_ciclo:number, message:string}>}
   * @throws {Error} Si faltan campos obligatorios.
   */
  createCiclo: async (datos, registradoPor) => {
    // FIX 2: la tabla CICLO usa id_usuario (no id_afiliado) y requiere
    //         objetivo_fisico, nivel_experiencia, disponibilidad_dias, registrado_por (NOT NULL).
    const id_usuario = datos.id_usuario;
    const fecha_inicio = datos.fecha_inicio;
    const fecha_fin    = datos.fecha_fin;

    if (!id_usuario || !fecha_inicio || !fecha_fin) {
      throw new Error('id_usuario, fecha_inicio y fecha_fin son requeridos');
    }
    if (!datos.objetivo_fisico || !datos.nivel_experiencia || !datos.disponibilidad_dias) {
      throw new Error('objetivo_fisico, nivel_experiencia y disponibilidad_dias son requeridos');
    }

    const id = await CicloModel.create({
      id_usuario,
      fecha_inicio,
      fecha_fin,
      objetivo_fisico:            normalizarObjetivoFisico(datos.objetivo_fisico),
      nivel_experiencia:          normalizarNivelExperiencia(datos.nivel_experiencia),
      disponibilidad_dias:        Number(datos.disponibilidad_dias),
      grupo_muscular_prioritario: datos.grupo_muscular_prioritario || null,
      observaciones:              datos.observaciones || null,
      registrado_por:             registradoPor,
    });
    return { id_ciclo: id, message: 'Ciclo creado correctamente' };
  },


  // Parte 1: CRUD completo de ciclos — PATCH /ciclos/:id_ciclo
  /**
   * updateCiclo — Actualiza un ciclo (PATCH /ciclos/:id_ciclo, Admin/Entrenador).
   * Valida la existencia del ciclo (404), que fecha_fin > fecha_inicio
   * (CHECK chk_ciclo_fechas), el rango 1–7 de disponibilidad_dias y los ENUMs
   * objetivo_fisico/nivel_experiencia. Solo envía al modelo los campos que
   * realmente cambiaron (menos UPDATEs inútiles).
   *
   * @param {number} id_ciclo - Ciclo a actualizar.
   * @param {Object} datos    - Campos a actualizar (todos opcionales).
   * @returns {Promise<boolean>} true si el UPDATE afectó filas.
   * @throws {Error} err.code: NO_ENCONTRADO / DATOS_INVALIDOS.
   */
  updateCiclo: async (id_ciclo, datos) => {
    if (!id_ciclo) throw new Error('id_ciclo requerido');

    // Validar que el ciclo exista (404 si no)
    const existente = await CicloModel.findById(id_ciclo);
    if (!existente) {
      const err = new Error('Ciclo no encontrado');
      err.code = 'NO_ENCONTRADO';
      throw err;
    }

    // Fechas: fecha_fin > fecha_inicio (CHECK chk_ciclo_fechas del schema)
    const fechaInicio = datos.fecha_inicio !== undefined ? normalizarFecha(datos.fecha_inicio) : existente.fecha_inicio;
    const fechaFin    = datos.fecha_fin    !== undefined ? normalizarFecha(datos.fecha_fin)    : existente.fecha_fin;
    if (fechaInicio && fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) {
      const err = new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      err.code = 'DATOS_INVALIDOS';
      throw err;
    }

    // Rango OBLIGATORIO de disponibilidad_dias (CHECK 1-7)
    if (datos.disponibilidad_dias !== undefined) {
      const dias = Number(datos.disponibilidad_dias);
      if (!Number.isInteger(dias) || dias < 1 || dias > 7) {
        const err = new Error('disponibilidad_dias debe estar entre 1 y 7');
        err.code = 'DATOS_INVALIDOS';
        throw err;
      }
      datos.disponibilidad_dias = dias;
    }

    // ENUMs controlados de CICLO
    const OBJETIVOS = OBJETIVOS_VALIDOS;
    const NIVELES   = NIVELES_VALIDOS;
    // Acepta tildes: normaliza antes de validar (Pérdida de grasa → Perdida de grasa)
    const objetivoFisico      = datos.objetivo_fisico      ? normalizarObjetivoFisico(datos.objetivo_fisico)      : datos.objetivo_fisico;
    const nivelExperiencia    = datos.nivel_experiencia    ? normalizarNivelExperiencia(datos.nivel_experiencia) : datos.nivel_experiencia;
    if (objetivoFisico && !OBJETIVOS.includes(objetivoFisico)) {
      const err = new Error('objetivo_fisico inválido');
      err.code = 'DATOS_INVALIDOS';
      throw err;
    }
    if (nivelExperiencia && !NIVELES.includes(nivelExperiencia)) {
      const err = new Error('nivel_experiencia inválido');
      err.code = 'DATOS_INVALIDOS';
      throw err;
    }

    const affected = await CicloModel.update(id_ciclo, {
      fecha_inicio:                    fechaInicio !== existente.fecha_inicio ? fechaInicio : undefined,
      fecha_fin:                       fechaFin    !== existente.fecha_fin    ? fechaFin    : undefined,
      objetivo_fisico:                 objetivoFisico,
      nivel_experiencia:               nivelExperiencia,
      disponibilidad_dias:             datos.disponibilidad_dias,
      grupo_muscular_prioritario:      datos.grupo_muscular_prioritario,
      observaciones:                   datos.observaciones,
      activo:                          datos.activo !== undefined ? (datos.activo ? 1 : 0) : undefined,
    });
    return affected > 0;
  },

  // Parte 1: DELETE /ciclos/:id_ciclo (solo Admin) con borrado en cascada explícito
  /**
   * deleteCiclo — Elimina un ciclo (DELETE /ciclos/:id_ciclo, solo Admin).
   * El borrado en cascada EXPLÍCITO lo ejecuta CicloModel.remove (las FKs
   * reales usan ON DELETE RESTRICT). Devuelve false con err.code
   * NO_ENCONTRADO si el ciclo no existe.
   *
   * @param {number} id_ciclo - Ciclo a eliminar.
   * @returns {Promise<boolean>} true si se eliminó.
   * @throws {Error} err.code: NO_ENCONTRADO.
   */
  deleteCiclo: async (id_ciclo) => {
    if (!id_ciclo) throw new Error('id_ciclo requerido');
    const existente = await CicloModel.findById(id_ciclo);
    if (!existente) {
      const err = new Error('Ciclo no encontrado');
      err.code = 'NO_ENCONTRADO';
      throw err;
    }
    const affected = await CicloModel.remove(id_ciclo);
    return affected > 0;
  },

  /** Lista las restricciones médicas del afiliado. */
  getRestricciones: async (id) => {
    return CatalogoModel.getRestriccionesByAfiliado(id);
  },

  /** Asigna una restricción médica del catálogo a un afiliado. */
  addRestriccion: async (id, id_restriccion) => {
    if (!id_restriccion) {
      throw new Error('id_restriccion requerido');
    }
    await CatalogoModel.addRestriccionToAfiliado(id, id_restriccion);
    return { message: 'Restricción asignada' };
  },

  /** Quita una restricción del afiliado. @returns {Promise<boolean>} */
  removeRestriccion: async (id, id_restriccion) => {
    const affected = await CatalogoModel.removeRestriccionFromAfiliado(id, id_restriccion);
    return affected > 0;
  },

  /**
   * getEjerciciosDisponibles — Ejercicios del catálogo compatibles con el
   * afiliado: excluye los marcados como contraindicados por sus restricciones.
   */
  getEjerciciosDisponibles: async (id) => {
    return CatalogoModel.getEjerciciosDisponibles(id);
  },

  /** Alimentos del catálogo excluyendo los contraindicados por restricciones. */
  getAlimentosDisponibles: async (id) => {
    return CatalogoModel.getAlimentosDisponibles(id);
  },

  /** Historial de fichas de progreso físico del afiliado. */
  getProgreso: async (id) => {
    return CatalogoModel.getProgresoByAfiliado(id);
  },

  /**
   * createProgreso — Registra una ficha de progreso físico (peso/IMC/medidas).
   * Valida id_ciclo, fecha_registro y peso (acepta alias `peso` o `peso_kg`).
   *
   * @returns {Promise<{message:string}>}
   * @throws {Error} Si faltan campos requeridos.
   */
  createProgreso: async (datos, creatorId) => {
    if (!datos.id_ciclo || !datos.fecha_registro || (!datos.peso_kg && !datos.peso)) {
      throw new Error('id_ciclo, fecha_registro y peso son requeridos');
    }
    await CatalogoModel.createProgreso(datos, creatorId);
    return { message: 'Progreso registrado correctamente' };
  },

  /**
   * saveProgresoEjercicio — Guarda el progreso diario de ejercicios del
   * afiliado (qué completo hoy). Valida id_ciclo, fecha y lista de ejercicios.
   *
   * @returns {Promise<Object>} Resultado de SeguimientoDiarioModel (upsert).
   * @throws {Error} Si faltan campos requeridos.
   */
  saveProgresoEjercicio: async (idUsuario, data) => {
    const { id_ciclo, fecha, ejercicios } = data;
    if (!id_ciclo || !fecha || !ejercicios) {
      throw new Error('id_ciclo, fecha y ejercicios son requeridos');
    }
    return SeguimientoDiarioModel.saveProgresoEjercicio(idUsuario, id_ciclo, fecha, ejercicios);
  },

  /** Progreso de ejercicios del afiliado en un ciclo/fecha concretos. */
  getProgresoEjercicio: async (idUsuario, idCiclo, fecha) => {
    return SeguimientoDiarioModel.getProgresoEjercicio(idUsuario, idCiclo, fecha);
  },

  /** Guarda (upsert) los vasos de agua del afiliado en una fecha. */
  saveAgua: async (idUsuario, data) => {
    const { fecha, vasos } = data;
    if (!fecha || vasos == null) {
      throw new Error('fecha y vasos son requeridos');
    }
    return SeguimientoDiarioModel.saveAgua(idUsuario, fecha, vasos);
  },

  /** Vasos de agua tomados por el afiliado en una fecha. */
  getAgua: async (idUsuario, fecha) => {
    return SeguimientoDiarioModel.getAgua(idUsuario, fecha);
  },

  /** Guarda el consumo de alimentos del día (qué consumió) para un ciclo. */
  saveConsumoAlimento: async (idUsuario, data) => {
    const { id_ciclo, fecha, alimentos } = data;
    if (!id_ciclo || !fecha || !alimentos) {
      throw new Error('id_ciclo, fecha y alimentos son requeridos');
    }
    return SeguimientoDiarioModel.saveConsumoAlimento(idUsuario, id_ciclo, fecha, alimentos);
  },

  /** Historial de consumo de agua por rango de fechas. */
  getAguaHistorial: async (idUsuario, query) => {
    return SeguimientoDiarioModel.getAguaHistorial(idUsuario, query.fechaInicio, query.fechaFin);
  },

  /** Historial de consumo de alimentos por rango de fechas. */
  getConsumoHistorial: async (idUsuario, query) => {
    return SeguimientoDiarioModel.getConsumoHistorial(idUsuario, query.fechaInicio, query.fechaFin);
  },

  /** Historial de progreso de ejercicios (filtros: ciclo y rango de fechas). */
  getProgresoEjercicioHistorial: async (idUsuario, query) => {
    return SeguimientoDiarioModel.getProgresoEjercicioHistorial(
      idUsuario, query.id_ciclo, query.fechaInicio, query.fechaFin
    );
  },

  // ── PARTE 3: NOTA DEL AFILIADO SOBRE UN EJERCICIO ────────────
  /**
   * guardarNotaEjercicio — Guarda una nota del afiliado sobre UN ejercicio del
   * plan (PARTE 3). Valida id_ejercicio, id_ciclo y nota no vacía; normaliza
   * los ids a número y trimea la nota.
   *
   * @param {number} idUsuario - Afiliado autenticado.
   * @param {Object} data      - { id_ejercicio, id_ciclo, nota, fecha_nota? }.
   * @returns {Promise<{id_nota:number, message:string}>}
   * @throws {Error} Si faltan campos requeridos.
   */
  guardarNotaEjercicio: async (idUsuario, data) => {
    const { id_ejercicio, id_ciclo } = data;
    if (!id_ejercicio || !id_ciclo || !data.nota) {
      throw new Error('id_ejercicio, id_ciclo y nota son requeridos');
    }
    const idNota = await NotaEjercicioModel.create({
      id_usuario:   idUsuario,
      id_ejercicio: Number(id_ejercicio),
      id_ciclo:     Number(id_ciclo),
      nota:         String(data.nota).trim(),
      fecha_nota:   data.fecha_nota,
    });
    return { id_nota: idNota, message: 'Nota guardada correctamente' };
  },

  /** Notas de ejercicio del afiliado, opcionalmente filtradas por ciclo. */
  getMisNotasEjercicio: async (idUsuario, idCiclo) => {
    if (idCiclo) return NotaEjercicioModel.findByUsuarioYCiclo(idUsuario, Number(idCiclo));
    return NotaEjercicioModel.findByUsuario(idUsuario);
  },

  /** Todas las notas de ejercicio de un afiliado (vista staff). */
  getNotasEjercicioDeAfiliado: async (idUsuario) => {
    return NotaEjercicioModel.findByUsuario(idUsuario);
  },

  /**
   * actualizarNotaEjercicio — Edita el texto de una nota propia del afiliado.
   * err.code NO_ENCONTRADO si la nota no existe o no le pertenece.
   */
  actualizarNotaEjercicio: async (idUsuario, idNota, nota) => {
    if (!nota) throw new Error('nota es requerida');
    const affected = await NotaEjercicioModel.update(idNota, idUsuario, String(nota).trim());
    if (affected === 0) {
      const err = new Error('Nota no encontrada');
      err.code = 'NO_ENCONTRADO';
      throw err;
    }
    return { message: 'Nota actualizada correctamente' };
  },

  /**
   * eliminarNotaEjercicio — Borra una nota propia del afiliado.
   * err.code NO_ENCONTRADO si la nota no existe o no le pertenece.
   */
  eliminarNotaEjercicio: async (idUsuario, idNota) => {
    const affected = await NotaEjercicioModel.remove(idNota, idUsuario);
    if (affected === 0) {
      const err = new Error('Nota no encontrada');
      err.code = 'NO_ENCONTRADO';
      throw err;
    }
    return { message: 'Nota eliminada correctamente' };
  },
};

module.exports = AfiliadoService;
