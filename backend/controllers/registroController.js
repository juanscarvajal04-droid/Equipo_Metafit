// backend/controllers/registroController.js
// FASE 1: registro real de ejercicios (REGISTRO_EJERCICIO) y de consumo de alimentos
// (CONSUMO_ALIMENTO_REAL). Endpoints /me → usan req.user.sub automáticamente.
'use strict';

const RegistroService = require('../services/registroService');
const FiltroService = require('../services/filtroService');

// Traduce errores de negocio/BD a respuestas HTTP coherentes.
function mapearError(res, err) {
  if (err.code === 'DATOS_INCOMPLETOS' || err.code === 'DATOS_INVALIDOS') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'CICLO_NO_ENCONTRADO') {
    return res.status(404).json({ error: err.message });
  }
  if (err.code === 'CICLO_AJENO') {
    return res.status(403).json({ error: err.message });
  }
  if (err.code === 'ALIMENTO_NO_ENCONTRADO') {
    return res.status(400).json({ error: err.message });
  }
  // FK compuesta contra RUTINA_EJERCICIO (ejercicio no está en la rutina del ciclo)
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    if (/fk_rejec_rutejec/.test(err.message || '')) {
      return res.status(400).json({ error: 'El ejercicio no pertenece a la rutina indicada' });
    }
    if (/fk_creal_detalle/.test(err.message || '')) {
      return res.status(400).json({ error: 'El alimento no pertenece al plan nutricional del ciclo' });
    }
  }
  // UNIQUE (id_usuario, id_ciclo, id_rutina, orden, fecha) / (…num_comida, id_alimento, fecha)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un registro idéntico para esa fecha' });
  }
  console.error('[registroController]', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

const RegistroController = {

  // GET /afiliados/me/ejercicios-disponibles
  getEjerciciosDisponibles: async (req, res) => {
    try {
      const data = await FiltroService.getEjerciciosFiltrados(req.user.sub, req.query);
      return res.json(data);
    } catch (err) {
      console.error('[registroController.getEjerciciosDisponibles]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // GET /afiliados/me/alimentos-disponibles
  getAlimentosDisponibles: async (req, res) => {
    try {
      const data = await FiltroService.getAlimentosFiltrados(req.user.sub, req.query);
      return res.json(data);
    } catch (err) {
      console.error('[registroController.getAlimentosDisponibles]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // POST /afiliados/me/registro-ejercicio
  registerEjercicio: async (req, res) => {
    try {
      const result = await RegistroService.registerEjercicio(req.user.sub, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return mapearError(res, err);
    }
  },

  // GET /afiliados/me/registro-ejercicio/historial
  getHistorialEjercicios: async (req, res) => {
    try {
      const data = await RegistroService.getHistorialEjercicios(req.user.sub, req.query);
      return res.json(data);
    } catch (err) {
      console.error('[registroController.getHistorialEjercicios]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // POST /afiliados/me/consumo-alimento-real
  registerConsumoAlimento: async (req, res) => {
    try {
      const result = await RegistroService.registerConsumoAlimento(req.user.sub, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return mapearError(res, err);
    }
  },

  // GET /afiliados/me/consumo-alimento-real/historial
  getHistorialConsumos: async (req, res) => {
    try {
      const data = await RegistroService.getHistorialConsumos(req.user.sub, req.query);
      return res.json(data);
    } catch (err) {
      console.error('[registroController.getHistorialConsumos]', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = RegistroController;