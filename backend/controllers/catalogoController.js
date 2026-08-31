// controllers/catalogoController.js
// Hardened: BUG-010 — todos los catch usan log interno + mensaje genérico al cliente.
'use strict';
const CatalogoModel = require('../models/catalogoModel');

const CatalogoController = {

  // ── EJERCICIOS ────────────────────────────────────────────
  getAllEjercicios: async (req, res) => {
    try {
      const data = await CatalogoModel.getAllEjercicios();
      res.json(data);
    } catch (err) {
      console.error('[catalogoController.getAllEjercicios]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createEjercicio: async (req, res) => {
    const { nombre_ejercicio, grupo_muscular, nivel_minimo } = req.body;
    if (!nombre_ejercicio || !grupo_muscular || !nivel_minimo)
      return res.status(400).json({ error: 'nombre_ejercicio, grupo_muscular y nivel_minimo son requeridos' });
    try {
      const id = await CatalogoModel.createEjercicio(req.body);
      res.status(201).json({ id, message: 'Ejercicio creado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un ejercicio con ese nombre' });
      console.error('[catalogoController.createEjercicio]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── ALIMENTOS ─────────────────────────────────────────────
  getAllAlimentos: async (req, res) => {
    try {
      const data = await CatalogoModel.getAllAlimentos();
      res.json(data);
    } catch (err) {
      console.error('[catalogoController.getAllAlimentos]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createAlimento: async (req, res) => {
    const { nombre_alimento, proteinas, carbohidratos, grasas } = req.body;
    if (!nombre_alimento || proteinas == null || carbohidratos == null || grasas == null)
      return res.status(400).json({ error: 'nombre_alimento y todos los macros son requeridos' });
    try {
      const id = await CatalogoModel.createAlimento(req.body);
      res.status(201).json({ id, message: 'Alimento creado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un alimento con ese nombre' });
      console.error('[catalogoController.createAlimento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  deleteEjercicio: async (req, res) => {
    try {
      const affected = await CatalogoModel.deleteEjercicio(req.params.id);
      if (affected === 0) return res.status(404).json({ error: 'Ejercicio no encontrado' });
      res.json({ message: 'Ejercicio eliminado' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).json({ error: 'No se puede eliminar: el ejercicio está siendo usado en rutinas activas' });
      }
      console.error('[catalogoController.deleteEjercicio]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  updateEjercicio: async (req, res) => {
    const { nombre_ejercicio, grupo_muscular, nivel_minimo } = req.body;
    if (!nombre_ejercicio || !grupo_muscular || !nivel_minimo)
      return res.status(400).json({ error: 'nombre_ejercicio, grupo_muscular y nivel_minimo son requeridos' });
    try {
      const affected = await CatalogoModel.updateEjercicio(req.params.id, req.body);
      if (affected === 0) return res.status(404).json({ error: 'Ejercicio no encontrado' });
      res.json({ message: 'Ejercicio actualizado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un ejercicio con ese nombre' });
      console.error('[catalogoController.updateEjercicio]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── ALIMENTOS ─────────────────────────────────────────────
  deleteAlimento: async (req, res) => {
    try {
      const affected = await CatalogoModel.deleteAlimento(req.params.id);
      if (affected === 0) return res.status(404).json({ error: 'Alimento no encontrado' });
      res.json({ message: 'Alimento eliminado' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).json({ error: 'No se puede eliminar: el alimento está siendo usado en planes nutricionales activos' });
      }
      console.error('[catalogoController.deleteAlimento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  updateAlimento: async (req, res) => {
    const { nombre_alimento, proteinas, carbohidratos, grasas } = req.body;
    if (!nombre_alimento || proteinas == null || carbohidratos == null || grasas == null)
      return res.status(400).json({ error: 'nombre_alimento y todos los macros son requeridos' });
    try {
      const affected = await CatalogoModel.updateAlimento(req.params.id, req.body);
      if (affected === 0) return res.status(404).json({ error: 'Alimento no encontrado' });
      res.json({ message: 'Alimento actualizado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un alimento con ese nombre' });
      console.error('[catalogoController.updateAlimento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── RESTRICCIONES ─────────────────────────────────────────
  getAllRestricciones: async (req, res) => {
    try {
      const data = await CatalogoModel.getAllRestricciones();
      res.json(data);
    } catch (err) {
      console.error('[catalogoController.getAllRestricciones]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Valores permitidos por el ENUM del schema (01_estructura.sql)
  TIPOS_RESTRICCION: ['Enfermedad', 'Lesion', 'Alergia', 'Medicamento', 'Otra'],

  createRestriccion: async (req, res) => {
    const { nombre_restriccion, tipo } = req.body;
    if (!nombre_restriccion || !tipo)
      return res.status(400).json({ error: 'nombre_restriccion y tipo son requeridos' });
    if (!CatalogoController.TIPOS_RESTRICCION.includes(tipo))
      return res.status(400).json({
        error: `tipo debe ser uno de: ${CatalogoController.TIPOS_RESTRICCION.join(', ')}`,
      });
    try {
      const id = await CatalogoModel.createRestriccion(req.body);
      res.status(201).json({ id, message: 'Restricción creada' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe una restricción con ese nombre' });
      console.error('[catalogoController.createRestriccion]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  updateRestriccion: async (req, res) => {
    const { nombre_restriccion, tipo } = req.body;
    if (!nombre_restriccion || !tipo)
      return res.status(400).json({ error: 'nombre_restriccion y tipo son requeridos' });
    if (!CatalogoController.TIPOS_RESTRICCION.includes(tipo))
      return res.status(400).json({
        error: `tipo debe ser uno de: ${CatalogoController.TIPOS_RESTRICCION.join(', ')}`,
      });
    try {
      const affected = await CatalogoModel.updateRestriccion(req.params.id, req.body);
      if (affected === 0) return res.status(404).json({ error: 'Restricción no encontrada' });
      res.json({ message: 'Restricción actualizada' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe una restricción con ese nombre' });
      console.error('[catalogoController.updateRestriccion]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  deleteRestriccion: async (req, res) => {
    try {
      const affected = await CatalogoModel.deleteRestriccion(req.params.id);
      if (affected === 0) return res.status(404).json({ error: 'Restricción no encontrada' });
      res.json({ message: 'Restricción eliminada' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).json({
          error: 'No se puede eliminar: la restricción está asignada a afiliados, ejercicios o alimentos',
        });
      }
      console.error('[catalogoController.deleteRestriccion]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = CatalogoController;