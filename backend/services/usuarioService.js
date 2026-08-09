// backend/services/usuarioService.js
'use strict';

const UsuarioModel = require('../models/usuarioModel');

const UsuarioService = {

  getAll: async () => {
    const users = await UsuarioModel.findAll();
    return users.map(u => UsuarioService.normalizarUsuario(u));
  },

  getById: async (id) => {
    const user = await UsuarioModel.findById(id);
    return UsuarioService.normalizarUsuario(user);
  },

  guardarPushToken: async (idUsuario, pushToken) => {
    await pool.query(
      `UPDATE USUARIO SET push_token = ? WHERE id_usuario = ?`,
      [pushToken, idUsuario]
    );
  },

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

  delete: async (id, selfId) => {
    if (parseInt(id, 10) === selfId) {
      throw new Error('No puedes eliminarte a ti mismo');
    }
    const affected = await UsuarioModel.delete(id);
    return affected > 0;
  },

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
