// controllers/dashboardController.js
const CatalogoModel = require('../models/catalogoModel');

const DashboardController = {

  getKPIs: async (req, res) => {
    try {
      const kpis = await CatalogoModel.getDashboardKPIs();
      res.json(kpis);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },
};

module.exports = DashboardController;