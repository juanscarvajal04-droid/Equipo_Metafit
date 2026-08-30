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
   *  Registra un nuevo pago para el afiliado. Responde 201 con { id_pago, fecha_vencimiento, message }.
   *  Después de registrar, dispara (en paralelo) el envío automático de la factura por correo:
   *  si el correo falla, el pago queda registrado igualmente (la factura es un extra). */
  create: async (req, res) => {
    try {
      const { id_pago, fecha_vencimiento } = await PagoModel.create(req.params.id, {
        ...req.body,
        registrado_por: req.user.sub,
      });

      // ── Factura por correo + webhook n8n (asíncrono, no bloquea la respuesta) ──
      const datosPago = {
        id_pago,
        fecha_pago: req.body.fecha_pago || new Date().toISOString().split('T')[0],
        valor_pagado: req.body.valor_pagado ?? 80000,
        estado: req.body.estado || 'Pagado',
        metodo_pago: req.body.metodo_pago || 'Efectivo',
      };
      (async () => {
        try {
          const AfiliadoModel = require('../models/afiliadoModel');
          const afiliado = await AfiliadoModel.findById(req.params.id);
          if (!afiliado) {
            console.error('[pagoController.create] afiliado no encontrado para factura');
            return;
          }
          // Factura por correo (Brevo)
          const { enviarFacturaPago } = require('../services/facturaService');
          const enviado = await enviarFacturaPago(datosPago, afiliado);
          console.log(`[pagoController.create] factura FAC-${new Date().getFullYear()}-${id_pago} → ${enviado ? 'enviada' : 'NO enviada'} (${afiliado.correo})`);
          // Webhook n8n (Telegram + Google Sheets + WhatsApp futuro)
          const { notificarPago } = require('../services/n8nWebhookService');
          await notificarPago({ ...datosPago, fecha_vencimiento }, afiliado);
        } catch (errFactura) {
          console.error('[pagoController.create] error post-pago (no afecta el pago):', errFactura.message);
        }
      })();

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
