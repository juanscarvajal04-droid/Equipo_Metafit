// routes/planRoutes.js
'use strict';

const express         = require('express');
const router          = express.Router();
const PlanController  = require('../controllers/planController');
const { requireAuth, requireAdminOrEntrenador, requireOwnCiclo } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Planes
 *   description: Planes de entrenamiento y nutricionales por ciclo
 */

// ─────────────────────────────────────────────────────────────
// PLANES DE ENTRENAMIENTO
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /planes/entrenamiento/{id_ciclo}:
 *   get:
 *     summary: Obtener plan de entrenamiento de un ciclo
 *     description: Devuelve el plan con sus rutinas y ejercicios usando JSON_ARRAYAGG (sin N+1).
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_ciclo
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *         description: ID del ciclo
 *     responses:
 *       200:
 *         description: Plan de entrenamiento con rutinas y ejercicios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_ciclo:     { type: integer }
 *                 observaciones:
 *                   type: string
 *                   nullable: true
 *                 rutinas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_rutina:      { type: integer }
 *                       nombre_rutina:  { type: string }
 *                       enfoque_muscular: { type: string }
 *                       dia_numero:     { type: integer, minimum: 1, maximum: 7 }
 *                       ejercicios:     { type: array }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Plan de entrenamiento no encontrado para este ciclo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/entrenamiento/:id_ciclo', requireAuth, requireOwnCiclo, PlanController.getEntrenamiento);

/**
 * @swagger
 * /planes/entrenamiento:
 *   post:
 *     summary: Crear plan de entrenamiento para un ciclo (Admin o Entrenador)
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ciclo]
 *             properties:
 *               id_ciclo:     { type: integer, example: 1 }
 *               observaciones:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Plan de entrenamiento creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_ciclo: { type: integer }
 *                 message:  { type: string }
 *       400:
 *         description: id_ciclo faltante o plan ya existente para ese ciclo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/entrenamiento', requireAuth, requireAdminOrEntrenador, PlanController.createEntrenamiento);

/**
 * @swagger
 * /planes/entrenamiento/{id}:
 *   patch:
 *     summary: Actualizar observaciones del plan de entrenamiento (Admin o Entrenador)
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observaciones: { type: string }
 *     responses:
 *       200:
 *         description: Plan actualizado correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/entrenamiento/:id', requireAuth, requireAdminOrEntrenador, PlanController.updateEntrenamiento);

// ─────────────────────────────────────────────────────────────
// RUTINAS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /planes/rutinas:
 *   post:
 *     summary: Crear rutina en un plan de entrenamiento (Admin o Entrenador)
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ciclo, nombre_rutina, dia_numero]
 *             properties:
 *               id_ciclo:          { type: integer, example: 1 }
 *               nombre_rutina:     { type: string,  example: Día de Piernas }
 *               enfoque_muscular:  { type: string,  enum: [Piernas, Pecho, Espalda, Hombros, Biceps, Triceps, Core, Gluteos, Full Body, Empuje, Jale] }
 *               dia_numero:        { type: integer, minimum: 1, maximum: 7, example: 1, description: '1=Lunes … 7=Domingo' }
 *     responses:
 *       201:
 *         description: Rutina creada correctamente
 *       400:
 *         description: Datos faltantes o día duplicado en el ciclo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/rutinas', requireAuth, requireAdminOrEntrenador, PlanController.createRutina);

/**
 * @swagger
 * /planes/rutinas/{id_rutina}/ejercicios:
 *   post:
 *     summary: Añadir ejercicio a una rutina (Admin o Entrenador)
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_rutina
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ejercicio, series, repeticiones, orden]
 *             properties:
 *               id_ejercicio: { type: integer, example: 5 }
 *               series:       { type: integer, example: 4 }
 *               repeticiones: { type: integer, example: 12 }
 *               orden:        { type: integer, example: 1, description: Posición dentro de la rutina }
 *     responses:
 *       201:
 *         description: Ejercicio añadido a la rutina
 *       400:
 *         description: Ejercicio/orden duplicado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/rutinas/:id_rutina/ejercicios', requireAuth, requireAdminOrEntrenador, PlanController.addEjercicio);

/**
 * @swagger
 * /planes/rutinas/{id_rutina}/ejercicios/{id_ejercicio}:
 *   delete:
 *     summary: Quitar ejercicio de una rutina (Admin o Entrenador)
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_rutina
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: id_ejercicio
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ejercicio eliminado de la rutina
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/rutinas/:id_rutina/ejercicios/:id_ejercicio', requireAuth, requireAdminOrEntrenador, PlanController.removeEjercicio);

/**
 * @swagger
 * /planes/rutinas/{id_rutina}:
 *   delete:
 *     summary: Eliminar rutina y sus ejercicios asociados (Admin o Entrenador)
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_rutina
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Rutina eliminada correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/rutinas/:id_rutina', requireAuth, requireAdminOrEntrenador, PlanController.deleteRutina);

// ─────────────────────────────────────────────────────────────
// PLANES NUTRICIONALES
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /planes/nutricional/{id_ciclo}:
 *   get:
 *     summary: Obtener plan nutricional de un ciclo
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_ciclo
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Plan nutricional con detalle de alimentos por comida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_ciclo:          { type: integer }
 *                 calorias_objetivo: { type: number,  example: 2200.0 }
 *                 num_comidas:       { type: integer, example: 5 }
 *                 detalle:           { type: array }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Plan nutricional no encontrado para este ciclo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/nutricional/:id_ciclo', requireAuth, requireOwnCiclo, PlanController.getNutricional);

/**
 * @swagger
 * /planes/nutricional:
 *   post:
 *     summary: Crear plan nutricional para un ciclo (Admin o Entrenador)
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_ciclo, calorias_objetivo, num_comidas]
 *             properties:
 *               id_ciclo:          { type: integer, example: 1 }
 *               calorias_objetivo: { type: number,  example: 2200.0, description: 'Rango: 500–10000 kcal' }
 *               num_comidas:       { type: integer, example: 5, description: 'Rango: 1–10 comidas/día' }
 *               observaciones:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Plan nutricional creado
 *       400:
 *         description: Datos faltantes o plan ya existente para ese ciclo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/nutricional', requireAuth, requireAdminOrEntrenador, PlanController.createNutricional);

/**
 * @swagger
 * /planes/nutricional/{id_plan}/detalle:
 *   post:
 *     summary: Agregar alimento a una comida del plan nutricional (Admin o Entrenador)
 *     tags: [Planes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_plan
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *         description: id_ciclo del plan nutricional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_alimento, num_comida, cantidad_g]
 *             properties:
 *               id_alimento: { type: integer, example: 3 }
 *               num_comida:  { type: integer, example: 2, description: Número de comida del día (1–10) }
 *               cantidad_g:  { type: number,  example: 200.0, description: Cantidad en gramos }
 *     responses:
 *       201:
 *         description: Alimento añadido al plan nutricional
 *       400:
 *         description: Alimento ya existe en esa comida del plan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/nutricional/:id', requireAuth, requireAdminOrEntrenador, PlanController.updateNutricional);

router.post('/nutricional/:id_plan/detalle', requireAuth, requireAdminOrEntrenador, PlanController.addAlimento);

module.exports = router;