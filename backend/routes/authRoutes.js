// routes/authRoutes.js
'use strict';

const express        = require('express');
const router         = express.Router();
const AuthController = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Login de usuarios del sistema MetaFit
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión
 *     description: >
 *       Autentica al usuario con correo y contraseña (bcrypt).
 *       Devuelve un **JWT de 8 horas** de validez.
 *       Úsalo en el botón **Authorize** de esta documentación.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso — devuelve token y datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Correo o contraseña faltantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Correo y contraseña requeridos
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Correo o contraseña incorrectos
 *       403:
 *         description: Cuenta inactiva o pendiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Tu cuenta está en estado: Inactivo. Contacta al administrador."
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/login', AuthController.login);

module.exports = router;