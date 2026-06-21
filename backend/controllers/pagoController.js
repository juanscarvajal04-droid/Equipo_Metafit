// backend/controllers/pagoController.js
// FIX 5 + FASE FINANZAS: getAll (todos los pagos) y getMetricas (agregados).
'use strict';

const PagoModel = require('../models/pagoModel');

const PagoController = {

  /** GET /afiliados/:id/pagos
   *  Devuelve todos los pagos del afiliado, ordenados del más reciente al más antiguo. */
  getByAfiliado: async (req, res) => {
    try {
      const pagos = await PagoModel.findByAfiliado(req.params.id);
      return res.json(pagos);
    } catch (err) {
      console.error('[pagoController.getByAfiliado]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /** GET /pagos
   *  Devuelve TODOS los pagos del sistema con JOIN para nombres. Solo Admin.
   *  Query params opcionales: fecha_inicio, fecha_fin, id_recepcionista. */
  getAll: async (req, res) => {
    try {
      const pagos = await PagoModel.getAll(req.query);
      return res.json(pagos);
    } catch (err) {
      console.error('[pagoController.getAll]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /** GET /pagos/metricas
   *  Devuelve métricas financieras agregadas: ingresos por mes, por recepcionista,
   *  total recaudado y últimos 10 pagos. Solo Admin.
   *  Query params opcionales: fecha_inicio, fecha_fin, id_recepcionista. */
  getMetricas: async (req, res) => {
    try {
      const metricas = await PagoModel.getMetricas(req.query);
      return res.json(metricas);
    } catch (err) {
      console.error('[pagoController.getMetricas]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /** POST /afiliados/:id/pagos
   *  Registra un nuevo pago para el afiliado. Responde 201 con { id_pago, fecha_vencimiento, message }. */
  create: async (req, res) => {
    try {
      const { id_pago, fecha_vencimiento } = await PagoModel.create(req.params.id, req.body);
      return res.status(201).json({
        id:               id_pago,
        fecha_vencimiento,
        message:          'Pago registrado correctamente',
      });
    } catch (err) {
      console.error('[pagoController.create]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = PagoController;
