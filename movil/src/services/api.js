import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'metafit_token';
const USER_KEY  = 'metafit_user';
const ROLE_KEY  = 'metafit_role';

const API_URL = 'https://metafit-backend-rr18.onrender.com';

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

export const solicitarRecuperacion = (email) =>
  api.post('/auth/recuperar-password', { email });

export const resetPasswordRequest = (token, nuevaPassword) =>
  api.post('/auth/reset-password', { token, nuevaPassword });

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
