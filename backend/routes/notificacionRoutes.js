// backend/routes/notificacionRoutes.js
'use strict';

const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const NotificacionController = require('../controllers/notificacionController');

const router = Router();

router.get('/', requireAuth, NotificacionController.getNotificaciones);

module.exports = router;
