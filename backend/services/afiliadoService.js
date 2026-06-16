// backend/services/afiliadoService.js
'use strict';

const AfiliadoModel = require('../models/afiliadoModel');
const CicloModel    = require('../models/cicloModel');
const CatalogoModel = require('../models/catalogoModel');

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

  delete: async (id) => {
    const affected = await AfiliadoModel.delete(id);
    return affected > 0;
  },

  getCiclos: async (id) => {
    return CicloModel.findByAfiliado(id);
  },

  createCiclo: async (datos) => {
    const id_afiliado = datos.id_afiliado;
    const fecha_inicio_ciclo = datos.fecha_inicio_ciclo || datos.fecha_inicio;
    const fecha_fin_ciclo = datos.fecha_fin_ciclo || datos.fecha_fin;

    if (!id_afiliado || !fecha_inicio_ciclo || !fecha_fin_ciclo) {
      throw new Error('id_afiliado, fecha_inicio y fecha_fin son requeridos');
    }

    const id = await CicloModel.create(id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo);
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

  getProgreso: async (id) => {
    return CatalogoModel.getProgresoByAfiliado(id);
  },

  createProgreso: async (datos, creatorId) => {
    if (!datos.id_ciclo || !datos.fecha_registro || !datos.peso) {
      throw new Error('id_ciclo, fecha_registro y peso son requeridos');
    }
    await CatalogoModel.createProgreso(datos, creatorId);
    return { message: 'Progreso registrado correctamente' };
  }
};

module.exports = AfiliadoService;
