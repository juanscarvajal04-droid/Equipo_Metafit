// backend/middlewares/auth.js
// ─── JWT + Control de Acceso por Roles ───────────────────────
//
// CAPA DE SEGURIDAD de la API: verifica que cada request autenticado
// presente un Bearer token JWT válido (firmado por AuthService.SECRET) y
// restringe el acceso a cada endpoint según el rol del usuario.
//
// Los middlewares se encadenan en las rutas: requireAuth primero (verifica y
// adjunta req.user), luego el de rol (requireAdmin, requireStaff, …).
//
// Refactorizado: BUG-004 (límite 72 bytes bcrypt), BUG-009 (JWT_SECRET sin fallback inseguro)
'use strict';

const jwt = require('jsonwebtoken'); // FIX 1: jwt era undefined → todos los requireAuth fallaban con 401
const AuthService = require('../services/authService');
// SECRET se toma del servicio y NO se vuelve a leer de process.env: garantiza
// una única fuente de verdad y que el valor ya fue validado al cargar authService.
const SECRET = AuthService.SECRET;

// Re-export de helpers de firma/hashing para que los controllers no tengan
// que importar authService directamente (capa única de utilidades de auth).
const signJWT = (payload) => AuthService.signJWT(payload);
const hashPassword = (plain) => AuthService.hashPassword(plain);
const comparePassword = (plain, hash) => AuthService.comparePassword(plain, hash);

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: requireAuth
// Verifica que el request lleve un Bearer token válido.
// Adjunta req.user = { sub, email, role, iat, exp }
// ─────────────────────────────────────────────────────────────
/**
 * Middleware de autenticación. Extrae el token del header Authorization
 * (formato "Bearer <token>"), lo verifica con la firma JWT y adjunta el
 * payload decodificado en `req.user` para los middlewares y controllers
 * posteriores.
 *
 * @param {Object} req - Request HTTP de Express
 * @param {Object} res - Response HTTP de Express
 * @param {Function} next - Callback para continuar con el siguiente middleware
 * @returns {void} Continúa la cadena si el token es válido; responde 401 en
 *                 caso contrario (token ausente, inválido o expirado).
 */
const requireAuth = (req, res, next) => {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    // verify lanza JsonWebTokenError si la firma no coincide y
    // TokenExpiredError si pasó el tiempo de vida (JWT_EXPIRES_IN).
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
/**
 * Middleware de autorización por rol. Permite el paso SOLO a usuarios con rol
 * 'Administrador'. Debe encadenarse después de requireAuth (necesita req.user).
 *
 * @param {Object} req - Request HTTP de Express (con req.user ya cargado)
 * @param {Object} res - Response HTTP de Express
 * @param {Function} next - Callback para continuar con el siguiente middleware
 * @returns {void} Continúa la cadena si es Administrador; 401 si no hay
 *                 sesión o 403 si el rol no tiene permiso.
 */
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
/**
 * Middleware de autorización por rol para equipos técnicos deportivos.
 * Permite el paso a 'Administrador' y 'Entrenador' (quienes diseñan ciclos,
 * planes de entrenamiento y registran progreso físico).
 *
 * @param {Object} req - Request HTTP de Express (con req.user ya cargado)
 * @param {Object} res - Response HTTP de Express
 * @param {Function} next - Callback para continuar con el siguiente middleware
 * @returns {void} Continúa la cadena si el rol está permitido; 401 o 403 si no.
 */
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

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: requireAdminOrRecepcionista
// Pasa si role es 'Administrador' o 'Recepcionista'.
// FIX 5: Necesario para el endpoint POST /afiliados/:id/pagos.
// ─────────────────────────────────────────────────────────────
/**
 * Middleware de autorización por rol para tareas de mostrador.
 * Permite el paso a 'Administrador' y 'Recepcionista'. La recepcionista usa
 * este permiso para registrar afiliados en mostrador y para recibir pagos
 * (FIX 5: POST /afiliados/:id/pagos).
 *
 * @param {Object} req - Request HTTP de Express (con req.user ya cargado)
 * @param {Object} res - Response HTTP de Express
 * @param {Function} next - Callback para continuar con el siguiente middleware
 * @returns {void} Continúa la cadena si el rol está permitido; 401 o 403 si no.
 */
const requireAdminOrRecepcionista = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const allowed = ['Administrador', 'Recepcionista'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Acceso denegado: se requiere rol Administrador o Recepcionista',
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: requireAdminOrTrainerOrRecepcionista (staff)
// Pasa si role es 'Administrador', 'Entrenador' o 'Recepcionista'.
// ─────────────────────────────────────────────────────────────
/**
 * Middleware de autorización genérico de staff. Permite el paso a cualquier
 * rol interno del gimnasio ('Administrador', 'Entrenador', 'Recepcionista'),
 * excluyendo a los afiliados. Es el guard por defecto de las vistas de gestión
 * (listado de afiliados, catálogos, notas de ejercicios, etc.).
 *
 * @param {Object} req - Request HTTP de Express (con req.user ya cargado)
 * @param {Object} res - Response HTTP de Express
 * @param {Function} next - Callback para continuar con el siguiente middleware
 * @returns {void} Continúa la cadena si el rol está permitido; 401 o 403 si no.
 */
const requireStaff = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const allowed = ['Administrador', 'Entrenador', 'Recepcionista'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Acceso denegado: se requiere rol de staff',
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: requireOwnCiclo
// Si el usuario es 'Afiliado', verifica que el id_ciclo del
// parámetro de ruta le pertenezca (CICLO.id_usuario === req.user.sub).
// Para Admin/Entrenador pasa automáticamente.
// ─────────────────────────────────────────────────────────────
const CicloModel = require('../models/cicloModel');

/**
 * Middleware de propiedad de recursos. Verifica que el ciclo pedido por
 * `id_ciclo` (parámetro de ruta) pertenezca al usuario autenticado cuando es
 * un 'Afiliado'. Admin/Entrenador pasan sin verificación porque gestionan a
 * cualquier afiliado. Previene IDs de el que se accede a ciclos ajenos
 * horizontalmente (IDOR).
 *
 * @param {Object} req - Request HTTP de Express (con req.user ya cargado)
 * @param {Object} res - Response HTTP de Express
 * @param {Function} next - Callback para continuar con el siguiente middleware
 * @returns {void} Continúa la cadena si el ciclo es propio (o el rol es staff
 *                 técnico); 400 si falta id_ciclo, 403 si no es de su propiedad,
 *                 404 si el ciclo no existe, 401 si no hay sesión.
 * @throws {Error} Devuelve 500 si la consulta a la BD falla.
 */
const requireOwnCiclo = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });

  const allowed = ['Administrador', 'Entrenador'];
  if (allowed.includes(req.user.role)) {
    return next();
  }

  const idCiclo = req.params.id_ciclo;
  if (!idCiclo) {
    return res.status(400).json({ error: 'id_ciclo es requerido' });
  }

  try {
    const ciclo = await CicloModel.findById(idCiclo);
    if (!ciclo) {
      return res.status(404).json({ error: 'Ciclo no encontrado' });
    }
    if (ciclo.id_usuario !== req.user.sub) {
      return res.status(403).json({ error: 'Este ciclo no te pertenece' });
    }
    next();
  } catch (err) {
    console.error('[requireOwnCiclo]', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  signJWT,
  hashPassword,
  comparePassword,
  requireAuth,
  requireAdmin,
  requireAdminOrEntrenador,
  requireAdminOrRecepcionista,
  requireStaff,
  requireOwnCiclo,
};
