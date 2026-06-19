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
});
