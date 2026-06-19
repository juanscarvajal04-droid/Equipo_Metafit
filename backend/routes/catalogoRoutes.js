// routes/catalogoRoutes.js
'use strict';

const express             = require('express');
const router              = express.Router();
const CatalogoController  = require('../controllers/catalogoController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Catálogos
 *   description: Ejercicios, alimentos y restricciones médicas disponibles
 */

/**
 * @swagger
 * /660/ejercicios:
 *   get:
 *     summary: Listar todos los ejercicios
 *     description: Devuelve el catálogo de ejercicios con sus restricciones médicas excluyentes.
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ejercicios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_ejercicio:            { type: integer }
 *                   nombre_ejercicio:        { type: string }
 *                   grupo_muscular:          { type: string, enum: [Piernas, Pecho, Espalda, Hombros, Biceps, Triceps, Core, Gluteos] }
 *                   nivel_minimo:            { type: string, enum: [Principiante, Intermedio, Avanzado] }
 *                   descripcion:             { type: string, nullable: true }
 *                   restricciones_excluidas: { type: array, items: { $ref: '#/components/schemas/Restriccion' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/ejercicios', requireAuth, CatalogoController.getAllEjercicios);

/**
 * @swagger
 * /660/ejercicios:
 *   post:
 *     summary: Crear ejercicio en el catálogo (solo Administrador)
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_ejercicio, grupo_muscular, nivel_minimo]
 *             properties:
 *               nombre_ejercicio: { type: string,  example: Sentadilla Búlgara }
 *               grupo_muscular:   { type: string,  enum: [Piernas, Pecho, Espalda, Hombros, Biceps, Triceps, Core, Gluteos] }
 *               nivel_minimo:     { type: string,  enum: [Principiante, Intermedio, Avanzado] }
 *               descripcion:      { type: string,  nullable: true }
 *     responses:
 *       201:
 *         description: Ejercicio creado
 *       400:
 *         description: Nombre duplicado o campos faltantes
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
router.post('/ejercicios', requireAuth, requireAdmin, CatalogoController.createEjercicio);

/**
 * @swagger
 * /660/alimentos:
 *   get:
 *     summary: Listar todos los alimentos
 *     description: >
 *       Devuelve el catálogo de alimentos con macros y **calorías calculadas por la VIEW `v_alimento_calorias`**
 *       usando la fórmula Atwater: `(proteínas×4) + (carbohidratos×4) + (grasas×9)`.
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alimentos con calorías calculadas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_alimento:      { type: integer }
 *                   nombre_alimento:  { type: string }
 *                   proteinas:        { type: number, example: 25.5 }
 *                   carbohidratos:    { type: number, example: 40.0 }
 *                   grasas:           { type: number, example: 5.0 }
 *                   calorias_por_100g:{ type: number, example: 307.0, description: Calculado con Atwater }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/alimentos', requireAuth, CatalogoController.getAllAlimentos);

/**
 * @swagger
 * /660/alimentos:
 *   post:
 *     summary: Crear alimento en el catálogo (solo Administrador)
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_alimento, proteinas, carbohidratos, grasas]
 *             properties:
 *               nombre_alimento: { type: string,  example: Pechuga de pollo }
 *               proteinas:       { type: number,  example: 31.0 }
 *               carbohidratos:   { type: number,  example: 0.0 }
 *               grasas:          { type: number,  example: 3.6 }
 *     responses:
 *       201:
 *         description: Alimento creado
 *       400:
 *         description: Nombre duplicado o macros faltantes
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
router.post('/alimentos', requireAuth, requireAdmin, CatalogoController.createAlimento);

/**
 * @swagger
 * /660/restricciones:
 *   get:
 *     summary: Listar todas las restricciones médicas del catálogo
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de restricciones médicas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restriccion'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/restricciones', requireAuth, CatalogoController.getAllRestricciones);

module.exports = router;