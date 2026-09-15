// backend/controllers/dashboardController.js
// ─── KPIs del dashboard (rol Admin) ──────────────────────────
// Controlador mínimo: delega en CatalogoModel y traduce errores con el patrón
// BUG-010 (log interno + mensaje genérico al cliente).
// Hardened: BUG-010 — catch usa log interno + mensaje genérico al cliente.
'use strict';
const CatalogoModel = require('../models/catalogoModel');

const DashboardController = {

  /**
   * GET /dashboard/kpis — Devuelve los indicadores del panel principal:
   * totales de afiliados, staff, ciclos, pagos e ingresos, además del desglose
   * de ciclos activos por objetivo físico. La query vive consolidada en el
   * modelo para evitar roundtrips.
   *
   * @param {Object} req - Express request (sin parámetros)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con los KPIs o 500.
   */
  getKPIs: async (req, res) => {
    try {
      const kpis = await CatalogoModel.getDashboardKPIs();
      res.json(kpis);
    } catch (err) {
      console.error('[dashboardController.getKPIs]', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = DashboardController;