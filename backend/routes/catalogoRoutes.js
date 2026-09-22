// routes/catalogoRoutes.js
'use strict';

const express             = require('express');
const router              = express.Router();
const CatalogoController  = require('../controllers/catalogoController');
const { requireAuth, requireAdmin, requireAdminOrEntrenador, requireStaff } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Catálogos
 *   description: Ejercicios, alimentos y restricciones médicas disponibles
 */

/**
 * @swagger
 * /catalogo/ejercicios:
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
 *                   descripcion:
 *                     type: string
 *                     nullable: true
 *                   restricciones_excluidas: { type: array, items: { $ref: '#/components/schemas/Restriccion' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/ejercicios', requireAuth, CatalogoController.getAllEjercicios);

/**
 * @swagger
 * /catalogo/ejercicios:
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
 *               descripcion:
 *                 type: string
 *                 nullable: true
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
router.post('/ejercicios', requireAuth, requireAdminOrEntrenador, CatalogoController.createEjercicio);

/** @swagger
 * /catalogo/ejercicios/{id}:
 *   put:
 *     summary: Actualizar ejercicio del catálogo (Admin o Entrenador)
 *     description: Reemplaza los datos del ejercicio indicado. El nombre debe ser único.
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ejercicio'
 *     responses:
 *       200:
 *         description: Ejercicio actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Ejercicio actualizado' }
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/ejercicios/:id', requireAuth, requireAdminOrEntrenador, CatalogoController.updateEjercicio);

/** @swagger
 * /catalogo/ejercicios/{id}:
 *   delete:
 *     summary: Eliminar ejercicio del catálogo (Admin o Entrenador)
 *     description: Fallará con 409 si el ejercicio está en uso en rutinas activas.
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Ejercicio eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Ejercicio eliminado' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Ejercicio en uso en rutinas activas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/ejercicios/:id', requireAuth, requireAdminOrEntrenador, CatalogoController.deleteEjercicio);

/**
 * @swagger
 * /catalogo/alimentos:
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
 *                   calorias_por_100g:
 *                     type: number
 *                     example: 307.0
 *                     description: 'Calculado con Atwater'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/alimentos', requireAuth, CatalogoController.getAllAlimentos);

/**
 * @swagger
 * /catalogo/alimentos:
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
router.post('/alimentos', requireAuth, requireAdminOrEntrenador, CatalogoController.createAlimento);

/** @swagger
 * /catalogo/alimentos/{id}:
 *   put:
 *     summary: Actualizar alimento del catálogo (Admin o Entrenador)
 *     description: Reemplaza los datos del alimento indicado (nombre y macros). El nombre debe ser único.
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Alimento'
 *     responses:
 *       200:
 *         description: Alimento actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Alimento actualizado' }
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/alimentos/:id', requireAuth, requireAdminOrEntrenador, CatalogoController.updateAlimento);

/** @swagger
 * /catalogo/alimentos/{id}:
 *   delete:
 *     summary: Eliminar alimento del catálogo (Admin o Entrenador)
 *     description: Fallará con 409 si el alimento está en uso en planes nutricionales activos.
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Alimento eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: 'Alimento eliminado' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Alimento en uso en planes nutricionales
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/alimentos/:id', requireAuth, requireAdminOrEntrenador, CatalogoController.deleteAlimento);

/**
 * @swagger
 * /catalogo/restricciones:
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

/**
 * @swagger
 * /catalogo/restricciones:
 *   post:
 *     summary: Crear restricción médica en el catálogo (staff: Admin, Recepcionista o Entrenador)
 *     description: Disponible para todo el staff. Solo el Administrador puede eliminar.
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_restriccion, tipo]
 *             properties:
 *               nombre_restriccion: { type: string,  example: Asma }
 *               tipo:               { type: string,  enum: [Enfermedad, Lesion, Alergia, Medicamento, Otra] }
 *               efecto_relevante:
 *                 type: string
 *                 nullable: true
 *                 example: Evitar esfuerzos de alta intensidad
 *     responses:
 *       201:
 *         description: Restricción creada
 *       400:
 *         description: Nombre duplicado o campos inválidos
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
router.post('/restricciones', requireAuth, requireStaff, CatalogoController.createRestriccion);

/**
 * @swagger
 * /catalogo/restricciones/{id}:
 *   put:
 *     summary: Actualizar restricción del catálogo (staff: Admin, Recepcionista o Entrenador)
 *     description: Disponible para todo el staff. Solo el Administrador puede eliminar.
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre_restriccion, tipo]
 *             properties:
 *               nombre_restriccion: { type: string }
 *               tipo:               { type: string, enum: [Enfermedad, Lesion, Alergia, Medicamento, Otra] }
 *               efecto_relevante:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Restricción actualizada
 *       400:
 *         description: Nombre duplicado o campos inválidos
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
router.put('/restricciones/:id', requireAuth, requireStaff, CatalogoController.updateRestriccion);

/**
 * @swagger
 * /catalogo/restricciones/{id}:
 *   delete:
 *     summary: Eliminar restricción del catálogo (solo Administrador)
 *     description: >
 *       Fallará con 409 si la restricción está referenciada por afiliados,
 *       ejercicios o alimentos (integridad referencial).
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Restricción eliminada
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Restricción en uso
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/restricciones/:id', requireAuth, requireAdmin, CatalogoController.deleteRestriccion);

module.exports = router;