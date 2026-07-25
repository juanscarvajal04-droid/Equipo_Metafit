import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tunnelUrl from './tunnelUrl';

const TOKEN_KEY = 'metafit_token';
const USER_KEY  = 'metafit_user';
const ROLE_KEY  = 'metafit_role';

// ── URL del backend ─────────────────────────────────────────────
// Prioridad:
//   1. EXPO_PUBLIC_API_URL  (variable de entorno, para CI/CD)
//   2. tunnelUrl            (escrito por start-tunnel.sh)
//   3. RENDER_URL           (producción en Render)
//   4. localhost            (fallback local)
// ────────────────────────────────────────────────────────────────
const RENDER_URL = 'https://metafit-backend.onrender.com'; // ← CAMBIAR por la URL real de Render
const API_URL = process.env.EXPO_PUBLIC_API_URL || tunnelUrl || RENDER_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

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

export const loginRequest = (correo, contrasena) =>
  api.post('/login', { email: correo, password: contrasena });

export const getMiPerfil = () => api.get('/afiliados/me');
export const getMisCiclos = () => api.get('/afiliados/me/ciclos');
export const getMiProgreso = () => api.get('/afiliados/me/progreso');
export const getMisRestricciones = () => api.get('/afiliados/me/restricciones');
export const getPlanEntrenamiento = (idCiclo) => api.get(`/planes/entrenamiento/${idCiclo}`);
export const getPlanNutricional = (idCiclo) => api.get(`/planes/nutricional/${idCiclo}`);

export const guardarProgresoEjercicio = (idCiclo, fecha, ejercicios) =>
  api.post('/afiliados/me/progreso-ejercicio', { id_ciclo: idCiclo, fecha, ejercicios });

export const getProgresoEjercicioHoy = (idCiclo, fecha) =>
  api.get(`/afiliados/me/progreso-ejercicio/${idCiclo}/${fecha}`);

export const guardarAgua = (fecha, vasos) =>
  api.post('/afiliados/me/agua', { fecha, vasos });

export const getAguaHoy = (fecha) =>
  api.get(`/afiliados/me/agua/${fecha}`);

export const guardarConsumoAlimento = (idCiclo, fecha, alimentos) =>
  api.post('/afiliados/me/consumo-alimento', { id_ciclo: idCiclo, fecha, alimentos });
