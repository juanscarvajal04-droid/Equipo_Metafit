'use strict';

// Tests de services/pushService.js: token, envío a Expo y resolución por ciclo.

jest.mock('../config/db', () => ({ query: jest.fn() }));

const pool = require('../config/db');
const { sendPush, getPushToken, enviarPushAUsuarioDelCiclo } = require('../services/pushService');

let fetchMock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn();
  global.fetch = fetchMock;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

describe('getPushToken', () => {
  test('devuelve el token vigente', async () => {
    pool.query.mockResolvedValueOnce([[{ push_token: 'ExponentPushToken[abc]' }]]);
    await expect(getPushToken(1)).resolves.toBe('ExponentPushToken[abc]');
  });

  test('devuelve null si no hay fila', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(getPushToken(1)).resolves.toBeNull();
  });
});

describe('sendPush', () => {
  test('devuelve ok:false sin token', async () => {
    await expect(sendPush({ token: null, title: 't', body: 'b' })).resolves.toEqual({
      ok: false,
      reason: 'sin token',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('envía a Expo y devuelve ok:true', async () => {
    fetchMock.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ data: [{ status: 'ok' }] }),
    });

    await expect(sendPush({
      token: 'ExponentPushToken[abc]',
      title: 'Hola',
      body: 'Cuerpo',
      data: { id: 1 },
    })).resolves.toEqual({ ok: true });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://exp.host/--/api/v2/push/send');
    const body = JSON.parse(options.body);
    expect(body.to).toBe('ExponentPushToken[abc]');
    expect(body.title).toBe('Hola');
    expect(body.data).toEqual({ id: 1 });
    expect(body.priority).toBe('high');
  });

  test('devuelve el status de Expo cuando no es ok', async () => {
    fetchMock.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ data: [{ status: 'error' }] }),
    });

    await expect(sendPush({ token: 't', title: 'x', body: 'y' })).resolves.toEqual({
      ok: false,
      reason: 'error',
      detalle: { data: [{ status: 'error' }] },
    });
  });

  test('usa "error expo" si la respuesta no trae status', async () => {
    fetchMock.mockResolvedValue({ json: jest.fn().mockResolvedValue({}) });

    await expect(sendPush({ token: 't', title: 'x', body: 'y' })).resolves.toEqual({
      ok: false,
      reason: 'error expo',
      detalle: {},
    });
  });

  test('captura errores de red', async () => {
    fetchMock.mockRejectedValue(new Error('network'));

    await expect(sendPush({ token: 't', title: 'x', body: 'y' })).resolves.toEqual({
      ok: false,
      reason: 'network',
    });
    expect(console.error).toHaveBeenCalledWith(
      '[pushService] error enviando push:',
      'network'
    );
  });
});

describe('enviarPushAUsuarioDelCiclo', () => {
  test('devuelve ok:false sin id de ciclo', async () => {
    await expect(enviarPushAUsuarioDelCiclo(null, { title: 't', body: 'b' })).resolves.toEqual({
      ok: false,
    });
  });

  test('devuelve reason si el ciclo no existe', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await expect(enviarPushAUsuarioDelCiclo(5, { title: 't', body: 'b' })).resolves.toEqual({
      ok: false,
      reason: 'ciclo no existe',
    });
  });

  test('devuelve reason si el usuario no tiene push_token', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_usuario: 1 }]])
      .mockResolvedValueOnce([[]]);

    await expect(enviarPushAUsuarioDelCiclo(5, { title: 't', body: 'b' })).resolves.toEqual({
      ok: false,
      reason: 'usuario sin push_token',
    });
  });

  test('envía el push al dueño del ciclo', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_usuario: 1 }]])
      .mockResolvedValueOnce([[{ push_token: 'ExponentPushToken[abc]' }]]);
    fetchMock.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ data: [{ status: 'ok' }] }),
    });

    await expect(enviarPushAUsuarioDelCiclo(5, {
      title: 'Nuevo plan',
      body: 'Revisá tu rutina',
      data: { id_ciclo: 5 },
    })).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalled();
  });

  test('captura errores de base de datos', async () => {
    pool.query.mockRejectedValue(new Error('db'));

    await expect(enviarPushAUsuarioDelCiclo(5, { title: 't', body: 'b' })).resolves.toEqual({
      ok: false,
    });
    expect(console.error).toHaveBeenCalledWith(
      '[pushService] error por ciclo:',
      'db'
    );
  });
});
