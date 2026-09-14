// backend/services/usuarioService.js
// ─── Lógica de negocio de USUARIO (Personal: Admin/Entrenador/Recepción) ──
// Orquesta las operaciones sobre USUARIO que expone usuarioController:
// listado (con o sin el rol Recepcionista), CRUD, registro de push_token y la
// normalización del shape plano → frontend. Aquí viven las protecciones de
// auto-modificación (nadie puede desactivarse o cambiarse su propio rol) y la
// auto-sanación idempotente de la columna push_token si la migración no corrió.
'use strict';

const UsuarioModel = require('../models/usuarioModel');
const pool = require('../config/db');

const UsuarioService = {

  /**
   * getAll — Lista todo el personal con el shape normalizado para el frontend.
   *
   * @returns {Promise<Array<Object>>} Usuarios normalizados (o [] si no hay).
   */
  getAll: async () => {
    const users = await UsuarioModel.findAll();
    return users.map(u => UsuarioService.normalizarUsuario(u));
  },

  /** Lista SOLO usuarios con rol Recepcionista (para el select de "atendió"). */
  getRecepcionistas: async () => {
    const users = await UsuarioModel.findRecepcionistas();
    return users.map(u => UsuarioService.normalizarUsuario(u));
  },

  /** Busca un usuario por id y lo normaliza. @returns {Promise<Object|null>} */
  getById: async (id) => {
    const user = await UsuarioModel.findById(id);
    return UsuarioService.normalizarUsuario(user);
  },

  /**
   * guardarPushToken — Persiste el token de notificaciones push del usuario.
   * Auto-sanación: si la columna push_token aún no existe (migración no
   * corrió), ejecuta asegurarColumnaPushToken() y reintenta (idempotente).
   *
   * @param {number} idUsuario - id_usuario del cliente.
   * @param {string} pushToken - Token Expo de notificaciones.
   * @returns {Promise<void>}
   */
  guardarPushToken: async (idUsuario, pushToken) => {
    const probar = () =>
      pool.query(
        `UPDATE USUARIO SET push_token = ? WHERE id_usuario = ?`,
        [pushToken, idUsuario]
      );
    try {
      await probar();
    } catch (err) {
      // Auto-sanación: si la columna no existe (migración no corrió aún),
      // la crea en caliente e intenta de nuevo (idempotente).
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const { asegurarColumnaPushToken } = require('../migrations/migracionPushToken');
        await asegurarColumnaPushToken();
        await probar();
        return;
      }
      throw err;
    }
  },

  /**
   * create — Crea un usuario del personal validando campos obligatorios
   * (nombres, apellidos, correo, contraseña, rol). El estado es opcional
   * (default en BD).
   *
   * @param {Object} datos - { nombres, apellidos, correo|email, contrasena|password, rol, estado? }.
   * @returns {Promise<Object>} Usuario creado y normalizado.
   * @throws {Error} Si falta alguno de los campos obligatorios.
   */
  create: async (datos) => {
    const nombres    = datos.nombres;
    const apellidos  = datos.apellidos;
    const correo     = datos.correo || datos.email;
    const contrasena = datos.contrasena || datos.password;
    const rol        = datos.rol;
    const estado     = datos.estado;

    if (!nombres || !apellidos || !correo || !contrasena || !rol) {
      throw new Error('Todos los campos son requeridos');
    }

    const id = await UsuarioModel.create({ nombres, apellidos, correo, contrasena, rol, estado });
    const user = await UsuarioModel.findById(id);
    return UsuarioService.normalizarUsuario(user);
  },

  /**
   * update — Actualiza un usuario del personal con protecciones de
   * auto-modificación: nadie puede desactivar su propia cuenta ni cambiar su
   * propio rol (evita dejar al sistema sin admins / autoráise de privilegios
   * desde un token ya emitido). Los campos vacíos/undefined se descartan;
   * sin campos útiles lanza error.
   *
   * @param {number}   id       - id_usuario a actualizar.
   * @param {Object}   datos    - { nombres, apellidos, correo|email, contrasena|password, rol, estado? }.
   * @param {number}   selfId   - id_usuario del autenticado.
   * @param {string}   userRole - Rol del autenticado (para la protección de rol).
   * @returns {Promise<Object|null>} Usuario actualizado y normalizado, o null si no existía.
   * @throws {Error} Si se intenta auto-desactivar o auto-cambiar el rol.
   */
  update: async (id, datos, selfId, userRole) => {
    const estadoNuevo = datos.estado;
    const rolNuevo    = datos.rol;

    // Protecciones de auto-modificación
    if (parseInt(id, 10) === selfId && estadoNuevo && estadoNuevo !== 'Activo') {
      throw new Error('No puedes desactivar tu propia cuenta');
    }

    if (parseInt(id, 10) === selfId && rolNuevo && rolNuevo !== userRole) {
      throw new Error('No puedes cambiar tu propio rol');
    }

    const payload = {
      nombres   : datos.nombres,
      apellidos : datos.apellidos,
      correo    : datos.correo || datos.email,
      contrasena: datos.contrasena || datos.password,
      rol       : rolNuevo,
      estado    : estadoNuevo,
    };

    // Eliminar undefined o vacíos
    Object.keys(payload).forEach(k => (payload[k] === undefined || payload[k] === '') && delete payload[k]);

    if (Object.keys(payload).length === 0) {
      throw new Error('No se enviaron campos para actualizar');
    }

    const affected = await UsuarioModel.update(id, payload);
    if (!affected) return null;

    const user = await UsuarioModel.findById(id);
    return UsuarioService.normalizarUsuario(user);
  },

  /**
   * delete — Elimina un usuario del personal. Bloquea el borrado de la propia
   * cuenta (nunca dejar al sistema sin sesión/auditoría del admin actual).
   *
   * @param {number} id    - id_usuario a eliminar.
   * @param {number} selfId - id_usuario del autenticado.
   * @returns {Promise<boolean>} true si se eliminó.
   * @throws {Error} Si se intenta auto-eliminar.
   */
  delete: async (id, selfId) => {
    if (parseInt(id, 10) === selfId) {
      throw new Error('No puedes eliminarte a ti mismo');
    }
    const affected = await UsuarioModel.delete(id);
    return affected > 0;
  },

  /**
   * normalizarUsuario — Convierte la fila de BD al shape plano que consume el
   * frontend: expone alias (email, role, id) además de los nombres canónicos
   * (correo, rol, id_usuario) para no romper ninguno de los dos frontends.
   *
   * @param {Object|null} u - Fila de USUARIO (o null).
   * @returns {Object|null} Usuario normalizado o null si la entrada es null.
   */
  normalizarUsuario: (u) => {
    if (!u) return null;
    return {
      id: u.id_usuario,
      id_usuario: u.id_usuario,
      correo: u.correo,
      email: u.correo,
      rol: u.rol,
      role: u.rol,
      nombres: u.nombres,
      apellidos: u.apellidos,
      estado: u.estado,
      fecha_registro: u.fecha_registro
    };
  }
};

module.exports = UsuarioService;
