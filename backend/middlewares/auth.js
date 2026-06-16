// backend/middlewares/auth.js
// ─── JWT + Control de Acceso por Roles ───────────────────────
// Refactorizado: BUG-004 (límite 72 bytes bcrypt), BUG-009 (JWT_SECRET sin fallback inseguro)
'use strict';

const AuthService = require('../services/authService');
const SECRET = AuthService.SECRET;

const signJWT = (payload) => AuthService.signJWT(payload);
const hashPassword = (plain) => AuthService.hashPassword(plain);
const comparePassword = (plain, hash) => AuthService.comparePassword(plain, hash);

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: requireAuth
// Verifica que el request lleve un Bearer token válido.
// Adjunta req.user = { sub, email, role, iat, exp }
// ─────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

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
