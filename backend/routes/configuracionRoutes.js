// backend/routes/configuracionRoutes.js
'use strict';

const express                  = require('express');
const router                   = express.Router();
const ConfiguracionController  = require('../controllers/configuracionController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Configuración
 *   description: Parámetros del sistema editables por el Administrador
 */

/** @swagger
 * /configuracion/precio-membresia:
 *   get:
 *     summary: Obtener el precio de la membresía (solo Administrador)
 *     description: Devuelve el valor vigente de la membresía mensual. Si no está configurado, el default es 80000.
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Precio de membresía vigente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clave: { type: string, example: precio_membresia }
 *                 valor: { type: number, example: 82000 }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/precio-membresia', requireAuth, requireAdmin, ConfiguracionController.getPrecioMembresia);

/** @swagger
 * /configuracion/precio-membresia:
 *   put:
 *     summary: Actualizar el precio de la membresía (solo Administrador)
 *     description: >
 *       Actualiza el valor mensual de la membresía. El valor debe ser un número positivo.
 *       Se redondea al entero más cercano antes de persistir.
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [valor]
 *             properties:
 *               valor:
 *                 type: number
 *                 example: 82000
 *                 description: Nuevo precio de membresía (positivo)
 *     responses:
 *       200:
 *         description: Precio actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Precio de membresia actualizado' }
 *                 valor:   { type: number, example: 82000 }
 *       400:
 *         description: valor faltante o no es un número positivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: valor debe ser un numero positivo
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/precio-membresia', requireAuth, requireAdmin, ConfiguracionController.updatePrecioMembresia);

module.exports = router;