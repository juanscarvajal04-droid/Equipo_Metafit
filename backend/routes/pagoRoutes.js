// backend/routes/pagoRoutes.js
// ─── Pagos de membresía por afiliado ─────────────────────────
// Router montado en '/afiliados' (ver server.js) → expone los endpoints
// /afiliados/:id/pagos. Los endpoints GLOBALES de pagos (GET /pagos y
// GET /pagos/metricas, solo Admin) viven en pagoAdminRoutes.js, que se monta
// aparte en '/pagos' (FASE FINANZAS).
// FIX 5: Rutas de pagos vinculadas a /afiliados/:id/pagos.
// - GET  /afiliados/:id/pagos  → requireAuth → PagoController.getByAfiliado
// - POST /afiliados/:id/pagos  → requireAdminOrRecepcionista → PagoController.create
'use strict';

const { Router } = require('express');
const { requireAuth, requireAdminOrRecepcionista, requireStaff } = require('../middlewares/auth');
const PagoController = require('../controllers/pagoController');

const router = Router();

/** Obtener historial de pagos de un afiliado (solo staff: Admin/Entrenador/Recepcionista) */
router.get('/:id/pagos', requireAuth, requireStaff, PagoController.getByAfiliado);

/** Registrar un nuevo pago (solo Admin o Recepcionista — quien cobra en mostrador) */
router.post('/:id/pagos', requireAuth, requireAdminOrRecepcionista, PagoController.create);

module.exports = router;