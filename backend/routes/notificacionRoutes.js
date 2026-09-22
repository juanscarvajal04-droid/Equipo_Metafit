// backend/routes/notificacionRoutes.js
'use strict';

const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const NotificacionController = require('../controllers/notificacionController');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Notificaciones contextuales según el rol del usuario
 */

/** @swagger
 * /notificaciones:
 *   get:
 *     summary: Listar mis notificaciones según mi rol
 *     description: >
 *       Devuelve las notificaciones contextuales del usuario autenticado según su rol:
 *       Administrador (membresías por vencer, nuevos afiliados, personal pendiente),
 *       Recepcionista (pagos por registrar) y Entrenador. El rol se toma del JWT.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notificacion'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', requireAuth, NotificacionController.getNotificaciones);

module.exports = router;