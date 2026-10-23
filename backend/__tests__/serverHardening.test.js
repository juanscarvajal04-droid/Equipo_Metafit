'use strict';

// Tests de endurecimiento de server.js: health, 404, Content-Type, CORS,
// JSON malformado, errores de multer y handler global.
// Se reemplaza usuarioRoutes por un router de prueba que lanza cada error.

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

jest.mock('../config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock('../routes/usuarioRoutes', () => {
  const express = require('express');
  const multer = require('multer');
  const router = express.Router();

  router.get('/boom', (req, res, next) => next(new Error('boom')));
  router.get('/boom-cors', (req, res, next) => next(new Error('CORS no permitido para este origen')));
  router.get('/boom-jwt', (req, res, next) => {
    const err = new Error('jwt');
    err.name = 'JsonWebTokenError';
    next(err);
  });
  router.get('/boom-exp', (req, res, next) => {
    const err = new Error('exp');
    err.name = 'TokenExpiredError';
    next(err);
  });
  router.get('/boom-parse', (req, res, next) => {
    const err = new Error('parse');
    err.type = 'entity.parse.failed';
    next(err);
  });
  router.get('/boom-file', (req, res, next) => next(
    new Error('Solo se permiten imágenes (PNG, JPG, WEBP, GIF)')
  ));
  router.get('/boom-size', (req, res, next) => next(
    new multer.MulterError('LIMIT_FILE_SIZE')
  ));
  router.get('/boom-multer', (req, res, next) => next(
    new multer.MulterError('LIMIT_UNEXPECTED_FILE')
  ));

  return router;
});

const request = require('supertest');
const pool = require('../config/db');
const app = require('../server');

let originSnapshot;

beforeEach(() => {
  jest.clearAllMocks();
  originSnapshot = process.env.CORS_ORIGINS;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  if (originSnapshot === undefined) delete process.env.CORS_ORIGINS;
  else process.env.CORS_ORIGINS = originSnapshot;
});

describe('health check', () => {
  test('devuelve ok cuando la BD responde', async () => {
    pool.query.mockResolvedValue([[{ 1: 1 }]]);

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('MySQL conectado');
    expect(res.body.timestamp).toBeDefined();
  });

  test('devuelve degraded cuando la BD falla', async () => {
    pool.query.mockRejectedValue(new Error('offline'));

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.db).toBe('MySQL no disponible');
  });
});

describe('middlewares globales', () => {
  test('ruta inexistente devuelve 404 sin reflejar el path', async () => {
    const res = await request(app).get('/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Recurso no encontrado' });
  });

  test('POST con Content-Type no permitido devuelve 415', async () => {
    const res = await request(app)
      .post('/login')
      .set('Content-Type', 'text/plain')
      .send('hola');

    expect(res.status).toBe(415);
    expect(res.body.error).toBe('Content-Type debe ser application/json');
  });

  test('JSON malformado devuelve 400', async () => {
    const res = await request(app)
      .post('/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'JSON malformado en el body' });
  });

  test('CORS rechaza orígenes fuera de la whitelist con 403', async () => {
    process.env.CORS_ORIGINS = 'https://allowed.test';

    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://evil.test');

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('CORS');
  });

  test('CORS permite orígenes de la whitelist', async () => {
    process.env.CORS_ORIGINS = 'https://allowed.test';
    pool.query.mockResolvedValue([[{ 1: 1 }]]);

    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://allowed.test');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://allowed.test');
  });

  test('CORS acepta comodín *', async () => {
    process.env.CORS_ORIGINS = '*';
    pool.query.mockResolvedValue([[{ 1: 1 }]]);

    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://cualquiera.test');

    expect(res.status).toBe(200);
  });
});

describe('error handler global', () => {
  test.each([
    ['/usuarios/boom', 500, 'Error interno del servidor'],
    ['/usuarios/boom-cors', 403, 'CORS no permitido para este origen'],
    ['/usuarios/boom-jwt', 401, 'Token inválido o expirado'],
    ['/usuarios/boom-exp', 401, 'Token inválido o expirado'],
    ['/usuarios/boom-parse', 400, 'JSON malformado en el body'],
    ['/usuarios/boom-file', 400, 'Solo se permiten imágenes (PNG, JPG, WEBP, GIF)'],
    ['/usuarios/boom-size', 400, 'La imagen supera el tamaño máximo de 5 MB'],
    ['/usuarios/boom-multer', 400, 'Error al procesar la imagen'],
  ])('%s devuelve %i', async (path, status, error) => {
    const res = await request(app).get(path);

    expect(res.status).toBe(status);
    expect(res.body).toEqual({ error });
  });
});

describe('swagger', () => {
  test('GET /api-docs.json entrega la spec dinámica', async () => {
    const res = await request(app)
      .get('/api-docs.json')
      .set('Host', 'localhost:3000');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body).toBeDefined();
    expect(res.body.openapi || res.body.swagger).toBeDefined();
  });

  test('GET /api-docs/ sirve la UI con el spec dinámico', async () => {
    const res = await request(app)
      .get('/api-docs/')
      .set('Host', 'localhost:3000');

    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });
});
