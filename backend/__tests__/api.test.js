'use strict';

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const app = require('../server');

jest.mock('../config/db', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return mockPool;
});

const pool = require('../config/db');

describe('API Integration — Catálogos Filtrados', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /login con credenciales admin devuelve token', async () => {
    pool.query.mockResolvedValueOnce([[{
      id_usuario: 1,
      nombres: 'Carlos',
      apellidos: 'Ramírez',
      correo: 'carlos@metafit.com',
      contrasena: '$2a$12$c3mF4PBqzZSAALCUeXknzecZFAMRqNZYosm321UorUZeYZJSx4s26',
      rol: 'Administrador',
      estado: 'Activo',
    }]]);

    const res = await request(app)
      .post('/login')
      .send({ email: 'carlos@metafit.com', password: 'Admin123!' })
      .expect('Content-Type', /json/);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.role).toBe('Administrador');
  });

  test('GET /afiliados/1/ejercicios-disponibles con token devuelve 200 y un array', async () => {
    pool.query.mockResolvedValueOnce([[{
      id_usuario: 1,
      nombres: 'Carlos',
      apellidos: 'Ramírez',
      correo: 'carlos@metafit.com',
      contrasena: '$2a$12$c3mF4PBqzZSAALCUeXknzecZFAMRqNZYosm321UorUZeYZJSx4s26',
      rol: 'Administrador',
      estado: 'Activo',
    }]]);

    const loginRes = await request(app)
      .post('/login')
      .send({ email: 'carlos@metafit.com', password: 'Admin123!' });
    const token = loginRes.body.accessToken;

    pool.query.mockReset();

    pool.query.mockResolvedValueOnce([[{ id_ejercicio: 1, nombre_ejercicio: 'Sentadilla' }]]);

    const res = await request(app)
      .get('/afiliados/1/ejercicios-disponibles')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /afiliados/1/ejercicios-disponibles sin token devuelve 401', async () => {
    const res = await request(app)
      .get('/afiliados/1/ejercicios-disponibles')
      .expect('Content-Type', /json/);

    expect(res.status).toBe(401);
  });

  test('GET /notificaciones como admin devuelve 200 y un array', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { sub: 1, email: 'carlos@metafit.com', role: 'Administrador' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    pool.query.mockResolvedValueOnce([[{ membresias: 3 }]]);
    pool.query.mockResolvedValueOnce([[{ nuevos: 5 }]]);
    pool.query.mockResolvedValueOnce([[{ pendientes: 1 }]]);

    const res = await request(app)
      .get('/notificaciones')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    expect(res.body[0]).toHaveProperty('tipo');
    expect(res.body[0]).toHaveProperty('cantidad');
    expect(res.body[0]).toHaveProperty('mensaje');
  });

  test('GET /notificaciones sin token devuelve 401', async () => {
    const res = await request(app)
      .get('/notificaciones')
      .expect('Content-Type', /json/);

    expect(res.status).toBe(401);
  });

  // ── ISO 25010 · Seguridad: CORS con lista blanca ──────────────
  test('Origen ajeno a la lista blanca recibe 403 CORS', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://evil.example.com')
      .expect('Content-Type', /json/);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/CORS/);
  });

  test('Origen de la lista blanca recibe headers CORS válidos', async () => {
    process.env.CORS_ORIGINS = 'https://metafit-frontend-78x6.onrender.com';
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://metafit-frontend-78x6.onrender.com');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin'])
      .toBe('https://metafit-frontend-78x6.onrender.com');
  });

  // ── ISO 25010 · Seguridad: RBAC en mutaciones de afiliados ────
  test('POST /afiliados con rol Afiliado devuelve 403', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { sub: 2, email: 'afi@metafit.com', role: 'Afiliado' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .post('/afiliados')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombres: 'A', apellidos: 'B', correo: 'x@y.com', contrasena: '123456', documento: '1' })
      .expect('Content-Type', /json/);

    expect(res.status).toBe(403);
  });

  test('PATCH /afiliados/1 con rol de Entrenador devuelve 403', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { sub: 3, email: 'trainer@metafit.com', role: 'Entrenador' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .patch('/afiliados/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ telefono: '3001234567' })
      .expect('Content-Type', /json/);

    expect(res.status).toBe(403);
  });

  test('PATCH /afiliados/1 con rol Recepcionista pasa el middleware RBAC', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { sub: 1, email: 'recepcion@metafit.com', role: 'Recepcionista' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    pool.query.mockReset();
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    // El modelo usa transacción (getConnection + commit)
    const conn = {
      query: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
    };
    pool.getConnection = jest.fn().mockResolvedValue(conn);

    const res = await request(app)
      .patch('/afiliados/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ telefono: '3001234567' })
      .expect('Content-Type', /json/);

    expect(res.status).not.toBe(403);  // 200 o 404 (depende del mock), NUNCA 403
  });
});
