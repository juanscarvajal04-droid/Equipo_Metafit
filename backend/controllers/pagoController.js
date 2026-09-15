// backend/controllers/pagoController.js
// ─── Pagos de membresía ──────────────────────────────────────
// Controlador HTTP de los pagos: consulta por afiliado, listado global y
// métricas (Fase Finanzas) y alta de pagos con facturación automática.
// FIX 5 + FASE FINANZAS: getAll (todos los pagos) y getMetricas (agregados).
'use strict';

const PagoModel = require('../models/pagoModel');

const PagoController = {

  /**
   * GET /afiliados/:id/pagos — Devuelve todos los pagos de un afiliado,
   * del más reciente al más antiguo. Se usa en la ficha del afiliado y en la
   * vista de pagos web.
   *
   * @param {Object} req - Express request (params.id = id del afiliado)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con la lista de pagos o 500.
   */
  getByAfiliado: async (req, res) => {
    try {
      const pagos = await PagoModel.findByAfiliado(req.params.id);
      return res.json(pagos);
    } catch (err) {
      console.error('[pagoController.getByAfiliado]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /pagos — Devuelve TODOS los pagos del sistema enriquecidos con los
   * nombres del afiliado y del recepcionista que lo registró (solo Admin).
   * Acepta filtros opcionales por query: fecha_inicio, fecha_fin,
   * id_recepcionista.
   *
   * @param {Object} req - Express request (query.fecha_inicio/fecha_fin/id_recepcionista)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con la lista de pagos o 500.
   */
  getAll: async (req, res) => {
    try {
      const pagos = await PagoModel.getAll(req.query);
      return res.json(pagos);
    } catch (err) {
      console.error('[pagoController.getAll]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /pagos/metricas — Devuelve métricas financieras agregadas para el
   * panel de Finanzas (solo Admin): ingresos por mes, recaudo por recepcionista,
   * total general y los 10 pagos más recientes. Acepta los mismos filtros por
   * query que getAll.
   *
   * @param {Object} req - Express request (query.fecha_inicio/fecha_fin/id_recepcionista)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con las métricas o 500.
   */
  getMetricas: async (req, res) => {
    try {
      const metricas = await PagoModel.getMetricas(req.query);
      return res.json(metricas);
    } catch (err) {
      console.error('[pagoController.getMetricas]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /afiliados/:id/pagos — Registra un nuevo pago para el afiliado. El
   * `registrado_por` se toma del token (req.user.sub) para la trazabilidad.
   * Responde 201 con { id_pago, fecha_vencimiento, message }.
   *
   * DESPUÉS del insert dispara (en paralelo, sin bloquear la respuesta) la
   * facturación automática: factura por correo (Brevo) y webhook a n8n
   * (Telegram + Sheets). Si ese bloque falla, el pago queda registrado igual:
   * la factura es un extra, no un requisito del alta.
   *
   * @param {Object} req - Express request (params.id = id del afiliado; body:
   *                       fecha_pago, valor_pagado, estado, observaciones,
   *                       fecha_vencimiento, metodo_pago)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 201 con el pago creado y su vencimiento, o 500.
   */
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