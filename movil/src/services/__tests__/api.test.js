// movil/src/services/__tests__/api.test.js
// ISO 25010 · Seguridad: el cliente axios adjunta el JWT desde AsyncStorage
// y el interceptor de respuesta limpia la sesión ante 401 (excepto /login).
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios', () => ({ create: jest.fn() }));

// Mock oficial de AsyncStorage (evita módulos nativos).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const axios = require('axios');

// Instancia axios única: interceptores y helpers se registran UNA sola vez
// al importar ../api contra esta instancia.
const mockInstance = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
};
axios.create.mockReturnValue(mockInstance);

const api = require('../api');
const { TOKEN_KEY, USER_KEY, ROLE_KEY } = api;
const requestHandler = mockInstance.interceptors.request.use.mock.calls[0][0];
const requestErrorHandler = mockInstance.interceptors.request.use.mock.calls[0][1];
const responseSuccessHandler = mockInstance.interceptors.response.use.mock.calls[0][0];
const responseHandler = mockInstance.interceptors.response.use.mock.calls[0][1];

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('Cliente API móvil (axios + AsyncStorage)', () => {
  test('el interceptor adjunta el token desde AsyncStorage', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'jwt-móvil-123');

    const config = await requestHandler({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer jwt-móvil-123');
  });

  test('el interceptor no adjunta header si no hay token', async () => {
    const config = await requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  test('loginRequest hace POST /login con las credenciales', async () => {
    mockInstance.post.mockResolvedValueOnce({ data: { accessToken: 't', user: { id: 1 } } });

    const res = await api.loginRequest('afi@metafit.com', 'Clave123!');

    expect(mockInstance.post).toHaveBeenCalledWith('/login', {
      email: 'afi@metafit.com',
      password: 'Clave123!',
    });
    expect(res.data.accessToken).toBe('t');
  });

  test('getMiPerfil hace GET /afiliados/me', async () => {
    mockInstance.get.mockResolvedValueOnce({ data: { id: 5 } });

    const res = await api.getMiPerfil();

    expect(mockInstance.get).toHaveBeenCalledWith('/afiliados/me');
    expect(res.data.id).toBe(5);
  });

  test('actualizarMiPerfil hace PATCH /afiliados/me con los datos', async () => {
    mockInstance.patch.mockResolvedValueOnce({ data: { message: 'ok', imc: 26.62 } });

    const res = await api.actualizarMiPerfil({ peso_kg: 82, estatura_cm: 175.5, correo: 'afi@metafit.com' });

    expect(mockInstance.patch).toHaveBeenCalledWith('/afiliados/me', {
      peso_kg: 82,
      estatura_cm: 175.5,
      correo: 'afi@metafit.com',
    });
    expect(res.data.imc).toBe(26.62);
  });

  test('getPlanRutinaDia consulta la rutina filtrada del día', async () => {
    mockInstance.get.mockResolvedValueOnce({ data: { id_rutina: 9, dia_numero: 3, ejercicios: [] } });

    const res = await api.getPlanRutinaDia(5, 3);

    expect(mockInstance.get).toHaveBeenCalledWith('/planes/entrenamiento/5/rutina/3');
    expect(res.data.id_rutina).toBe(9);
  });

  test('un 401 fuera de /login limpia las claves de sesión', async () => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, 'x'],
      [USER_KEY, '{"id":1}'],
      [ROLE_KEY, 'Afiliado'],
    ]);

    const error = { response: { status: 401 }, config: { url: '/afiliados/me' } };
    await expect(responseHandler(error)).rejects.toBe(error);

    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(USER_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(ROLE_KEY)).toBeNull();
  });

  test('un 401 de /login NO limpia la sesión activa', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'sesion-activa');

    const error = { response: { status: 401 }, config: { url: '/login' } };
    await expect(responseHandler(error)).rejects.toBe(error);

    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBe('sesion-activa');
  });

  test('los interceptores dejan pasar la respuesta y propagan errores de petición', async () => {
    const res = { data: { ok: true } };
    expect(responseSuccessHandler(res)).toBe(res);

    const error = new Error('network');
    await expect(requestErrorHandler(error)).rejects.toBe(error);
  });

  test('los helpers invocan los endpoints esperados', async () => {
    mockInstance.post.mockResolvedValue({});
    mockInstance.get.mockResolvedValue({});
    mockInstance.patch.mockResolvedValue({});

    await api.solicitarRecuperacion('a@b.com');
    await api.resetPasswordRequest('tok', 'Nueva123');
    await api.guardarProgresoEjercicio(1, '2026-10-01', []);
    await api.getProgresoEjercicioHoy(1, '2026-10-01');
    await api.guardarAgua('2026-10-01', 4);
    await api.getAguaHoy('2026-10-01');
    await api.guardarConsumoAlimento(1, '2026-10-01', []);
    await api.getAguaHistorial();
    await api.getConsumoHistorial({ limite: 5 });
    await api.getProgresoEjercicioHistorial();
    await api.guardarNotaEjercicio({ nota: 'ok' });
    await api.getMisNotasEjercicio(2);
    await api.getMisNotasEjercicio();
    await api.actualizarNotaEjercicio(3, 'mejorar');

    expect(mockInstance.post).toHaveBeenCalledWith('/auth/recuperar-password', { email: 'a@b.com' });
    expect(mockInstance.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'tok',
      nuevaPassword: 'Nueva123',
    });
    expect(mockInstance.get).toHaveBeenCalledWith('/afiliados/me/agua/2026-10-01');
    expect(mockInstance.get).toHaveBeenCalledWith('/afiliados/me/notas-ejercicio', {
      params: { id_ciclo: 2 },
    });
    expect(mockInstance.get).toHaveBeenCalledWith('/afiliados/me/notas-ejercicio', { params: {} });
    expect(mockInstance.patch).toHaveBeenCalledWith('/afiliados/me/notas-ejercicio/3', {
      nota: 'mejorar',
    });
  });
});