// ============================================================
// src/services/api.js — MetaFit API Client
// Archivo: /frontend_web/src/services/api.js
//
// Todas las llamadas apuntan al backend real (Node.js/MySQL).
// La URL base se inyecta via VITE_API_URL (docker-compose o .env local).
// ============================================================

import axios from 'axios';

/**
 * Base URL del backend.
 * En Docker Compose se inyecta: VITE_API_URL=http://localhost:3001
 * En desarrollo local sin Docker, crea un .env en /frontend_web:
 *   VITE_API_URL=http://localhost:3001
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Instancia principal de axios con baseURL apuntando al backend real.
 * Interceptor automático: inyecta el JWT en cada petición si existe.
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Interceptor de REQUEST: adjunta el token automáticamente ─
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('metafit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de RESPONSE: manejo global de errores ────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido → limpia sesión
      localStorage.removeItem('metafit_token');
      localStorage.removeItem('metafit_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Helpers tipados por recurso ───────────────────────────────

/** AUTH */
export const loginRequest = (correo, contrasena) =>
  api.post('/login', { email: correo, password: contrasena });

/** USUARIOS (solo Admin) */
export const getUsuarios   = ()       => api.get('/usuarios');
export const createUsuario = (data)   => api.post('/usuarios', data);
export const updateUsuario = (id, data) => api.patch(`/usuarios/${id}`, data);
export const deleteUsuario = (id)     => api.delete(`/usuarios/${id}`);

/** AFILIADOS */
export const getAfiliados   = ()         => api.get('/afiliados');
export const getAfiliado    = (id)       => api.get(`/afiliados/${id}`);
export const createAfiliado = (data)     => api.post('/afiliados', data);
export const updateAfiliado = (id, data) => api.patch(`/afiliados/${id}`, data);
export const deleteAfiliado = (id)       => api.delete(`/afiliados/${id}`);

/** CICLOS */
export const getCiclosAfiliado = (id)    => api.get(`/afiliados/${id}/ciclos`);
export const createCiclo       = (data)  => api.post('/afiliados/ciclos', data);

/** PROGRESO */
export const getProgreso   = (id)    => api.get(`/afiliados/${id}/progreso`);
export const createProgreso = (data) => api.post('/afiliados/progreso', data);

/** RESTRICCIONES */
export const getRestricciones = (id) => api.get(`/afiliados/${id}/restricciones`);

/** CATÁLOGOS (ejercicios, alimentos, restricciones médicas) */
export const getEjercicios    = () => api.get('/catalogo/ejercicios');
export const getAlimentos     = () => api.get('/catalogo/alimentos');
export const getCatalogRest   = () => api.get('/catalogo/restricciones');

/** PLANES */
export const getPlanEntrenamiento = (idCiclo) => api.get(`/planes/entrenamiento/${idCiclo}`);
export const getPlanNutricional   = (idCiclo) => api.get(`/planes/nutricional/${idCiclo}`);
export const createPlanEntrenamiento = (data) => api.post('/planes/entrenamiento', data);
export const createPlanNutricional   = (data) => api.post('/planes/nutricional', data);
export const createRutina            = (data) => api.post('/planes/rutinas', data);

/** DASHBOARD */
export const getDashboardKPIs = () => api.get('/dashboard/kpis');

/** HEALTH CHECK */
export const healthCheck = () => api.get('/health');
