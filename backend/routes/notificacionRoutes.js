// backend/routes/notificacionRoutes.js
// ─── Notificaciones contextuales del panel ───────────────────
// Router montado en '/notificaciones' (ver server.js). Endpoint único de
// lectura: requiere autenticación (token válido). Las notificaciones se
// calculan en vivo según el rol del token (req.user.role); no hay tabla de
// notificaciones ni cuerpo de petición.
'use strict';

const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const NotificacionController = require('../controllers/notificacionController');

const router = Router();

/**
 * GET /notificaciones — Devuelve las notificaciones del contexto del rol.
 *
 * Rutas protegidas por requireAuth. El rol (Administrador/Recepcionista/
 * Entrenador) viaja en el JWT, así que solo se pone requireAuth aquí: el
 * modelo ya despacha por rol y devuelve lista vacía para roles sin lógica.
 *
 * @swagger
 * /notificaciones:
 *   get:
 *     summary: Notificaciones por rol del usuario autenticado
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tipo:     { type: string }
 *                   mensaje:  { type: string }
 *                   cantidad: { type: integer }
 *                   icono:    { type: string }
 *                   ruta:     { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', requireAuth, NotificacionController.getNotificaciones);

module.exports = router;