// backend/controllers/notificacionController.js
// ─── Notificaciones del panel según el rol ───────────────────
// Controlador mínimo: deriva el rol desde el token (req.user.role) y pide al
// modelo las notificaciones contextuales de ese rol.
'use strict';

const NotificacionModel = require('../models/notificacionModel');

const NotificacionController = {

  /**
   * GET /notificaciones — Devuelve las notificaciones del usuario autenticado,
   * calculadas según su rol (Admin/Recepcionista/Entrenador). El rol se toma
   * del token JWT (req.user.role), no del body, para no confiar en el cliente.
   *
   * @param {Object} req - Express request (req.user.role proviene del middleware auth)
   * @param {Object} res - Express response
   * @returns {Promise<void>} 200 con la lista de notificaciones o 500.
   */
  getNotificaciones: async (req, res) => {
    try {
      const rol = req.user.role;
      const notificaciones = await NotificacionModel.getByRole(rol);
      return res.json(notificaciones);
    } catch (err) {
      console.error('[notificacionController.getNotificaciones]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = NotificacionController;