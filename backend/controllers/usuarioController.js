// controllers/usuarioController.js
// Refactorizado: BUG-006 (bloquear cambio de rol propio),
//               BUG-007 (PATCH body vacío → 400 en lugar de 404),
//               BUG-010 (cero fugas de err.message al cliente)
'use strict';

const UsuarioModel = require('../models/usuarioModel');

const UsuarioController = {

  getAll: async (req, res) => {
    try {
      const users = await UsuarioModel.findAll();
      return res.json(users);
    } catch (err) {
      // ── BUG-010: Log interno, mensaje genérico al cliente ────
      console.error('[usuarioController.getAll]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  getById: async (req, res) => {
    try {
      const user = await UsuarioModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.json(user);
    } catch (err) {
      console.error('[usuarioController.getById]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  create: async (req, res) => {
    // Acepta tanto nombres_usuario (legacy) como nombres (nuevo esquema)
    const nombres    = req.body.nombres    || req.body.nombres_usuario;
    const apellidos  = req.body.apellidos  || req.body.apellidos_usuario;
    const correo     = req.body.correo     || req.body.correo_usuario;
    const contrasena = req.body.contrasena || req.body.contrasena_usuario;
    const rol        = req.body.rol        || req.body.rol_usuario;
    const estado     = req.body.estado     || req.body.estado_cuenta_usuario;

    if (!nombres || !apellidos || !correo || !contrasena || !rol)
      return res.status(400).json({ error: 'Todos los campos son requeridos' });

    try {
      const id = await UsuarioModel.create({ nombres, apellidos, correo, contrasena, rol, estado });
      return res.status(201).json({ id, message: 'Usuario creado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ya existe un empleado con ese correo' });
      // ── BUG-010 ─────────────────────────────────────────────
      console.error('[usuarioController.create]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  update: async (req, res) => {
    const targetId    = parseInt(req.params.id, 10);
    const selfId      = req.user.sub;
    const estadoNuevo = req.body.estado || req.body.estado_cuenta_usuario;
    const rolNuevo    = req.body.rol    || req.body.rol_usuario;

    // ── Protecciones de auto-modificación ───────────────────
    // El admin no puede desactivarse a sí mismo
    if (targetId === selfId && estadoNuevo && estadoNuevo !== 'Activo')
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });

    // ── BUG-006: El admin no puede cambiar su propio rol ─────
    // Sin esta protección podría degradarse a Recepcionista y perder acceso.
    if (targetId === selfId && rolNuevo && rolNuevo !== req.user.role)
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });

    try {
      // Normaliza nombres de campos (compatibilidad legacy → nuevo esquema)
      const payload = {
        nombres   : req.body.nombres    || req.body.nombres_usuario,
        apellidos : req.body.apellidos  || req.body.apellidos_usuario,
        correo    : req.body.correo     || req.body.correo_usuario,
        contrasena: req.body.contrasena || req.body.contrasena_usuario,
        rol       : rolNuevo,
        estado    : estadoNuevo,
      };
      // Eliminar keys undefined para no pisar datos no enviados
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      // ── BUG-007: Body vacío → 400, no 404 ───────────────────
      // UsuarioModel.update() retorna 0 tanto si no hay campos como si no existe
      // el usuario. Diferenciamos el caso ANTES de llegar al modelo.
      if (Object.keys(payload).length === 0)
        return res.status(400).json({ error: 'No se enviaron campos para actualizar' });

      const affected = await UsuarioModel.update(req.params.id, payload);
      if (!affected) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.json({ message: 'Usuario actualizado correctamente' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Ese correo ya está en uso' });
      // ── BUG-010 ─────────────────────────────────────────────
      console.error('[usuarioController.update]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  delete: async (req, res) => {
    if (parseInt(req.params.id, 10) === req.user.sub)
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    try {
      const affected = await UsuarioModel.delete(req.params.id);
      if (!affected) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2')
        return res.status(400).json({ error: 'No se puede eliminar: el usuario tiene registros asociados' });
      // ── BUG-010 ─────────────────────────────────────────────
      console.error('[usuarioController.delete]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = UsuarioController;