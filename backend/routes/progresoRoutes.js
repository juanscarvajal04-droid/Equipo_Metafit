// backend/routes/progresoRoutes.js
// FASE 1: resumen diario, historial por rango y evolución de un ejercicio.
// Todos usan req.user.sub (el afiliado autenticado) — sin prefijo /api (convención del repo).
'use strict';

const express = require('express');
const router = express.Router();
const ProgresoController = require('../controllers/progresoController');
const { requireAuth } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Progreso
 *   description: Progreso diario del afiliado (resumen, historial y evolución por ejercicio)
 */

/**
 * @swagger
 * /progreso/resumen:
 *   get:
 *     summary: Resumen diario del afiliado autenticado
 *     description: >
 *       Devuelve el resumen de un día (calorías consumidas, agua en vasos, ejercicios realizados,
 *       nivel de energía y estado de ánimo). Si no se envía 'fecha' se usa la fecha de hoy (local).
 *     tags: [Progreso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema: { type: string, format: date }
 *         description: Fecha del resumen (YYYY-MM-DD). Default: hoy.
 *     responses:
 *       200:
 *         description: Resumen diario del afiliado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_progreso_diario: { type: integer }
 *                 id_usuario:         { type: integer }
 *                 fecha:              { type: string, format: date }
 *                 calorias_consumidas:  { type: number, example: 1850.5 }
 *                 agua_vasos:           { type: integer, example: 8 }
 *                 ejercicios_realizados: { type: integer, example: 5 }
 *                 duracion_minutos:      { type: integer, example: 55, nullable: true }
 *                 nivel_energia:         { type: integer, example: 4, nullable: true }
 *                 estado_animo:          { type: string, enum: [Excelente, Bueno, Normal, Cansado, Agotado], nullable: true }
 *                 observaciones:         { type: string, nullable: true }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/resumen', requireAuth, ProgresoController.getResumen);

/**
 * @swagger
 * /progreso/resumen:
 *   put:
 *     summary: Actualizar el estado subjetivo del día (energía, ánimo, observaciones)
 *     description: >
 *       Actualiza nivel_energia, estado_animo, observaciones y/o duracion_minutos de la fecha indicada.
 *       Los agregados (calorías/agua/ejercicios) se calculan solos desde las tablas fuente.
 *     tags: [Progreso]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fecha]
 *             properties:
 *               fecha:            { type: string, format: date, example: '2025-02-10' }
 *               nivel_energia:    { type: integer, minimum: 1, maximum: 5 }
 *               estado_animo:     { type: string, enum: [Excelente, Bueno, Normal, Cansado, Agotado] }
 *               observaciones:    { type: string }
 *               duracion_minutos: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Resumen actualizado correctamente
 *       400:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/resumen', requireAuth, ProgresoController.updateResumen);

/**
 * @swagger
 * /progreso/historial:
 *   get:
 *     summary: Historial de resúmenes diarios del afiliado (máx. 90 días)
 *     tags: [Progreso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fechaFin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de resúmenes diarios
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/historial', requireAuth, ProgresoController.getHistorial);

/**
 * @swagger
 * /progreso/ejercicio/{idEjercicio}/evolucion:
 *   get:
 *     summary: Evolución de un ejercicio (fecha, series, reps, peso y volumen)
 *     description: >
 *       Devuelve la progresión de cargas de un ejercicio concreto del afiliado,
 *       calculando el volumen (series × reps × peso).
 *     tags: [Progreso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: idEjercicio
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: fechaInicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fechaFin
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de registros de evolución del ejercicio
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/ejercicio/:idEjercicio/evolucion', requireAuth, ProgresoController.getEvolucionEjercicio);

module.exports = router;