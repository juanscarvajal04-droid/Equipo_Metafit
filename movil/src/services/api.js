// movil/src/services/api.js
// ─── Cliente HTTP de la app móvil + helpers de endpoints /me ──
// Instancia axios con: baseURL del backend desplegado, timeout de 10 s, e
// interceptores que inyectan el token desde AsyncStorage en cada request y
// limpian la sesión local ante un 401 (salvo en /login). También centraliza
// TODOS los endpoints que consume el afiliado (perfil, ciclos, planes,
// progreso, agua, consumo, notas y restablecimiento de contraseña).
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves de persistencia — DEBEN coincidir con las del AuthContext móvil.
const TOKEN_KEY = 'metafit_token';
const USER_KEY  = 'metafit_user';
const ROLE_KEY  = 'metafit_role';

// Backend desplegado (Render) — el móvil NO usa localhost porque la app corre
// en un dispositivo/emulador, así que siempre apunta al entorno de producción.
const API_URL = 'https://metafit-backend-rr18.onrender.com';

/** Instancia axios base: JSON por defecto + timeout de 10 s. */
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Interceptor de request: lee el token de AsyncStorage y, si existe, lo agrega
 * como Authorization: Bearer. AsyncStorage es asíncrono → el interceptor es
 * async. Si la lectura falla, simplemente envía la petición sin token.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor de response: cuando el backend responde 401 y la petición NO es
 * el login, limpia token/user/role de AsyncStorage para desloguear al usuario
 * (AppNavigator reacciona al token null y vuelve a Login). En /login no se
 * limpia nada porque un 401 ahí significa credenciales incorrectas, no una
 * sesión expirada.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || '';
    if (error.response?.status === 401 && !requestUrl.includes('/login')) {
      try { await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, ROLE_KEY]); } catch (_) {}
    }
    return Promise.reject(error);
  }
);

export default api;
export { TOKEN_KEY, USER_KEY, ROLE_KEY, API_URL };

/** POST /login — autentica al afiliado (email + password). */
export const loginRequest = (correo, contrasena) =>
  api.post('/login', { email: correo, password: contrasena });

/** POST /auth/recuperar-password — solicita el enlace de restablecimiento. */
export const solicitarRecuperacion = (email) =>
  api.post('/auth/recuperar-password', { email });

/** POST /auth/reset-password — cambia la contraseña con el token enviado. */
export const resetPasswordRequest = (token, nuevaPassword) =>
  api.post('/auth/reset-password', { token, nuevaPassword });

// ── Endpoints "yo" (afiliado autenticado): rutas /afiliados/me* ──
/** GET /afiliados/me — perfil completo del afiliado logueado. */
export const getMiPerfil = () => api.get('/afiliados/me');
/** GET /afiliados/me/ciclos — ciclos de entrenamiento del afiliado. */
export const getMisCiclos = () => api.get('/afiliados/me/ciclos');
/** GET /afiliados/me/progreso — progreso registrado del afiliado. */
export const getMiProgreso = () => api.get('/afiliados/me/progreso');
/** GET /afiliados/me/restricciones — restricciones médicas del afiliado. */
export const getMisRestricciones = () => api.get('/afiliados/me/restricciones');
/** GET /planes/entrenamiento/:idCiclo — plan de entrenamiento de un ciclo. */
export const getPlanEntrenamiento = (idCiclo) => api.get(`/planes/entrenamiento/${idCiclo}`);
/** GET /planes/nutricional/:idCiclo — plan nutricional de un ciclo. */
export const getPlanNutricional = (idCiclo) => api.get(`/planes/nutricional/${idCiclo}`);

/**
 * POST /afiliados/me/progreso-ejercicio — guarda el registro del día:
 * { id_ciclo, fecha, ejercicios: [{ id_ejercicio, completado, series, reps, peso }] }.
 */
export const guardarProgresoEjercicio = (idCiclo, fecha, ejercicios) =>
  api.post('/afiliados/me/progreso-ejercicio', { id_ciclo: idCiclo, fecha, ejercicios });

/** GET /afiliados/me/progreso-ejercicio/:idCiclo/:fecha — registro del día. */
export const getProgresoEjercicioHoy = (idCiclo, fecha) =>
  api.get(`/afiliados/me/progreso-ejercicio/${idCiclo}/${fecha}`);

/** POST /afiliados/me/agua — guarda el consumo de agua del día (vasos). */
export const guardarAgua = (fecha, vasos) =>
  api.post('/afiliados/me/agua', { fecha, vasos });

/** GET /afiliados/me/agua/:fecha — vasos registrados en una fecha. */
export const getAguaHoy = (fecha) =>
  api.get(`/afiliados/me/agua/${fecha}`);

/** POST /afiliados/me/consumo-alimento — guarda el consumo dietario del día. */
export const guardarConsumoAlimento = (idCiclo, fecha, alimentos) =>
  api.post('/afiliados/me/consumo-alimento', { id_ciclo: idCiclo, fecha, alimentos });

/** GET /afiliados/me/agua/historial — historial de vasos (acepta parámetros). */
export const getAguaHistorial = (params = {}) =>
  api.get('/afiliados/me/agua/historial', { params });

/** GET /afiliados/me/consumo/historial — historial de consumos. */
export const getConsumoHistorial = (params = {}) =>
  api.get('/afiliados/me/consumo/historial', { params });

/** GET /afiliados/me/progreso-ejercicio/historial — historial de progreso. */
export const getProgresoEjercicioHistorial = (params = {}) =>
  api.get('/afiliados/me/progreso-ejercicio/historial', { params });

/** PATCH /afiliados/me — actualiza el perfil del afiliado. */
export const actualizarMiPerfil = (datos) =>
  api.patch('/afiliados/me', datos);

/** GET /planes/entrenamiento/:idCiclo/rutina/:diaNumero — rutina de un día. */
export const getPlanRutinaDia = (idCiclo, diaNumero) =>
  api.get(`/planes/entrenamiento/${idCiclo}/rutina/${diaNumero}`);

// Parte 3: Nota del afiliado sobre un ejercicio (upsert por día)
/**
 * POST /afiliados/me/notas-ejercicio — crea/actualiza una nota del afiliado
 * sobre un ejercicio (upsert diario). El endpoint valida que la nota sea del
 * propio afiliado.
 */
export const guardarNotaEjercicio = (datos) =>
  api.post('/afiliados/me/notas-ejercicio', datos);

/** GET /afiliados/me/notas-ejercicio — notas del afiliado (opcional id_ciclo). */
export const getMisNotasEjercicio = (idCiclo) =>
  api.get('/afiliados/me/notas-ejercicio', { params: idCiclo ? { id_ciclo: idCiclo } : {} });

/** PATCH /afiliados/me/notas-ejercicio/:idNota — edita el texto de una nota. */
export const actualizarNotaEjercicio = (idNota, nota) =>
  api.patch(`/afiliados/me/notas-ejercicio/${idNota}`, { nota });
