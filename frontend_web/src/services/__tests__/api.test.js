// frontend_web/src/services/__tests__/api.test.js
// ISO 25010 · Seguridad: el cliente axios adjunta el JWT automáticamente
// y el interceptor de respuesta limpia la sesión ante un 401 global
// (excepto en /login, donde 401 = credenciales incorrectas).
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockInstance } = vi.hoisted(() => {
  const instance = {
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { mockInstance: instance };
});

vi.mock('axios', () => ({ default: { create: vi.fn(() => mockInstance) } }));

import api, { loginRequest, getAfiliados } from '../api';

// Los interceptores se registran una sola vez al importar api.js:
// request.use(handler)            → calls[0][0]
// response.use(okHandler, errH)   → calls[0][1]
const requestHandler  = mockInstance.interceptors.request.use.mock.calls[0][0];
const responseHandler = mockInstance.interceptors.response.use.mock.calls[0][1];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Interceptor de request — adjunta el token', () => {
  test('agrega Authorization Bearer cuando existe token en localStorage', () => {
    localStorage.setItem('metafit_token', 'jwt-fake-123');

    const config = requestHandler({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer jwt-fake-123');
  });

  test('no agrega el header si no hay token guardado', () => {
    const config = requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('Interceptor de respuesta — manejo de 401', () => {
  test('limpia la sesión y redirige a /login en un 401 de ruta protegida', async () => {
    localStorage.setItem('metafit_token', 'x');
    localStorage.setItem('metafit_user', '{"role":"Admin"}');
    localStorage.setItem('metafit_role', 'Admin');
    Object.defineProperty(window, 'location', { value: { pathname: '/afiliados', href: '' }, writable: true });

    await expect(
      responseHandler({
        response: { status: 401 },
        config: { url: '/afiliados' },
      })
    ).rejects.toEqual({ response: { status: 401 }, config: { url: '/afiliados' } });

    expect(localStorage.getItem('metafit_token')).toBeNull();
    expect(localStorage.getItem('metafit_user')).toBeNull();
    expect(localStorage.getItem('metafit_role')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  test('NO limpia la sesión si el 401 viene de /login (credenciales incorrectas)', async () => {
    localStorage.setItem('metafit_token', 'token-activo');
    Object.defineProperty(window, 'location', { value: { pathname: '/login', href: '' }, writable: true });

    await expect(
      responseHandler({
        response: { status: 401 },
        config: { url: '/login' },
      })
    ).rejects.toBeDefined();
    expect(localStorage.getItem('metafit_token')).toBe('token-activo');
    expect(window.location.href).not.toBe('/login');
  });
});

describe('Helpers de API', () => {
  test('loginRequest hace POST /login con las credenciales', async () => {
    mockInstance.post.mockResolvedValue({ data: { accessToken: 't', user: { id: 1 } } });

    const res = await loginRequest('carlos@metafit.com', 'Admin123!');

    expect(mockInstance.post).toHaveBeenCalledWith('/login', {
      email: 'carlos@metafit.com',
      password: 'Admin123!',
    });
    expect(res.data.accessToken).toBe('t');
    expect(api.defaults).toBeUndefined();  // api usa la instancia mockeada
  });

  test('getAfiliados hace GET /afiliados', async () => {
    mockInstance.get.mockResolvedValue({ data: [{ id: 1 }] });

    const res = await getAfiliados();

    expect(mockInstance.get).toHaveBeenCalledWith('/afiliados');
    expect(res.data).toHaveLength(1);
  });
});