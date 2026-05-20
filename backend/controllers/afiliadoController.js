// controllers/afiliadoController.js
const AfiliadoModel = require('../models/afiliadoModel');
const CicloModel    = require('../models/cicloModel');
const PlanModel     = require('../models/planModel');
const CatalogoModel = require('../models/catalogoModel');

const AfiliadoController = {

  getAll: async (req, res) => {
    try {
      const afiliados = await AfiliadoModel.findAll();
      res.json(afiliados);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  getById: async (req, res) => {
    try {
      const af = await AfiliadoModel.findById(req.params.id);
      if (!af) return res.status(404).json({ error: 'Afiliado no encontrado' });
      res.json(af);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  create: async (req, res) => {
    if (!req.body.nombres_afiliado || !req.body.documento_afiliado)
      return res.status(400).json({ error: 'Nombre y documento son requeridos' });
    try {
      const id = await AfiliadoModel.create(req.body, req.user.sub);
      res.status(201).json({ id, message: 'Afiliado creado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un afiliado con ese documento o correo' });
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const affected = await AfiliadoModel.update(req.params.id, req.body);
      if (!affected) return res.status(404).json({ error: 'Afiliado no encontrado' });
      res.json({ message: 'Afiliado actualizado correctamente' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  delete: async (req, res) => {
    try {
      const affected = await AfiliadoModel.delete(req.params.id);
      if (!affected) return res.status(404).json({ error: 'Afiliado no encontrado' });
      res.json({ message: 'Afiliado eliminado correctamente' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2')
        return res.status(400).json({ error: 'No se puede eliminar: el afiliado tiene datos asociados' });
      res.status(500).json({ error: err.message });
    }
  },

  // ── Ciclos ────────────────────────────────────────────────
  getCiclos: async (req, res) => {
    try {
      const ciclos = await CicloModel.findByAfiliado(req.params.id);
      res.json(ciclos);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  createCiclo: async (req, res) => {
    const { id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo } = req.body;
    if (!id_afiliado || !fecha_inicio_ciclo || !fecha_fin_ciclo)
      return res.status(400).json({ error: 'id_afiliado, fecha_inicio y fecha_fin son requeridos' });
    try {
      const id = await CicloModel.create(id_afiliado, fecha_inicio_ciclo, fecha_fin_ciclo);
      res.status(201).json({ id_ciclo: id, message: 'Ciclo creado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un ciclo con esa fecha de inicio para este afiliado' });
      res.status(500).json({ error: err.message });
    }
  },

  // ── Restricciones del afiliado ────────────────────────────
  getRestricciones: async (req, res) => {
    try {
      const restr = await CatalogoModel.getRestriccionesByAfiliado(req.params.id);
      res.json(restr);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  addRestriccion: async (req, res) => {
    const { id_restriccion } = req.body;
    if (!id_restriccion) return res.status(400).json({ error: 'id_restriccion requerido' });
    try {
      await CatalogoModel.addRestriccionToAfiliado(req.params.id, id_restriccion);
      res.status(201).json({ message: 'Restricción asignada' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  removeRestriccion: async (req, res) => {
    try {
      await CatalogoModel.removeRestriccionFromAfiliado(req.params.id, req.params.id_restriccion);
      res.json({ message: 'Restricción removida' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  // ── Progreso físico ───────────────────────────────────────
  getProgreso: async (req, res) => {
    try {
      const progreso = await CatalogoModel.getProgresoByAfiliado(req.params.id);
      res.json(progreso);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  createProgreso: async (req, res) => {
    if (!req.body.id_ciclo || !req.body.fecha_registro || !req.body.peso)
      return res.status(400).json({ error: 'id_ciclo, fecha_registro y peso son requeridos' });
    try {
      await CatalogoModel.createProgreso(req.body, req.user.sub);
      res.status(201).json({ message: 'Progreso registrado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un registro de progreso para ese ciclo en esa fecha' });
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = AfiliadoController;