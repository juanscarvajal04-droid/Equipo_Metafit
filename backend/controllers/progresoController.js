// backend/controllers/progresoController.js
// FASE 1: resumen diario (PROGRESO_DIARIO), historiales y evolución de un ejercicio.
'use strict';

const ProgresoDiarioModel = require('../models/progresoDiarioModel');
const RegistroService = require('../services/registroService');
const FiltroService = require('../services/filtroService');
const { normalizarFecha } = require('../utils/fechaUtils');

function mapearError(res, err) {
  if (err.code === 'DATOS_INCOMPLETOS' || (err.message && err.message.startsWith('Fecha inválida'))) {
    return res.status(400).json({ error: err.message });
  }
  console.error('[progresoController]', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

const ProgresoController = {

  // GET /progreso/resumen?fecha=YYYY-MM-DD  (si no se pasa fecha → hoy)
  getResumen: async (req, res) => {
    try {
      let fecha = normalizarFecha(req.query.fecha);
      if (!fecha) {
        const hoy = new Date();
        fecha = [hoy.getFullYear(), String(hoy.getMonth() + 1).padStart(2, '0'), String(hoy.getDate()).padStart(2, '0')].join('-');
      }
      // Recalcula los agregados desde las tablas fuente (agua, comer, ejercicio)
      // y devuelve la fila completa del día (incluye energía/ánimo guardados).
      await ProgresoDiarioModel.sincronizar(null, req.user.sub, fecha);
      const resumen = await ProgresoDiarioModel.getByFecha(req.user.sub, fecha);
      return res.json(resumen || { fecha, calorias_consumidas: 0, agua_vasos: 0, ejercicios_realizados: 0 });
    } catch (err) {
      console.error('[progresoController.getResumen]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // PUT /progreso/resumen  { fecha, nivel_energia?, estado_animo?, observaciones?, duracion_minutos? }
  updateResumen: async (req, res) => {
    try {
      const fecha = normalizarFecha(req.body.fecha);
      if (!fecha) {
        const err = new Error('fecha es requerida');
        err.code = 'DATOS_INCOMPLETOS';
        throw err;
      }
      const resultado = await ProgresoDiarioModel.guardarEstado(
        req.user.sub, fecha, req.body
      );
      return res.json({ message: 'Resumen diario actualizado correctamente', resumen: resultado });
    } catch (err) {
      return mapearError(res, err);
    }
  },

  // GET /progreso/historial?fechaInicio&fechaFin
  getHistorial: async (req, res) => {
    try {
      const data = await ProgresoDiarioModel.getHistorial(req.user.sub, req.query);
      return res.json(data);
    } catch (err) {
      console.error('[progresoController.getHistorial]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // GET /progreso/ejercicio/:idEjercicio/evolucion
  getEvolucionEjercicio: async (req, res) => {
    try {
      const idEjercicio = Number(req.params.idEjercicio);
      const data = await RegistroService.getEvolucionEjercicio(req.user.sub, idEjercicio, req.query);
      return res.json(data);
    } catch (err) {
      console.error('[progresoController.getEvolucionEjercicio]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = ProgresoController;