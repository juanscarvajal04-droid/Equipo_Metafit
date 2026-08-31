// backend/__tests__/fase2.test.js
// FASE 2 — CRUD de restricciones médicas del catálogo (solo Administrador).
'use strict';

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../server');

jest.mock('../config/db', () => {
  const mockPool = { query: jest.fn() };
  return mockPool;
});

const pool = require('../config/db');

async function loginAfiliado() {
  pool.query.mockResolvedValueOnce([[
    {
      id_usuario: 100,
      nombres: 'Carlos',
      apellidos: 'Demo',
      correo: 'carlos.demo@test.com',
      contrasena: '$2a$12$c3mF4PBqzZSAALCUeXknzecZFAMRqNZYosm321UorUZeYZJSx4s26',
      rol: 'Afiliado',
      estado: 'Activo',
    },
  ]]);
  const res = await request(app)
    .post('/login')
    .send({ email: 'carlos.demo@test.com', password: 'Admin123!' });
  expect(res.status).toBe(200);
  return res.body.accessToken;
}

function tokenAdmin(sub = 1) {
  return jwt.sign(
    { sub, email: 'admin@metafit.com', role: 'Administrador' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('FASE 2 — CRUD restricciones (solo Admin)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /catalogo/restricciones sin token devuelve 401', async () => {
    const res = await request(app)
      .post('/catalogo/restricciones')
      .send({ nombre_restriccion: 'Asma', tipo: 'Enfermedad' });
    expect(res.status).toBe(401);
  });

  test('POST /catalogo/restricciones con rol no admin devuelve 403', async () => {
    const token = await loginAfiliado();
    const res = await request(app)
      .post('/catalogo/restricciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre_restriccion: 'Asma', tipo: 'Enfermedad' });
    expect(res.status).toBe(403);
  });

  test('POST /catalogo/restricciones con admin crea y devuelve id', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 20 }]);
    const res = await request(app)
      .post('/catalogo/restricciones')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ nombre_restriccion: 'Asma', tipo: 'Enfermedad', efecto_relevante: 'Evitar alta intensidad' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(20);
    expect(res.body.message).toMatch(/Restricción creada/);
  });

  test('POST /catalogo/restricciones con nombre duplicado devuelve 400', async () => {
    const dup = new Error('dup');
    dup.code = 'ER_DUP_ENTRY';
    pool.query.mockRejectedValueOnce(dup);
    const res = await request(app)
      .post('/catalogo/restricciones')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ nombre_restriccion: 'Asma', tipo: 'Enfermedad' });
    expect(res.status).toBe(400);
  });

  test('POST /catalogo/restricciones con tipo inválido devuelve 400', async () => {
    const res = await request(app)
      .post('/catalogo/restricciones')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ nombre_restriccion: 'Asma', tipo: 'Gustito' });
    expect(res.status).toBe(400);
  });

  test('PUT /catalogo/restricciones/:id actualiza existente', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .put('/catalogo/restricciones/1')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ nombre_restriccion: 'Asma bronquial', tipo: 'Enfermedad' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Restricción actualizada/);
  });

  test('PUT /catalogo/restricciones/:id inexistente devuelve 404', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app)
      .put('/catalogo/restricciones/9999')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ nombre_restriccion: 'Asma', tipo: 'Enfermedad' });
    expect(res.status).toBe(404);
  });

  test('DELETE /catalogo/restricciones/:id elimina restricción no referenciada', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .delete('/catalogo/restricciones/20')
      .set('Authorization', `Bearer ${tokenAdmin()}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Restricción eliminada/);
  });

  test('DELETE /catalogo/restricciones/:id referenciada devuelve 409', async () => {
    const ref = new Error('fk');
    ref.code = 'ER_ROW_IS_REFERENCED_2';
    pool.query.mockRejectedValueOnce(ref);
    const res = await request(app)
      .delete('/catalogo/restricciones/1')
      .set('Authorization', `Bearer ${tokenAdmin()}`);
    expect(res.status).toBe(409);
  });

  test('GET /catalogo/restricciones devuelve catálogo', async () => {
    pool.query.mockResolvedValueOnce([[
      { id_restriccion: 1, nombre_restriccion: 'Diabetes tipo 2', tipo: 'Enfermedad', efecto_relevante: null },
    ]]);
    const res = await request(app)
      .get('/catalogo/restricciones')
      .set('Authorization', `Bearer ${tokenAdmin()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].nombre_restriccion).toBe('Diabetes tipo 2');
  });
});