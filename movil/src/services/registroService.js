import api from './api';

export const registrarEjercicioReal = (data) =>
  api.post('/afiliados/me/registro-ejercicio', data);

export const registrarConsumoReal = (data) =>
  api.post('/afiliados/me/consumo-alimento-real', data);

export const getHistorialEjerciciosReales = (params = {}) =>
  api.get('/afiliados/me/registro-ejercicio/historial', { params });

export const getHistorialConsumosReales = (params = {}) =>
  api.get('/afiliados/me/consumo-alimento-real/historial', { params });