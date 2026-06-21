// controllers/usuarioController.js
// Refactorizado: delegar en usuarioService para MVC limpio
'use strict';

const UsuarioService = require('../services/usuarioService');

const UsuarioController = {

  /** GET /usuarios/recepcionistas — solo usuarios con rol Recepcionista */
  getRecepcionistas: async (req, res) => {
    try {
      const all = await UsuarioService.getAll();
      const recepcionistas = all.filter(u => u.rol === 'Recepcionista');
      return res.json(recepcionistas);
    } catch (err) {
      console.error('[usuarioController.getRecepcionistas]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getAll: async (req, res) => {
    try {
      const users = await UsuarioService.getAll();
      return res.json(users);
    } catch (err) {
      console.error('[usuarioController.getAll]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getById: async (req, res) => {
    try {
      const user = await UsuarioService.getById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.json(user);
    } catch (err) {
      console.error('[usuarioController.getById]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  create: async (req, res) => {
    try {
      const user = await UsuarioService.create(req.body);
      return res.status(201).json(user);
    } catch (err) {
      if (err.message === 'Todos los campos son requeridos') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ya existe un empleado con ese correo' });
      }
      console.error('[usuarioController.create]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  update: async (req, res) => {
    try {
      const user = await UsuarioService.update(req.params.id, req.body, req.user.sub, req.user.role);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.json(user);
    } catch (err) {
      if (err.message === 'No se enviaron campos para actualizar' ||
          err.message === 'No puedes desactivar tu propia cuenta' ||
          err.message === 'No puedes cambiar tu propio rol') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ese correo ya está en uso' });
      }
      console.error('[usuarioController.update]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  delete: async (req, res) => {
    try {
      const success = await UsuarioService.delete(req.params.id, req.user.sub);
      if (!success) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
      if (err.message === 'No puedes eliminarte a ti mismo') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ error: 'No se puede eliminar: el usuario tiene registros asociados' });
      }
      console.error('[usuarioController.delete]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = UsuarioController;