// controllers/dashboardController.js
// Hardened: BUG-010 — catch usa log interno + mensaje genérico al cliente.
'use strict';
const CatalogoModel = require('../models/catalogoModel');

const DashboardController = {

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