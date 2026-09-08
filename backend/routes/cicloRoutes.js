// routes/cicloRoutes.js — Parte 1: CRUD completo de ciclos.
// Montado en /ciclos desde server.js. PATCH/DELETE /ciclos/:id_ciclo.
'use strict';

const express         = require('express');
const router          = express.Router();
const CicloController = require('../controllers/cicloController');
const { requireAuth, requireAdmin, requireAdminOrEntrenador } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Ciclos
 *   description: Gestión de ciclos de entrenamiento (PATCH/DELETE)
 */

/**
 * @swagger
 * /ciclos/{id_ciclo}:
 *   patch:
 *     summary: Actualizar un ciclo (Admin o Entrenador)
 *     description: >
 *       Actualiza SOLO los campos enviados: fechas, objetivo_fisico,
 *       nivel_experiencia, disponibilidad_dias, observaciones y activo.
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_ciclo
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *               objetivo_fisico:
 *                 type: string
 *                 enum: [Perdida de grasa, Aumento de masa, Mantenimiento, Rehabilitacion]
 *               nivel_experiencia:
 *                 type: string
 *                 enum: [Principiante, Intermedio, Avanzado]
 *               disponibilidad_dias:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7
 *               observaciones:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Ciclo actualizado correctamente
 *       400:
 *         description: Datos inválidos (fechas, disponibilidad o ENUM)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/:id_ciclo', requireAuth, requireAdminOrEntrenador, CicloController.updateCiclo);

/**
 * @swagger
 * /ciclos/{id_ciclo}:
 *   delete:
 *     summary: Eliminar un ciclo (solo Administrador)
 *     description: >
 *       Borra el ciclo con cascada EXPLÍCITA: registro de ejercicios, consumo real,
 *       seguimiento diario, rutina_ejercicio, rutinas, detalle nutricional, planes,
 *       progreso físico y notas de ejercicios, antes del CICLO (las FKs reales
 *       usan ON DELETE RESTRICT).
 *     tags: [Ciclos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id_ciclo
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ciclo eliminado correctamente
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id_ciclo', requireAuth, requireAdmin, CicloController.deleteCiclo);

module.exports = router;