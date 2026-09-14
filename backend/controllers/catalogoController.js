// backend/controllers/catalogoController.js
// ─── Catálogos: ejercicios, alimentos y restricciones ────────
// Controlador HTTP de los CRUDs maestros usados por el staff (web). Traduce
// códigos SQL (duplicados, FKs referenciadas, checks) a respuestas de negocio
// entendibles. Patrón BUG-010: log interno + mensaje genérico al cliente.
// Hardened: BUG-010 — todos los catch usan log interno + mensaje genérico al cliente.
'use strict';
const CatalogoModel = require('../models/catalogoModel');

const CatalogoController = {

  // ── EJERCICIOS ────────────────────────────────────────────
  /**
   * GET /catalogo/ejercicios — Lista el catálogo de ejercicios con sus
   * restricciones excluidas (resamblado en el modelo, sin N+1).
   *
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con la lista o 500.
   */
  getAllEjercicios: async (req, res) => {
    try {
      const data = await CatalogoModel.getAllEjercicios();
      res.json(data);
    } catch (err) {
      console.error('[catalogoController.getAllEjercicios]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /catalogo/ejercicios — Crea un ejercicio. Valida los tres campos
   * obligatorios (nombre, grupo muscular y nivel mínimo). ER_DUP_ENTRY por el
   * nombre único → 400.
   *
   * @param {Object} req - Express request (body.nombre_ejercicio, grupo_muscular,
   *                       nivel_minimo requeridos; descripcion opcional)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 201 con el id, 400 o 500.
   */
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
  /**
   * GET /catalogo/alimentos — Lista el catálogo de alimentos (lee la VIEW
   * v_alimento_calorias que ya trae las calorías por 100g calculadas).
   *
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con la lista o 500.
   */
  getAllAlimentos: async (req, res) => {
    try {
      const data = await CatalogoModel.getAllAlimentos();
      res.json(data);
    } catch (err) {
      console.error('[catalogoController.getAllAlimentos]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /catalogo/alimentos — Crea un alimento. Usa `== null` (no `!`) porque
   * 0 ES un macro válido (alimento sin grasa, por ejemplo). ER_DUP_ENTRY por
   * nombre único → 400.
   *
   * @param {Object} req - Express request (body.nombre_alimento, proteinas,
   *                       carbohidratos, grasas requeridos)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 201 con el id, 400 o 500.
   */
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

  /**
   * DELETE /catalogo/ejercicios/:id — Elimina un ejercicio del catálogo.
   * Los códigos ER_ROW_IS_REFERENCED* (FK) se traducen a 409: el ejercicio
   * está en uso en rutinas activas y no puede borrarse.
   *
   * @param {Object} req - Express request (params.id)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 404, 409 o 500.
   */
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

  /**
   * PUT/PATCH /catalogo/ejercicios/:id — Actualiza un ejercicio del catálogo.
   * `descripcion` opcional (se vacía si el body la manda vacía). 404 si el id
   * no existe; ER_DUP_ENTRY por nombre en uso → 400.
   *
   * @param {Object} req - Express request (params.id; body.nombre_ejercicio,
   *                       grupo_muscular, nivel_minimo requeridos)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 400, 404 o 500.
   */
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
  /**
   * DELETE /catalogo/alimentos/:id — Elimina un alimento del catálogo. Igual
   * que el de ejercicios, los códigos FK se traducen a 409 (alimento en uso en
   * planes nutricionales activos).
   *
   * @param {Object} req - Express request (params.id)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 404, 409 o 500.
   */
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

  /**
   * PUT/PATCH /catalogo/alimentos/:id — Actualiza un alimento del catálogo.
   * Misma validación `== null` que create (el 0 es un macro válido).
   *
   * @param {Object} req - Express request (params.id; body.nombre_alimento y
   *                       macros requeridos)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 400, 404 o 500.
   */
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
  /**
   * GET /catalogo/restricciones — Lista el catálogo de restricciones médicas.
   *
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con la lista o 500.
   */
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

  /**
   * POST /catalogo/restricciones — Crea una restricción. Valida además que
   * `tipo` sea uno de los valores del ENUM del schema (TIPOS_RESTRICCION) para
   * fallar antes de llegar a la base de datos.
   *
   * @param {Object} req - Express request (body.nombre_restriccion, tipo
   *                       requeridos; efecto_relevante opcional)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 201 con el id, 400 o 500.
   */
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

  /**
   * PUT/PATCH /catalogo/restricciones/:id — Actualiza una restricción. Misma
   * validación de `tipo` contra el ENUM que create.
   *
   * @param {Object} req - Express request (params.id; body.nombre_restriccion,
   *                       tipo requeridos)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 400, 404 o 500.
   */
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

  /**
   * DELETE /catalogo/restricciones/:id — Elimina una restricción. Los códigos
   * FK se traducen a 409: la restricción está asignada a afiliados, ejercicios
   * o alimentos y no puede borrarse.
   *
   * @param {Object} req - Express request (params.id)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200, 404, 409 o 500.
   */
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