// backend/controllers/notificacionController.js
'use strict';

const NotificacionModel = require('../models/notificacionModel');

const NotificacionController = {

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
