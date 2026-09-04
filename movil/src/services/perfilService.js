// movil/src/services/perfilService.js
// Servicio de autenticación/edición del perfil propio. Sigue el patrón de
// registroService.js: envuelve la instancia axios de ./api.
import api from './api';

export const getPerfil = () => api.get('/afiliados/me');

export const actualizarPerfil = (datos) => api.patch('/afiliados/me', datos);

export const getHistorialCiclos = () => api.get('/afiliados/me/ciclos');

export const getRestricciones = () => api.get('/afiliados/me/restricciones');