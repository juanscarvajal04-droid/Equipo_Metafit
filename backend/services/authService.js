// backend/services/authService.js
// ─── Firma JWT y hashing de contraseñas (bcrypt) ─────────────
//
// Única fuente de verdad de las operaciones criptográficas del sistema:
//   · Firmar y verificar JWTs de sesión y de reseteo de contraseña.
//   · Hashear y comparar contraseñas con bcrypt.
// Los controllers y middlewares importan estas funciones desde aquí (o desde
// su re-export en middlewares/auth.js), de modo que la política de seguridad
// se cambia en un solo lugar.
'use strict';

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  // BUG-009: sin fallback inseguro. Si no hay JWT_SECRET, el servidor no
  // arranca: un secreto hardcodeado permitiría forjar tokens en producción.
  throw new Error(
    '[FATAL] JWT_SECRET no está definido en las variables de entorno. ' +
    'Configura esta variable antes de iniciar el servidor.'
  );
}

// Duración de la sesión: 8h equilibra comodidad del staff (toda la jornada)
// con la ventana de riesgo si el token se filtra. Configurable por entorno.
const EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '8h';
// 12 rondas de bcrypt: balance entre seguridad y performance (~250-400 ms por
// comparación). Suficiente contra ataques por fuerza bruta de GPU sin degradar
// la experiencia de login.
const SALT_ROUNDS = 12;
// Límite del algoritmo bcrypt: solo procesa los primeros 72 bytes de la
// entrada. Consentir más bytes generaría hashes iguales para dos contraseñas
// distintas que compartan el prefijo de 72 bytes — por eso se valida antes.
const MAX_PASSWORD_BYTES = 72;

const AuthService = {
  SECRET,

  /**
   * Firma un JWT de sesión con el payload dado y la expiración configurada
   * (JWT_EXPIRES_IN, por defecto 8 horas). Se usa al autenticar (login) para
   * emitir el accessToken que el cliente enviará en el header Authorization.
   *
   * @param {Object} payload - Claims del token: { sub: id_usuario, email, role }
   * @returns {string} Token JWT firmado (codificado en base64url).
   */
  signJWT: (payload) => {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
  },

  /**
   * Firma un JWT de un solo uso para recuperación de contraseña.
   * Expira en 15 minutos (ISO 25010 - requisitos de seguridad: ventana corta).
   * El claim `tipo: 'password_reset'` permite distinguirlo de un token de
   * sesión en el endpoint POST /auth/reset-password.
   *
   * @param {number} usuarioId - ID del usuario que solicita el reseteo
   * @returns {string} Token JWT con expiración de 15 minutos.
   */
  signResetToken: (usuarioId) => {
    return jwt.sign(
      { sub: usuarioId, tipo: 'password_reset' },
      SECRET,
      { expiresIn: '15m' }
    );
  },

  /**
   * Verifica un token de reseteo de contraseña. Devuelve el payload
   * (sub, tipo, iat, exp) si la firma es válida y no expiró; en caso
   * contrario lanza la excepción estándar de jsonwebtoken, que el controller
   * traduce a HTTP 400.
   *
   * @param {string} token - Token JWT a verificar
   * @returns {Object} Payload decodificado del token
   * @throws {JsonWebTokenError|TokenExpiredError} Si la firma es inválida o
   *         el token ya venció.
   */
  verifyResetToken: (token) => {
    return jwt.verify(token, SECRET);
  },

  /**
   * Hashea una contraseña en texto plano con bcrypt (12 rondas).
   * Rechaza inputs vacíos o que superen el límite seguro de 72 bytes de
   * bcrypt, ya que contraseñas más largas serían truncadas silenciosamente.
   *
   * @param {string} plain - Contraseña en texto plano
   * @returns {Promise<string>} Hash bcrypt de la contraseña
   * @throws {Error} Si la contraseña está vacía o supera 72 bytes.
   */
  hashPassword: async (plain) => {
    if (!plain || Buffer.byteLength(plain, 'utf8') > MAX_PASSWORD_BYTES) {
      throw new Error(`La contraseña no puede superar ${MAX_PASSWORD_BYTES} bytes.`);
    }
    return bcrypt.hash(plain, SALT_ROUNDS);
  },

  /**
   * Compara una contraseña plana con un hash bcrypt almacenado.
   * Rechaza inmediatamente (devuelve false sin comparar) si el input supera
   * 72 bytes o está vacío: bcrypt truncaría y aceptaría prefijos idénticos.
   *
   * @param {string} plain - Contraseña en texto plano ingresada por el usuario
   * @param {string} hash - Hash bcrypt almacenado en USUARIO.contrasena
   * @returns {Promise<boolean>} true si la contraseña coincide, false si no
   *                             o si el input no es válido.
   */
  comparePassword: async (plain, hash) => {
    if (!plain || Buffer.byteLength(plain, 'utf8') > MAX_PASSWORD_BYTES) {
      return false;
    }
    return bcrypt.compare(plain, hash);
  }
};

module.exports = AuthService;
