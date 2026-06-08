// routes/usuarioRoutes.js
'use strict';

const express            = require('express');
const router             = express.Router();
const UsuarioController  = require('../controllers/usuarioController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Usuarios (Personal)
 *   description: Gestión del personal del gimnasio (Admins, Recepcionistas, Entrenadores)
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar todo el personal
 *     tags: [Usuarios (Personal)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios del sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', requireAuth, UsuarioController.getAll);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios (Personal)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', requireAuth, UsuarioController.getById);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear nuevo empleado (solo Administrador)
 *     description: La contraseña se almacena hasheada con bcrypt (12 rondas).
 *     tags: [Usuarios (Personal)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreate'
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:      { type: integer }
 *                 message: { type: string }
 *       400:
 *         description: Campos faltantes o correo duplicado
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
router.post('/', requireAdmin, UsuarioController.create);

/**
 * @swagger
 * /usuarios/{id}:
 *   patch:
 *     summary: Actualizar empleado (solo Administrador)
 *     description: >
 *       Actualización parcial. Si se envía `contrasena`, se re-hashea con bcrypt.
 *       Un administrador no puede desactivar su propia cuenta.
 *     tags: [Usuarios (Personal)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreate'
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       400:
 *         description: Correo duplicado o intento de auto-desactivación
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
router.patch('/:id', requireAdmin, UsuarioController.update);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar empleado (solo Administrador)
 *     description: Un administrador no puede eliminarse a sí mismo. Si tiene registros asociados, MySQL lo bloquea.
 *     tags: [Usuarios (Personal)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *       400:
 *         description: Auto-eliminación o FK constraint activo
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
router.delete('/:id', requireAdmin, UsuarioController.delete);

module.exports = router;