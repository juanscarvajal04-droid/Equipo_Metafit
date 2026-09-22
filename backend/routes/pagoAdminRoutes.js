// backend/routes/pagoAdminRoutes.js
// FASE FINANZAS: Rutas administrativas de pagos (solo Admin).
// - GET  /pagos         → PagoController.getAll      (todos los pagos con JOIN)
// - GET  /pagos/metricas → PagoController.getMetricas (métricas agregadas)
'use strict';

const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const PagoController = require('../controllers/pagoController');

const router = Router();

/** @swagger
 * /pagos:
 *   get:
 *     summary: Listar todos los pagos del sistema (solo Administrador)
 *     description: >
 *       Devuelve TODOS los pagos con JOIN a nombres de afiliado y recepcionista.
 *       Soporta filtros opcionales por rango de fechas y recepcionista.
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         schema: { type: string, format: date }
 *         description: Filtrar pagos desde esta fecha (YYYY-MM-DD)
 *       - in: query
 *         name: fecha_fin
 *         schema: { type: string, format: date }
 *         description: Filtrar pagos hasta esta fecha (YYYY-MM-DD)
 *       - in: query
 *         name: id_recepcionista
 *         schema: { type: integer }
 *         description: Filtrar pagos registrados por ese id_usuario
 *     responses:
 *       200:
 *         description: Todos los pagos con datos del afiliado
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
router.get('/',       requireAuth, requireAdmin, PagoController.getAll);

/** @swagger
 * /pagos/metricas:
 *   get:
 *     summary: Métricas financieras agregadas (solo Administrador)
 *     description: >
 *       Devuelve ingresos por mes, recaudación por recepcionista, total recaudado
 *       y los últimos 10 pagos del sistema. Filtrável por fecha y recepcionista.
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fecha_fin
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: id_recepcionista
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Métricas financieras del sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ingresos_por_mes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       mes:   { type: integer, example: 6 }
 *                       anio:  { type: integer, example: 2025 }
 *                       total: { type: number,  example: 2400000 }
 *                 pagos_por_recepcionista:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_usuario:      { type: integer }
 *                       nombres:         { type: string }
 *                       apellidos:       { type: string }
 *                       total_recaudado: { type: number }
 *                       cantidad_pagos:  { type: integer }
 *                 total_recaudado:
 *                   type: number
 *                   example: 15875000
 *                 ultimos_pagos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pago'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/metricas', requireAuth, requireAdmin, PagoController.getMetricas);

module.exports = router;