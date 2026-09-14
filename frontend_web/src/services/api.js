// ============================================================
// src/services/api.js — MetaFit API Client
// Archivo: /frontend_web/src/services/api.js
//
// Todas las llamadas apuntan al backend real (Node.js/MySQL).
// La URL base se inyecta via VITE_API_URL (docker-compose o .env local).
//
// Estructura del archivo:
//   1. Constantes de configuración (BASE_URL, API_BASE_URL)
//   2. Instancia axios + interceptores (token automático y 401 global)
//   3. Helpers por recurso (un export por endpoint del backend)
// ============================================================

import axios from 'axios';

/**
 * Base URL del backend.
 * En producción Render se inyecta: VITE_API_URL=https://metafit-backend-rr18.onrender.com
 * En desarrollo local, crea un .env en /frontend_web:
 *   VITE_API_URL=http://localhost:3001
 * El fallback apunta al backend local de desarrollo.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/** URL base pública del backend (para imágenes servidas bajo /uploads) */
export const API_BASE_URL = BASE_URL;

/**
 * Instancia principal de axios con baseURL apuntando al backend real.
 * Configuración: timeout de 10 s (evita que una caída del backend deje la app
 * colgada indefinidamente) y Content-Type JSON por defecto. Tiene dos
 * interceptores adjuntos (ver abajo) que se aplican a TODAS las peticiones.
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Interceptor de REQUEST: adjunta el token automáticamente ─
// Se ejecuta antes de cada petición saliente. Si hay un JWT en localStorage
// (metafit_token) lo inyecta como Authorization: Bearer, para que ningún
// helper necesite pasar el header manualmente.
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
// Maneja los 401 (token expirado/inválido) de forma centralizada: limpia la
// sesión y redirige a /login con window.location (fuera del alcance de React
// Router, por eso se usa location directamente).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const is401      = error.response?.status === 401;

    // ⚠️ IMPORTANTE: NO limpiar sesión si el 401 viene del propio /login.
    // Un 401 en /login significa "credenciales incorrectas", no "token expirado".
    // Si limpiáramos aquí, borraríamos una sesión activa de otro usuario.
    const isLoginEndpoint = requestUrl.includes('/login');

    if (is401 && !isLoginEndpoint) {
      // Token expirado o inválido desde una ruta protegida → limpia sesión
      localStorage.removeItem('metafit_token');
      localStorage.removeItem('metafit_user');
      localStorage.removeItem('metafit_role');
      // Usamos window.location solo como último recurso (fuera del contexto de React Router)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Helpers tipados por recurso ───────────────────────────────
// Cada export es una función que delega en `api` con el verbo, ruta y payload
// correctos. Se Centraliza para que los componentes no construyan URLs a mano.

/** POST /login — Autentica con correo/contraseña. NO requiere token previo. */
export const loginRequest = (correo, contrasena) =>
  api.post('/login', { email: correo, password: contrasena });

/** USUARIOS (solo Admin) — CRUD del personal. */
export const getUsuarios   = ()       => api.get('/usuarios');
export const createUsuario = (data)   => api.post('/usuarios', data);
export const updateUsuario = (id, data) => api.patch(`/usuarios/${id}`, data);
export const deleteUsuario = (id)     => api.delete(`/usuarios/${id}`);

/** AFILIADOS — CRUD completo + detalle. */
export const getAfiliados   = ()         => api.get('/afiliados');
export const getAfiliado    = (id)       => api.get(`/afiliados/${id}`);
export const createAfiliado = (data)     => api.post('/afiliados', data);
export const updateAfiliado = (id, data) => api.patch(`/afiliados/${id}`, data);
export const deleteAfiliado = (id)       => api.delete(`/afiliados/${id}`);

/** CICLOS — Historial y alta de ciclos de entrenamiento. */
export const getCiclosAfiliado = (id)    => api.get(`/afiliados/${id}/ciclos`);
export const createCiclo       = (data)  => api.post('/afiliados/ciclos', data);

/** PROGRESO — Mediciones físicas por afiliado. */
export const getProgreso   = (id)    => api.get(`/afiliados/${id}/progreso`);
export const createProgreso = (data) => api.post('/afiliados/progreso', data);

/** RESTRICCIONES — Listado de restricciones médicas de un afiliado. */
export const getRestricciones = (id) => api.get(`/afiliados/${id}/restricciones`);

/** CATÁLOGOS FILTRADOS POR RESTRICCIONES DEL AFILIADO */
export const getEjerciciosDisponibles = (id) => api.get(`/afiliados/${id}/ejercicios-disponibles`);
export const getAlimentosDisponibles = (id) => api.get(`/afiliados/${id}/alimentos-disponibles`);

/** CATÁLOGOS (ejercicios, alimentos, restricciones médicas) — listas maestras. */
export const getEjercicios    = () => api.get('/catalogo/ejercicios');
export const getAlimentos     = () => api.get('/catalogo/alimentos');
export const getCatalogRest   = () => api.get('/catalogo/restricciones');

/** PLANES — Planes de entrenamiento y nutricionales por ciclo. */
export const getPlanEntrenamiento = (idCiclo) => api.get(`/planes/entrenamiento/${idCiclo}`);
export const getPlanNutricional   = (idCiclo) => api.get(`/planes/nutricional/${idCiclo}`);
export const createPlanEntrenamiento = (data) => api.post('/planes/entrenamiento', data);
export const createPlanNutricional   = (data) => api.post('/planes/nutricional', data);
export const createRutina            = (data) => api.post('/planes/rutinas', data);

/** DASHBOARD — KPIs globales (solo Admin). */
export const getDashboardKPIs = () => api.get('/dashboard/kpis');

/** HEALTH CHECK — Endpoint de sondeo del servidor. */
export const healthCheck = () => api.get('/health');

/** NOTIFICACIONES — Indicadores contextuales del panel según el rol. */
export const getNotificaciones = () => api.get('/notificaciones');

/** PAGOS (FIX 5) — Historial y alta de pagos por afiliado. */
export const getPagos   = (id)        => api.get(`/afiliados/${id}/pagos`);
export const createPago = (id, data)  => api.post(`/afiliados/${id}/pagos`, data);