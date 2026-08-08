// backend/controllers/authController.js
// ─── Login con bcrypt + JWT firmado ──────────────────────────
// Refactorizado: BUG-001 (validación formato email RFC 5322),
//               BUG-002 (verificar estado ANTES de bcrypt),
//               BUG-004 (password > 72 bytes rechazado antes de bcrypt),
//               BUG-010 (cero fugas de err.message al cliente)
'use strict';

const UsuarioModel          = require('../models/usuarioModel');
const PasswordResetModel    = require('../models/passwordResetModel');
const AuthService           = require('../services/authService');
const { signJWT, comparePassword } = require('../middlewares/auth');

// ─── BUG-001: Regex de validación de email (RFC 5322 básico) ──
// Rechaza strings sin @ o sin dominio antes de tocar la DB.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── BUG-004: Límite bcrypt (72 bytes) ────────────────────────
const MAX_PASSWORD_BYTES = 72;

const AuthController = {

  login: async (req, res) => {
    const { email, password } = req.body;

    // ── Validación de presencia ──────────────────────────────
    if (!email || !password)
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });

    // ── BUG-001: Validación de formato ───────────────────────
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))
      return res.status(400).json({ error: 'Formato de correo inválido' });

    // ── BUG-004: Contraseña dentro del límite bcrypt ─────────
    if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES)
      return res.status(400).json({ error: `La contraseña no puede superar ${MAX_PASSWORD_BYTES} caracteres` });

    try {
      // Busca por correo (sin comparar contraseña aún)
      const user = await UsuarioModel.findByEmail(email.trim().toLowerCase());
      if (!user)
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

      // ── BUG-002: Verificar estado ANTES de bcrypt ────────────
      // Si se verifica después, un atacante puede determinar si una
      // cuenta inactiva tiene contraseña válida comparando 403 vs 401.
      if (user.estado !== 'Activo')
        return res.status(403).json({
          error: 'Cuenta no activa. Contacta al administrador.',
        });

      // Compara con bcrypt solo si la cuenta está Activa
      const match = await comparePassword(password, user.contrasena);
      if (!match)
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

      const token = signJWT({
        sub  : user.id_usuario,
        email: user.correo,
        role : user.rol,
      });

      return res.json({
        accessToken: token,
        user: {
          id       : user.id_usuario,
          email    : user.correo,
          role     : user.rol,
          nombres  : user.nombres,
          apellidos: user.apellidos,
        },
      });
    } catch (err) {
      // ── BUG-010: Solo el servidor ve el error real ───────────
      console.error('[authController.login]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // POST /auth/recuperar-password — solicitar reseteo
  // Genera un JWT de un solo uso (15 min) y lo guarda en PASSWORD_RESET.
  // Si no hay servicio de correo configurado, devuelve el token en la
  // respuesta (modo prueba) para que el administrador lo use manualmente.
  // Siempre responde 200 para no revelar si el correo existe.
  // ─────────────────────────────────────────────────────────────
  recuperarPassword: async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Correo inválido' });
    }

    try {
      const user = await UsuarioModel.findByEmail(email.trim().toLowerCase());

      // Respuesta genérica siempre (evita enumeración de usuarios)
      if (!user) {
        return res.json({
          mensaje: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
        });
      }

      // Invalida tokens anteriores del usuario (un solo token vigente)
      await PasswordResetModel.invalidarAnteriores(user.id_usuario);

      const token = AuthService.signResetToken(user.id_usuario);
      const expiracion = new Date(Date.now() + 15 * 60 * 1000);

      await PasswordResetModel.create({
        usuario_id: user.id_usuario,
        token,
        expiracion,
      });

      // ── Envío de correo (opcional, si hay SMTP/API Brevo configurado) ──
      // Prioridad: 1) API REST Brevo (vía HTTPS, funciona desde Render),
      //            2) SMTP clásico (nodemailer) si se usa otro host directo.
      let correoEnviado = false;
      const enlaceReset = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/reset-password/${token}`;
      const subject = 'Recuperación de contraseña — MetaFit';
      try {
        if (process.env.BREVO_API_KEY) {
          const resApi = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': process.env.BREVO_API_KEY,
              'accept': 'application/json',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              sender: { email: process.env.SMTP_FROM || 'metafit.sistema@gmail.com', name: 'MetaFit' },
              to: [{ email: user.correo }],
              subject,
              textContent: `Usá este enlace para restablecer tu contraseña (válido por 15 minutos):\n\n${enlaceReset}`,
            }),
          });
          const bodyApi = await resApi.json().catch(() => ({}));
          if (resApi.ok) {
            correoEnviado = true;
          } else {
            console.error('[authController.recuperarPassword] Brevo API:', resApi.status, JSON.stringify(bodyApi));
          }
        } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
          });
          await transporter.sendMail({
            from: `"MetaFit" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: user.correo,
            subject,
            text: `Usá este enlace para restablecer tu contraseña (válido por 15 minutos):\n\n${enlaceReset}`,
          });
          correoEnviado = true;
        }
      } catch (errMail) {
        console.error('[authController.recuperarPassword] error envío:', errMail.message);
      }

      return res.json({
        mensaje: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
        ...(correoEnviado ? {} : { modoPrueba: true, token }), // ⚠️ solo sin SMTP (pruebas)
      });
    } catch (err) {
      console.error('[authController.recuperarPassword]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // POST /auth/reset-password — aplicar nueva contraseña
  // Verifica: JWT válido, no expirado, token no usado, no expirado en BD.
  // Hashea la nueva contraseña (bcrypt 12) y marca el token como usado.
  // Usa transacción: si falla el UPDATE de la contraseña, no se marca usado.
  // ─────────────────────────────────────────────────────────────
  resetPassword: async (req, res) => {
    const { token, nuevaPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token requerido' });
    }
    if (!nuevaPassword || typeof nuevaPassword !== 'string') {
      return res.status(400).json({ error: 'Nueva contraseña requerida' });
    }
    if (Buffer.byteLength(nuevaPassword, 'utf8') > MAX_PASSWORD_BYTES) {
      return res.status(400).json({ error: `La contraseña no puede superar ${MAX_PASSWORD_BYTES} caracteres` });
    }

    let payload;
    try {
      payload = AuthService.verifyResetToken(token);
      if (payload.tipo !== 'password_reset') {
        return res.status(400).json({ error: 'Token inválido' });
      }
    } catch {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const pool = require('../config/db');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Token vigente en BD (no usado y no expirado)
      const registro = await PasswordResetModel.findVigente(token);
      if (!registro || registro.usuario_id !== payload.sub) {
        await conn.rollback();
        return res.status(400).json({ error: 'Token inválido o ya utilizado' });
      }

      // Hashea con bcrypt y actualiza la contraseña
      const hash = await AuthService.hashPassword(nuevaPassword);
      await conn.query('UPDATE USUARIO SET contrasena = ? WHERE id_usuario = ?', [hash, registro.usuario_id]);

      // Marca el token como usado (un solo uso)
      await PasswordResetModel.marcarUsado(registro.id);

      await conn.commit();
      return res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (err) {
      await conn.rollback();
      console.error('[authController.resetPassword]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      conn.release();
    }
  },
};

module.exports = AuthController;