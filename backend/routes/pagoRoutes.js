// backend/routes/pagoRoutes.js
// FIX 5: Rutas de pagos vinculadas a /afiliados/:id/pagos.
// - GET  /afiliados/:id/pagos  → requireAuth → PagoController.getByAfiliado
// - POST /afiliados/:id/pagos  → requireAdminOrRecepcionista → PagoController.create
'use strict';

const { Router } = require('express');
const { requireAuth, requireAdminOrRecepcionista } = require('../middlewares/auth');
const PagoController = require('../controllers/pagoController');

const router = Router();

// Obtener historial de pagos de un afiliado (cualquier usuario autenticado)
router.get('/:id/pagos', requireAuth, PagoController.getByAfiliado);

// Registrar un nuevo pago (solo Admin o Recepcionista)
router.post('/:id/pagos', requireAuth, requireAdminOrRecepcionista, PagoController.create);

module.exports = router;
