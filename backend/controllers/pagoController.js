// backend/controllers/pagoController.js
// FIX 5: Controlador de pagos — mismo patrón de try/catch + console.error
// que afiliadoController.js.
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
