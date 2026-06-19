// backend/controllers/configuracionController.js
// ─── Solo Administrador puede leer/modificar la configuracion ─
'use strict';

const ConfiguracionModel = require('../models/configuracionModel');

const CLAVE_PRECIO = 'precio_membresia';

const ConfiguracionController = {

  getPrecioMembresia: async (req, res) => {
    try {
      const valor = await ConfiguracionModel.get(CLAVE_PRECIO);
      return res.json({ clave: CLAVE_PRECIO, valor: valor ? Number(valor) : 80000 });
    } catch (err) {
      console.error('[configuracionController.getPrecioMembresia]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  updatePrecioMembresia: async (req, res) => {
    const { valor } = req.body;
    if (valor == null || isNaN(Number(valor)) || Number(valor) <= 0) {
      return res.status(400).json({ error: 'valor debe ser un numero positivo' });
    }
    try {
      await ConfiguracionModel.set(CLAVE_PRECIO, String(Math.round(Number(valor))));
      return res.json({ message: 'Precio de membresia actualizado', valor: Number(valor) });
    } catch (err) {
      console.error('[configuracionController.updatePrecioMembresia]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = ConfiguracionController;
