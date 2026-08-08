// routes/authRoutes.js
'use strict';

const express        = require('express');
const router         = express.Router();
const rateLimit      = require('express-rate-limit');
const AuthController = require('../controllers/authController');

// ── Rate limit para recuperación de contraseña (anti-spam de correos) ─
const recuperarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de recuperación. Intenta en 15 minutos.' },
  skipSuccessfulRequests: false,
});

/** @swagger
 * tags:
 *   name: Autenticación
 *   description: Login y recuperación de contraseña de usuarios MetaFit
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

/** @swagger
 * /auth/recuperar-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     description: >
 *       Genera un JWT de un solo uso (15 min) y lo guarda en PASSWORD_RESET.
 *       Sin SMTP configurado devuelve el token en `modoPrueba`.
 *       Siempre responde 200 para no revelar si el correo existe.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: carlos@metafit.com
 *     responses:
 *       200:
 *         description: Solicitud procesada (respuesta genérica)
 *       400:
 *         description: Correo inválido
 */
router.post('/auth/recuperar-password', recuperarLimiter, AuthController.recuperarPassword);

/** @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Aplicar nueva contraseña con token de un solo uso
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               nuevaPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Token inválido, expirado o ya usado
 */
router.post('/auth/reset-password', AuthController.resetPassword);

module.exports = router;