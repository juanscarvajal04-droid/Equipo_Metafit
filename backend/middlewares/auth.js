// backend/middlewares/auth.js
// ─── JWT + Control de Acceso por Roles ───────────────────────
'use strict';

const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');

const SECRET      = process.env.JWT_SECRET || 'metafit_secret_key_2025_sport_gym';
const EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '8h';
const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────
// UTILIDADES EXPORTADAS
// ─────────────────────────────────────────────────────────────

/** Firma un JWT con el payload dado */
const signJWT = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

/** Hashea una contraseña en texto plano con bcrypt */
const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

/** Compara una contraseña plana con un hash bcrypt */
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: requireAuth
// Verifica que el request lleve un Bearer token válido.
// Adjunta req.user = { sub, email, role, iat, exp }
// ─────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expirado'
      : 'Token inválido';
    return res.status(401).json({ error: msg });
  }
};

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: requireAdmin
// Solo pasa si req.user.role === 'Administrador'.
// Debe ejecutarse DESPUÉS de requireAuth.
// ─────────────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({
      error: 'Acceso denegado: se requiere rol Administrador',
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: requireAdminOrEntrenador
// Pasa si role es 'Administrador' o 'Entrenador'.
// ─────────────────────────────────────────────────────────────
const requireAdminOrEntrenador = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const allowed = ['Administrador', 'Entrenador'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Acceso denegado: se requiere rol Administrador o Entrenador',
    });
  }
  next();
};

module.exports = {
  signJWT,
  hashPassword,
  comparePassword,
  requireAuth,
  requireAdmin,
  requireAdminOrEntrenador,
};
