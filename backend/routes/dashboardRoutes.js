// routes/dashboardRoutes.js
'use strict';

const express               = require('express');
const router                = express.Router();
const DashboardController   = require('../controllers/dashboardController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: KPIs y métricas del gimnasio (solo Administrador)
 */

/**
 * @swagger
 * /dashboard/kpis:
 *   get:
 *     summary: KPIs del gimnasio (solo Administrador)
 *     description: >
 *       Devuelve métricas clave del sistema en una sola query optimizada:
 *       total de afiliados, afiliados activos, ciclos en curso, afiliados con
 *       restricciones médicas y distribución por objetivo físico.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPIs del sistema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardKPIs'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/kpis', requireAuth, requireAdmin, DashboardController.getKPIs);

module.exports = router;