// backend/middlewares/auth.js
// ─── JWT + Control de Acceso por Roles ───────────────────────
// Refactorizado: BUG-004 (límite 72 bytes bcrypt), BUG-009 (JWT_SECRET sin fallback inseguro)
'use strict';

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ─── BUG-009 CORREGIDO ────────────────────────────────────────
// Se elimina el fallback hardcodeado. Si JWT_SECRET no está en el entorno,
// el servidor lanza un error FATAL al arrancar — nunca silencioso en producción.
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error(
    '[FATAL] JWT_SECRET no está definido en las variables de entorno. ' +
    'Configura esta variable antes de iniciar el servidor.'
  );
}

const EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '8h';
const SALT_ROUNDS = 12;

// ─── BUG-004 CORREGIDO ────────────────────────────────────────
// bcryptjs trunca SILENCIOSAMENTE contraseñas > 72 bytes.
// Validamos el límite ANTES de llamar a bcrypt para evitar colisiones.
const MAX_PASSWORD_BYTES = 72;

// ─────────────────────────────────────────────────────────────
// UTILIDADES EXPORTADAS
// ─────────────────────────────────────────────────────────────

/** Firma un JWT con el payload dado */
const signJWT = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

/**
 * Hashea una contraseña en texto plano con bcrypt.
 * Lanza error si supera el límite seguro de 72 bytes.
 */
const hashPassword = (plain) => {
  if (!plain || Buffer.byteLength(plain, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new Error(`La contraseña no puede superar ${MAX_PASSWORD_BYTES} bytes.`);
  }
  return bcrypt.hash(plain, SALT_ROUNDS);
};

/**
 * Compara una contraseña plana con un hash bcrypt.
 * Rechaza inmediatamente si el input supera 72 bytes (colisión silenciosa de bcrypt).
 */
const comparePassword = (plain, hash) => {
  if (!plain || Buffer.byteLength(plain, 'utf8') > MAX_PASSWORD_BYTES) {
    // Retorna false directamente — nunca llamar a bcrypt con input inválido
    return Promise.resolve(false);
  }
  return bcrypt.compare(plain, hash);
};

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
