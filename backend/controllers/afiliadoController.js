// controllers/afiliadoController.js
// Refactorizado: BUG-010 (cero fugas de err.message al cliente),
//               BUG-011 (removeRestriccion verifica affectedRows → 404),
//               BUG-012 (paginación en getAll con ?page=&limit=)
'use strict';

const AfiliadoModel = require('../models/afiliadoModel');
const CicloModel    = require('../models/cicloModel');
const PlanModel     = require('../models/planModel');
const CatalogoModel = require('../models/catalogoModel');

const AfiliadoController = {

  // ── BUG-012: Paginación en getAll ─────────────────────────
  // Sin paginación, con miles de afiliados la respuesta puede provocar
  // un OOM o timeout. Ahora acepta ?page=1&limit=50 (máx. 200).
  getAll: async (req, res) => {
    try {
      const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const afiliados = await AfiliadoModel.findAll({ page, limit });
      return res.json(afiliados);
    } catch (err) {
      // ── BUG-010 ─────────────────────────────────────────────
      console.error('[afiliadoController.getAll]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getById: async (req, res) => {
    try {
      const af = await AfiliadoModel.findById(req.params.id);
      if (!af) return res.status(404).json({ error: 'Afiliado no encontrado' });
      return res.json(af);
    } catch (err) {
      console.error('[afiliadoController.getById]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  create: async (req, res) => {
    // ── FIX: Los campos en USUARIO/AFILIADO son `nombres` y `documento`,
    //         no `nombres_afiliado`/`documento_afiliado` (vestigio del schema NoSQL).
    if (!req.body.nombres || !req.body.documento)
      return res.status(400).json({ error: 'Nombre y documento son requeridos' });
    try {
      const id = await AfiliadoModel.create(req.body, req.user.sub);
      return res.status(201).json({ id, message: 'Afiliado creado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un afiliado con ese documento o correo' });
      // ── BUG-008/BUG-010: si afiliadoModel lanza error de password, lo capturamos ──
      if (err.message && err.message.includes('contraseña'))
        return res.status(400).json({ error: err.message });
      console.error('[afiliadoController.create]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  update: async (req, res) => {
    try {
      const affected = await AfiliadoModel.update(req.params.id, req.body);
      if (!affected) return res.status(404).json({ error: 'Afiliado no encontrado' });
      return res.json({ message: 'Afiliado actualizado correctamente' });
    } catch (err) {
      console.error('[afiliadoController.update]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  delete: async (req, res) => {
    try {
      const affected = await AfiliadoModel.delete(req.params.id);
      if (!affected) return res.status(404).json({ error: 'Afiliado no encontrado' });
      return res.json({ message: 'Afiliado eliminado correctamente' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2')
        return res.status(400).json({ error: 'No se puede eliminar: el afiliado tiene datos asociados' });
      console.error('[afiliadoController.delete]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── Ciclos ────────────────────────────────────────────────
  getCiclos: async (req, res) => {
    try {
      const ciclos = await CicloModel.findByAfiliado(req.params.id);
      return res.json(ciclos);
    } catch (err) {
      console.error('[afiliadoController.getCiclos]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createCiclo: async (req, res) => {
    const {
      id_afiliado, fecha_inicio, fecha_fin,
      objetivo_fisico, nivel_experiencia, disponibilidad_dias,
      nombre_rutina, enfoque, dias_semana,
      nombre_plan, objetivo_dieta, calorias_estimadas, num_comidas_diarias, observaciones,
    } = req.body;
    if (!id_afiliado || !fecha_inicio || !fecha_fin)
      return res.status(400).json({ error: 'id_afiliado, fecha_inicio y fecha_fin son requeridos' });
    try {
      const registrado_por = req.user.sub;
      const id_ciclo = await CicloModel.create(id_afiliado, fecha_inicio, fecha_fin, registrado_por, objetivo_fisico, nivel_experiencia, disponibilidad_dias);

      // Si viene nombre_rutina, crear plan de entrenamiento con metadatos en observaciones
      if (nombre_rutina) {
        await PlanModel.createEntrenamiento(id_ciclo, registrado_por, JSON.stringify({ nombre_rutina, enfoque, dias_semana }));
      }

      // Si viene nombre_plan, crear plan nutricional con metadatos en observaciones
      if (nombre_plan) {
        const obs = JSON.stringify({ nombre_plan, objetivo_dieta, observaciones: observaciones || null });
        await PlanModel.createNutricional(id_ciclo, calorias_estimadas, num_comidas_diarias, registrado_por, obs);
      }

      return res.status(201).json({ id_ciclo, message: 'Ciclo creado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un ciclo con esa fecha de inicio para este afiliado' });
      console.error('[afiliadoController.createCiclo]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── Restricciones del afiliado ────────────────────────────
  getRestricciones: async (req, res) => {
    try {
      const restr = await CatalogoModel.getRestriccionesByAfiliado(req.params.id);
      return res.json(restr);
    } catch (err) {
      console.error('[afiliadoController.getRestricciones]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  addRestriccion: async (req, res) => {
    const { id_restriccion } = req.body;
    if (!id_restriccion) return res.status(400).json({ error: 'id_restriccion requerido' });
    try {
      await CatalogoModel.addRestriccionToAfiliado(req.params.id, id_restriccion);
      return res.status(201).json({ message: 'Restricción asignada' });
    } catch (err) {
      console.error('[afiliadoController.addRestriccion]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── BUG-011: removeRestriccion ahora verifica filas afectadas ──
  // Antes respondía 200 aunque no eliminara nada (id inexistente).
  removeRestriccion: async (req, res) => {
    try {
      const affected = await CatalogoModel.removeRestriccionFromAfiliado(
        req.params.id,
        req.params.id_restriccion
      );
      if (!affected)
        return res.status(404).json({ error: 'Restricción no encontrada para este afiliado' });
      return res.json({ message: 'Restricción removida' });
    } catch (err) {
      console.error('[afiliadoController.removeRestriccion]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── Progreso físico ───────────────────────────────────────
  getProgreso: async (req, res) => {
    try {
      const progreso = await CatalogoModel.getProgresoByAfiliado(req.params.id);
      return res.json(progreso);
    } catch (err) {
      console.error('[afiliadoController.getProgreso]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createProgreso: async (req, res) => {
    if (!req.body.id_ciclo || !req.body.fecha_registro || !req.body.peso)
      return res.status(400).json({ error: 'id_ciclo, fecha_registro y peso son requeridos' });
    try {
      await CatalogoModel.createProgreso(req.body, req.user.sub);
      return res.status(201).json({ message: 'Progreso registrado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un registro de progreso para ese ciclo en esa fecha' });
      console.error('[afiliadoController.createProgreso]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = AfiliadoController;