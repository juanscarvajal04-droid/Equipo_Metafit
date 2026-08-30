// backend/services/afiliadoService.js
'use strict';

const AfiliadoModel          = require('../models/afiliadoModel');
const CicloModel             = require('../models/cicloModel');
const CatalogoModel          = require('../models/catalogoModel');
const SeguimientoDiarioModel = require('../models/seguimientoDiarioModel');

// FIX 1.3 / ISO 25000: normalizarFecha extraída a utils/fechaUtils.js
// para que sea testeable sin dependencia de BD.
const { normalizarFecha } = require('../utils/fechaUtils');


const AfiliadoService = {

  getAll: async ({ page, limit }) => {
    return AfiliadoModel.findAll({ page, limit });
  },

  getById: async (id) => {
    return AfiliadoModel.findById(id);
  },

  create: async (datos, creatorId) => {
    if (!datos.nombres || !datos.documento) {
      throw new Error('Nombre y documento son requeridos');
    }

    // FIX 1.3: normalizar fecha_nacimiento antes de insertar
    const datosNormalizados = {
      ...datos,
      fecha_nacimiento: normalizarFecha(datos.fecha_nacimiento),
    };

    const id = await AfiliadoModel.create(datosNormalizados, creatorId);
    return { id, message: 'Afiliado creado correctamente' };
  },

  update: async (id, datos) => {
    const affected = await AfiliadoModel.update(id, datos);
    return affected > 0;
  },

  getFoto: async (id) => {
    return AfiliadoModel.getFoto(id);
  },

  setFoto: async (id, foto) => {
    return AfiliadoModel.setFoto(id, foto);
  },

  delete: async (id) => {
    const affected = await AfiliadoModel.delete(id);
    return affected > 0;
  },

  getCiclos: async (id) => {
    return CicloModel.findByAfiliado(id);
  },

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
      objetivo_fisico:            datos.objetivo_fisico,
      nivel_experiencia:          datos.nivel_experiencia,
      disponibilidad_dias:        Number(datos.disponibilidad_dias),
      grupo_muscular_prioritario: datos.grupo_muscular_prioritario || null,
      observaciones:              datos.observaciones || null,
      registrado_por:             registradoPor,
    });
    return { id_ciclo: id, message: 'Ciclo creado correctamente' };
  },


  getRestricciones: async (id) => {
    return CatalogoModel.getRestriccionesByAfiliado(id);
  },

  addRestriccion: async (id, id_restriccion) => {
    if (!id_restriccion) {
      throw new Error('id_restriccion requerido');
    }
    await CatalogoModel.addRestriccionToAfiliado(id, id_restriccion);
    return { message: 'Restricción asignada' };
  },

  removeRestriccion: async (id, id_restriccion) => {
    const affected = await CatalogoModel.removeRestriccionFromAfiliado(id, id_restriccion);
    return affected > 0;
  },

  getEjerciciosDisponibles: async (id) => {
    return CatalogoModel.getEjerciciosDisponibles(id);
  },

  getAlimentosDisponibles: async (id) => {
    return CatalogoModel.getAlimentosDisponibles(id);
  },

  getProgreso: async (id) => {
    return CatalogoModel.getProgresoByAfiliado(id);
  },

  createProgreso: async (datos, creatorId) => {
    if (!datos.id_ciclo || !datos.fecha_registro || (!datos.peso_kg && !datos.peso)) {
      throw new Error('id_ciclo, fecha_registro y peso son requeridos');
    }
    await CatalogoModel.createProgreso(datos, creatorId);
    return { message: 'Progreso registrado correctamente' };
  },

  saveProgresoEjercicio: async (idUsuario, data) => {
    const { id_ciclo, fecha, ejercicios } = data;
    if (!id_ciclo || !fecha || !ejercicios) {
      throw new Error('id_ciclo, fecha y ejercicios son requeridos');
    }
    return SeguimientoDiarioModel.saveProgresoEjercicio(idUsuario, id_ciclo, fecha, ejercicios);
  },

  getProgresoEjercicio: async (idUsuario, idCiclo, fecha) => {
    return SeguimientoDiarioModel.getProgresoEjercicio(idUsuario, idCiclo, fecha);
  },

  saveAgua: async (idUsuario, data) => {
    const { fecha, vasos } = data;
    if (!fecha || vasos == null) {
      throw new Error('fecha y vasos son requeridos');
    }
    return SeguimientoDiarioModel.saveAgua(idUsuario, fecha, vasos);
  },

  getAgua: async (idUsuario, fecha) => {
    return SeguimientoDiarioModel.getAgua(idUsuario, fecha);
  },

  saveConsumoAlimento: async (idUsuario, data) => {
    const { id_ciclo, fecha, alimentos } = data;
    if (!id_ciclo || !fecha || !alimentos) {
      throw new Error('id_ciclo, fecha y alimentos son requeridos');
    }
    return SeguimientoDiarioModel.saveConsumoAlimento(idUsuario, id_ciclo, fecha, alimentos);
  }
};

module.exports = AfiliadoService;
