// routes/dashboardRoutes.js
const express               = require('express');
const router                = express.Router();
const DashboardController   = require('../controllers/dashboardController');
const { requireAdmin }      = require('../middlewares/auth');

// GET /dashboard/kpis → solo Administrador
router.get('/kpis', requireAdmin, DashboardController.getKPIs);

module.exports = router;