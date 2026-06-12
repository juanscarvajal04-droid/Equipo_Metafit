// backend/controllers/authController.js
// ─── Login con bcrypt + JWT firmado ──────────────────────────
// Refactorizado: BUG-001 (validación formato email RFC 5322),
//               BUG-002 (verificar estado ANTES de bcrypt),
//               BUG-004 (password > 72 bytes rechazado antes de bcrypt),
//               BUG-010 (cero fugas de err.message al cliente)
'use strict';

const UsuarioModel               = require('../models/usuarioModel');
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
};

module.exports = AuthController;