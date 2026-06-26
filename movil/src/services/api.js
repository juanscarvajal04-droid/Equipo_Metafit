// ============================================================
// src/services/api.js — MetaFit Mobile API Client
//
// Configuración de la URL del backend:
// 1. Variable de entorno EXPO_PUBLIC_API_URL (si existe)
// 2. IP del servidor con puerto 3001
// ============================================================

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'metafit_token';
const USER_KEY  = 'metafit_user';
const ROLE_KEY  = 'metafit_role';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.1.196.132:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || '';
    const is401 = error.response?.status === 401;
    const isLoginEndpoint = requestUrl.includes('/login');

    if (is401 && !isLoginEndpoint) {
      try {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, ROLE_KEY]);
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

export default api;

export { TOKEN_KEY, USER_KEY, ROLE_KEY, API_URL };

export const loginRequest = (correo, contrasena) =>
  api.post('/login', { email: correo, password: contrasena });

export const getMiPerfil = () =>
  api.get('/afiliados/me');

export const getMisCiclos = () =>
  api.get('/afiliados/me/ciclos');

export const getMiProgreso = () =>
  api.get('/afiliados/me/progreso');

export const getMisRestricciones = () =>
  api.get('/afiliados/me/restricciones');

export const getPlanEntrenamiento = (idCiclo) =>
  api.get(`/planes/entrenamiento/${idCiclo}`);

export const getPlanNutricional = (idCiclo) =>
  api.get(`/planes/nutricional/${idCiclo}`);
