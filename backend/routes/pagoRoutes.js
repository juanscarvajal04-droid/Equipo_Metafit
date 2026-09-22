// backend/routes/pagoRoutes.js
// FIX 5: Rutas de pagos vinculadas a /afiliados/:id/pagos.
// - GET  /afiliados/:id/pagos  → requireAuth → PagoController.getByAfiliado
// - POST /afiliados/:id/pagos  → requireAdminOrRecepcionista → PagoController.create
'use strict';

const { Router } = require('express');
const { requireAuth, requireAdminOrRecepcionista, requireStaff } = require('../middlewares/auth');
const PagoController = require('../controllers/pagoController');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: Pagos de membresía y métricas financieras
 */

/** @swagger
 * /afiliados/{id}/pagos:
 *   get:
 *     summary: Historial de pagos de un afiliado (staff)
 *     description: Devuelve todos los pagos del afiliado, del más reciente al más antiguo.
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Lista de pagos del afiliado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pago'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id/pagos', requireAuth, requireStaff, PagoController.getByAfiliado);

/** @swagger
 * /afiliados/{id}/pagos:
 *   post:
 *     summary: Registrar un nuevo pago de membresía (Admin o Recepcionista)
 *     description: >
 *       Crea el pago para el afiliado y, en paralelo y sin bloquear la respuesta,
 *       envía la factura por correo (Brevo) y notifica el webhook de n8n.
 *       Si la factura falla, el pago queda registrado igualmente.
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PagoCreate'
 *     responses:
 *       201:
 *         description: Pago registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: id_pago generado
 *                 fecha_vencimiento:
 *                   type: string
 *                   format: date
 *                 message:
 *                   type: string
 *                   example: Pago registrado correctamente
 *       400:
 *         description: Datos de pago inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/:id/pagos', requireAuth, requireAdminOrRecepcionista, PagoController.create);

module.exports = router;