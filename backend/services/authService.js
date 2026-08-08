// backend/services/authService.js
'use strict';

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error(
    '[FATAL] JWT_SECRET no está definido en las variables de entorno. ' +
    'Configura esta variable antes de iniciar el servidor.'
  );
}

const EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '8h';
const SALT_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;

const AuthService = {
  SECRET,

  /** Firma un JWT con el payload dado */
  signJWT: (payload) => {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
  },

  /**
   * Firma un JWT de un solo uso para recuperación de contraseña.
   * Expira en 15 minutos (ISO 25010 - requisitos de seguridad: ventana corta).
   */
  signResetToken: (usuarioId) => {
    return jwt.sign(
      { sub: usuarioId, tipo: 'password_reset' },
      SECRET,
      { expiresIn: '15m' }
    );
  },

  /** Verifica un token de reseteo. Devuelve el payload o lanza error JWT. */
  verifyResetToken: (token) => {
    return jwt.verify(token, SECRET);
  },

  /**
   * Hashea una contraseña en texto plano con bcrypt.
   * Lanza error si supera el límite seguro de 72 bytes.
   */
  hashPassword: async (plain) => {
    if (!plain || Buffer.byteLength(plain, 'utf8') > MAX_PASSWORD_BYTES) {
      throw new Error(`La contraseña no puede superar ${MAX_PASSWORD_BYTES} bytes.`);
    }
    return bcrypt.hash(plain, SALT_ROUNDS);
  },

  /**
   * Compara una contraseña plana con un hash bcrypt.
   * Rechaza inmediatamente si el input supera 72 bytes.
   */
  comparePassword: async (plain, hash) => {
    if (!plain || Buffer.byteLength(plain, 'utf8') > MAX_PASSWORD_BYTES) {
      return false;
    }
    return bcrypt.compare(plain, hash);
  }
};

module.exports = AuthService;
