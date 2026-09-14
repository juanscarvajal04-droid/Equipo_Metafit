// backend/routes/pagoAdminRoutes.js
// ─── FASE FINANZAS: PagoController (solo Admin) ───────────────
// Router montado en '/pagos' en server.js SOLO bajo /pagos (no /api).
// Fue separado de pagoRoutes.js (pagos del afiliado) para darle al Admin vistas
// agregadas de la operación financiera del gimnasio.
// TODAS las rutas exigen requireAuth + requireAdmin.
// Mapa de rutas (los bloques @swagger de cada una documentan body y respuestas):
//   · GET /pagos          → PagoController.getAll   (todos los pagos con JOIN + filtros)
//   · GET /pagos/metricas → PagoController.getMetricas (métricas agregadas: ingresos, mora, etc.)
'use strict';

const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const PagoController = require('../controllers/pagoController');

const router = Router();

router.get('/',       requireAuth, requireAdmin, PagoController.getAll);
router.get('/metricas', requireAuth, requireAdmin, PagoController.getMetricas);

module.exports = router;
