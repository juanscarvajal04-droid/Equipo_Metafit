// controllers/usuarioController.js
const UsuarioModel = require('../models/usuarioModel');

const UsuarioController = {

  getAll: async (req, res) => {
    try {
      const users = await UsuarioModel.findAll();
      res.json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  getById: async (req, res) => {
    try {
      const user = await UsuarioModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  create: async (req, res) => {
    const { nombres_usuario, apellidos_usuario, correo_usuario,
            contrasena_usuario, rol_usuario, estado_cuenta_usuario } = req.body;
    if (!nombres_usuario || !apellidos_usuario || !correo_usuario || !contrasena_usuario || !rol_usuario)
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    try {
      const id = await UsuarioModel.create(req.body);
      res.status(201).json({ id, message: 'Usuario creado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un empleado con ese correo' });
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    // El admin no puede desactivarse a sí mismo
    if (parseInt(req.params.id) === req.user.sub &&
        req.body.estado_cuenta_usuario && req.body.estado_cuenta_usuario !== 'Activo')
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    try {
      const affected = await UsuarioModel.update(req.params.id, req.body);
      if (!affected) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ message: 'Usuario actualizado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ese correo ya está en uso' });
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    if (parseInt(req.params.id) === req.user.sub)
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    try {
      const affected = await UsuarioModel.delete(req.params.id);
      if (!affected) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2')
        return res.status(400).json({ error: 'No se puede eliminar: el usuario tiene registros asociados' });
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = UsuarioController;