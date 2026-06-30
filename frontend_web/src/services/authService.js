// ============================================================
// src/services/authService.js — MetaFit Auth Service
//
// RESPONSABILIDAD ÚNICA (ISO 25000 - SoC):
// Punto de contacto EXCLUSIVO con la infraestructura de
// autenticación. Agrupa:
//   1. Comunicación HTTP  → loginUser()
//   2. Persistencia       → persistSession(), clearSession()
//   3. Recuperación       → loadStoredUser(), loadStoredToken()
//   4. Datos de dominio   → AVAILABLE_ROLES, ROLE_REDIRECT_MAP
//
// Ningún componente .jsx ni Contexto debe acceder directamente
// a localStorage o a axios para operaciones de autenticación.
// ============================================================

import api from './api';

// ── 1. DATOS DE DOMINIO ──────────────────────────────────────

/**
 * Roles disponibles para el selector del formulario de Login.
 * Centralizado aquí para que cualquier cambio solo afecte
 * a este archivo.
 */
export const AVAILABLE_ROLES = [
  { value: 'Administrador', label: '👑 Administrador' },
  { value: 'Entrenador',    label: '🏆 Entrenador'    },
  { value: 'Recepcionista', label: '🗂️ Recepcionista' },
];

/**
 * Mapa de redirección por rol post-login.
 * Si el rol no está mapeado, se usará '/afiliados' como fallback.
 */
export const ROLE_REDIRECT_MAP = {
  Administrador: '/dashboard',
  Recepcionista:  '/afiliados',
  Entrenador:     '/rutinas',
};

// ── 2. COMUNICACIÓN HTTP ─────────────────────────────────────

/**
 * Realiza la petición de inicio de sesión al backend.
 * Retorna el objeto crudo de la respuesta para que el llamador
 * (AuthContext) decida cómo gestionarlo.
 *
 * @param {{ correo: string, contrasena: string }} credentials
 * @returns {Promise<{ accessToken: string, user: object }>}
 * @throws {AxiosError} Si el servidor responde con un error HTTP.
 */
export const loginUser = async ({ correo, contrasena }) => {
  const response = await api.post('/login', {
    email:    correo,
    password: contrasena,
  });
  return response.data; // { accessToken, user: { id, email, role, ... } }
};

// ── 3. PERSISTENCIA DE SESIÓN ────────────────────────────────

/**
 * Persiste el token JWT y los datos del usuario en localStorage.
 * Es el único lugar del frontend autorizado a escribir estas claves.
 *
 * @param {string} accessToken  - JWT emitido por el backend.
 * @param {object} userData     - Datos del usuario autenticado.
 */
export const persistSession = (accessToken, userData) => {
  localStorage.setItem('metafit_token', accessToken);
  localStorage.setItem('metafit_user',  JSON.stringify(userData));
  localStorage.setItem('metafit_role',  userData?.role || '');
};

/**
 * Elimina todas las claves de sesión de MetaFit en localStorage.
 * Llamado por AuthContext.logout() y por el interceptor de api.js
 * ante un 401 global.
 */
export const clearSession = () => {
  localStorage.removeItem('metafit_token');
  localStorage.removeItem('metafit_user');
  localStorage.removeItem('metafit_role');
};

// ── 4. RECUPERACIÓN DE SESIÓN ────────────────────────────────

/**
 * Recupera y valida el usuario guardado en localStorage.
 * Si los datos están ausentes o corruptos, limpia las claves
 * afectadas y retorna null de forma segura.
 *
 * @returns {object|null} userData o null.
 */
export const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem('metafit_user');
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Descarta datos corruptos o de otra aplicación
    if (!parsed?.role) {
      clearSession();
      return null;
    }

    return parsed;
  } catch {
    // JSON malformado → limpia y reporta null
    clearSession();
    return null;
  }
};

/**
 * Recupera el token JWT almacenado en localStorage.
 *
 * @returns {string|null} JWT o null si no existe.
 */
export const loadStoredToken = () => {
  return localStorage.getItem('metafit_token') || null;
};

/**
 * Persiste únicamente el rol del usuario.
 * Usado por Login.jsx después de una autenticación exitosa
 * como paso redundante de seguridad.
 *
 * @param {string} role - Rol retornado por el backend.
 */
export const persistUserRole = (role) => {
  localStorage.setItem('metafit_role', role || '');
};
