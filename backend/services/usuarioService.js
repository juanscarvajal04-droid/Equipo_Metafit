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

  create: async (datos) => {
    // Normalizar entrada
    const nombres    = datos.nombres    || datos.nombres_usuario;
    const apellidos  = datos.apellidos  || datos.apellidos_usuario;
    const correo     = datos.correo     || datos.correo_usuario || datos.email;
    const contrasena = datos.contrasena || datos.contrasena_usuario || datos.password;
    const rol        = datos.rol        || datos.rol_usuario || datos.role;
    const estado     = datos.estado     || datos.estado_cuenta_usuario || datos.estado_cuenta;

    if (!nombres || !apellidos || !correo || !contrasena || !rol) {
      throw new Error('Todos los campos son requeridos');
    }

    const id = await UsuarioModel.create({ nombres, apellidos, correo, contrasena, rol, estado });
    const user = await UsuarioModel.findById(id);
    return UsuarioService.normalizarUsuario(user);
  },

  update: async (id, datos, selfId, userRole) => {
    const estadoNuevo = datos.estado || datos.estado_cuenta_usuario || datos.estado_cuenta;
    const rolNuevo    = datos.rol    || datos.rol_usuario || datos.role;

    // Protecciones de auto-modificación
    if (parseInt(id, 10) === selfId && estadoNuevo && estadoNuevo !== 'Activo') {
      throw new Error('No puedes desactivar tu propia cuenta');
    }

    if (parseInt(id, 10) === selfId && rolNuevo && rolNuevo !== userRole) {
      throw new Error('No puedes cambiar tu propio rol');
    }

    const payload = {
      nombres   : datos.nombres    || datos.nombres_usuario,
      apellidos : datos.apellidos  || datos.apellidos_usuario,
      correo    : datos.correo     || datos.correo_usuario || datos.email,
      contrasena: datos.contrasena || datos.contrasena_usuario || datos.password,
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
      estado_cuenta: u.estado,
      fecha_registro: u.fecha_registro
    };
  }
};

module.exports = UsuarioService;
