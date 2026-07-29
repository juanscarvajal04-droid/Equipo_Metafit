// backend/routes/configuracionRoutes.js
'use strict';

const express                  = require('express');
const router                   = express.Router();
const ConfiguracionController  = require('../controllers/configuracionController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

router.get('/precio-membresia', requireAuth, requireAdmin, ConfiguracionController.getPrecioMembresia);
router.put('/precio-membresia', requireAuth, requireAdmin, ConfiguracionController.updatePrecioMembresia);

module.exports = router;
