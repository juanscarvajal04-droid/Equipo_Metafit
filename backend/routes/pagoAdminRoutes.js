// backend/routes/pagoAdminRoutes.js
// FASE FINANZAS: Rutas administrativas de pagos (solo Admin).
// - GET  /pagos         → PagoController.getAll      (todos los pagos con JOIN)
// - GET  /pagos/metricas → PagoController.getMetricas (métricas agregadas)
'use strict';

const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const PagoController = require('../controllers/pagoController');

const router = Router();

router.get('/',       requireAuth, requireAdmin, PagoController.getAll);
router.get('/metricas', requireAuth, requireAdmin, PagoController.getMetricas);

module.exports = router;
