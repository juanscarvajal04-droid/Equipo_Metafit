// controllers/planController.js
// Hardened: BUG-010 — todos los catch ahora usan log interno + mensaje genérico al cliente.
'use strict';
const PlanModel = require('../models/planModel');
const { enviarPushAUsuarioDelCiclo } = require('../services/pushService');

const PlanController = {

  // ── PLAN ENTRENAMIENTO ────────────────────────────────────
  getEntrenamiento: async (req, res) => {
    try {
      const plan = await PlanModel.getEntrenamientoByCiclo(req.params.id_ciclo);
      if (!plan) return res.status(404).json({ error: 'Plan de entrenamiento no encontrado para este ciclo' });
      res.json(plan);
    } catch (err) {
      console.error('[planController.getEntrenamiento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createEntrenamiento: async (req, res) => {
    const { id_ciclo, observaciones } = req.body;
    if (!id_ciclo) return res.status(400).json({ error: 'id_ciclo es requerido' });
    try {
      const id = await PlanModel.createEntrenamiento(
        id_ciclo, req.user.sub, observaciones
      );
      enviarPushAUsuarioDelCiclo(id_ciclo, {
        title: '🏋️ Nueva rutina asignada',
        body: 'Tu entrenador te asignó un plan de entrenamiento. ¡A darle!',
        data: { screen: 'Rutina' },
      });
      res.status(201).json({ id_ciclo: id, message: 'Plan de entrenamiento creado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Este ciclo ya tiene un plan de entrenamiento' });
      console.error('[planController.createEntrenamiento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  updateEntrenamiento: async (req, res) => {
    try {
      await PlanModel.updateEntrenamiento(req.params.id, req.body, req.user.sub);
      res.json({ message: 'Plan de entrenamiento actualizado' });
    } catch (err) {
      console.error('[planController.updateEntrenamiento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── RUTINAS ───────────────────────────────────────────────
  createRutina: async (req, res) => {
    const { id_ciclo, nombre_rutina, enfoque_muscular, dia_numero } = req.body;
    if (!id_ciclo || !nombre_rutina || !dia_numero)
      return res.status(400).json({ error: 'id_ciclo, nombre_rutina y dia_numero son requeridos' });
    try {
      const id = await PlanModel.createRutina(
        id_ciclo, nombre_rutina, enfoque_muscular, dia_numero
      );
      res.status(201).json({ id, message: 'Rutina creada correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: `Ya existe una rutina el día ${dia_numero} en este ciclo` });
      console.error('[planController.createRutina]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  addEjercicio: async (req, res) => {
    const { id_ejercicio, series, repeticiones, orden } = req.body;
    if (!id_ejercicio || !series || !repeticiones || !orden)
      return res.status(400).json({ error: 'id_ejercicio, series, repeticiones y orden son requeridos' });
    try {
      await PlanModel.addEjercicioToRutina(
        req.params.id_rutina, id_ejercicio, series, repeticiones, orden
      );
      res.status(201).json({ message: 'Ejercicio añadido a la rutina' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ese ejercicio ya está en la rutina o ese orden ya existe' });
      console.error('[planController.addEjercicio]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  removeEjercicio: async (req, res) => {
    try {
      await PlanModel.removeEjercicioFromRutina(
        req.params.id_rutina, req.params.id_ejercicio
      );
      res.json({ message: 'Ejercicio eliminado de la rutina' });
    } catch (err) {
      console.error('[planController.removeEjercicio]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  deleteRutina: async (req, res) => {
    try {
      await PlanModel.deleteRutina(req.params.id_rutina);
      res.json({ message: 'Rutina eliminada correctamente' });
    } catch (err) {
      console.error('[planController.deleteRutina]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ── PLAN NUTRICIONAL ──────────────────────────────────────
  getNutricional: async (req, res) => {
    try {
      const plan = await PlanModel.getNutricionalByCiclo(req.params.id_ciclo);
      if (!plan) return res.status(404).json({ error: 'Plan nutricional no encontrado para este ciclo' });
      res.json(plan);
    } catch (err) {
      console.error('[planController.getNutricional]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  createNutricional: async (req, res) => {
    // Acepta tanto nombres nuevos (calorias_objetivo/num_comidas) como legacy
    const id_ciclo          = req.body.id_ciclo;
    const calorias_objetivo = req.body.calorias_objetivo || req.body.calorias_estimadas;
    const num_comidas       = req.body.num_comidas || req.body.num_comidas_diarias;
    const observaciones     = req.body.observaciones;

    if (!id_ciclo || !calorias_objetivo || !num_comidas)
      return res.status(400).json({ error: 'id_ciclo, calorias_objetivo y num_comidas son requeridos' });
    try {
      const id = await PlanModel.createNutricional(
        id_ciclo, calorias_objetivo, num_comidas, req.user.sub, observaciones
      );
      enviarPushAUsuarioDelCiclo(id_ciclo, {
        title: '🥗 Nueva dieta asignada',
        body: 'Tu nutricionista te asignó un plan de alimentación. ¡A comer rico y sano!',
        data: { screen: 'Dieta' },
      });
      res.status(201).json({ id_ciclo: id, message: 'Plan nutricional creado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Este ciclo ya tiene un plan nutricional' });
      console.error('[planController.createNutricional]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  updateNutricional: async (req, res) => {
    const calorias_objetivo = req.body.calorias_objetivo || req.body.calorias_estimadas;
    const num_comidas       = req.body.num_comidas || req.body.num_comidas_diarias;
    const observaciones     = req.body.observaciones;
    if (!calorias_objetivo || !num_comidas)
      return res.status(400).json({ error: 'calorias_objetivo y num_comidas son requeridos' });
    try {
      await PlanModel.updateNutricional(
        req.params.id, { calorias_objetivo, num_comidas, observaciones }, req.user.sub
      );
      res.json({ message: 'Plan nutricional actualizado' });
    } catch (err) {
      console.error('[planController.updateNutricional]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  addAlimento: async (req, res) => {
    // Acepta tanto nombres nuevos (num_comida/cantidad_g) como legacy
    const id_alimento = req.body.id_alimento;
    const num_comida  = req.body.num_comida  || req.body.numero_comida;
    const cantidad_g  = req.body.cantidad_g  || req.body.cantidad;
    if (!id_alimento || !num_comida || !cantidad_g)
      return res.status(400).json({ error: 'id_alimento, num_comida y cantidad_g son requeridos' });
    try {
      await PlanModel.addAlimentoToDetalle(
        req.params.id_plan, id_alimento, num_comida, cantidad_g
      );
      res.status(201).json({ message: 'Alimento añadido al plan nutricional' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ese alimento ya está en esa comida del plan' });
      console.error('[planController.addAlimento]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = PlanController;