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
    // Acepta tanto nombres_usuario (legacy) como nombres (nuevo esquema)
    const nombres   = req.body.nombres   || req.body.nombres_usuario;
    const apellidos = req.body.apellidos || req.body.apellidos_usuario;
    const correo    = req.body.correo    || req.body.correo_usuario;
    const contrasena = req.body.contrasena || req.body.contrasena_usuario;
    const rol       = req.body.rol       || req.body.rol_usuario;
    const estado    = req.body.estado    || req.body.estado_cuenta_usuario;

    if (!nombres || !apellidos || !correo || !contrasena || !rol)
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    try {
      const id = await UsuarioModel.create({ nombres, apellidos, correo, contrasena, rol, estado });
      res.status(201).json({ id, message: 'Usuario creado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un empleado con ese correo' });
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    // El admin no puede desactivarse a sí mismo
    const estadoNuevo = req.body.estado || req.body.estado_cuenta_usuario;
    if (parseInt(req.params.id) === req.user.sub &&
        estadoNuevo && estadoNuevo !== 'Activo')
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    try {
      // Normaliza nombres de campos (compatibilidad legacy → nuevo esquema)
      const payload = {
        nombres  : req.body.nombres   || req.body.nombres_usuario,
        apellidos: req.body.apellidos || req.body.apellidos_usuario,
        correo   : req.body.correo    || req.body.correo_usuario,
        contrasena: req.body.contrasena || req.body.contrasena_usuario,
        rol      : req.body.rol       || req.body.rol_usuario,
        estado   : estadoNuevo,
      };
      // Eliminar keys undefined para no pisar datos no enviados
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      const affected = await UsuarioModel.update(req.params.id, payload);
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