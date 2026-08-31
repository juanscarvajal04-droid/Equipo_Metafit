// backend/__tests__/fase1.test.js
// FASE 1 — Registro real de ejercicios (REGISTRO_EJERCICIO), consumo real de alimentos
// (CONSUMO_ALIMENTO_REAL) y resumen diario (PROGRESO_DIARIO).
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

// Comodín: conexión transaccional para los POST /me/registro-*.
function conexionFalsa({ secuencia }) {
  const conn = {
    query: jest.fn(),
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
  };
  (secuencia || []).forEach(r => conn.query.mockResolvedValueOnce(r));
  conn.query.mockResolvedValue([{ affectedRows: 1 }]);
  return conn;
}

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

describe('FASE 1 — Registro real', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /afiliados/me/ejercicios-disponibles sin token devuelve 401', async () => {
    const res = await request(app).get('/afiliados/me/ejercicios-disponibles');
    expect(res.status).toBe(401);
  });

  test('GET /afiliados/me/ejercicios-disponibles devuelve ejercicios (restricciones reales)', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();
    pool.query.mockResolvedValueOnce([[
      { id_ejercicio: 2, nombre_ejercicio: 'Press de banca', grupo_muscular: 'Pecho', nivel_minimo: 'Intermedio' },
    ]]);

    const res = await request(app)
      .get('/afiliados/me/ejercicios-disponibles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].nombre_ejercicio).toBe('Press de banca');
  });

  test('GET /afiliados/me/alimentos-disponibles enriquece con calorías (v_alimento_calorias)', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();
    pool.query.mockResolvedValueOnce([[
      { id_alimento: 3, nombre_alimento: 'Huevo entero', proteinas: 13, carbohidratos: 1.1, grasas: 11 },
    ]]);
    pool.query.mockResolvedValueOnce([[
      { id_alimento: 3, calorias_por_100g: 155.4 },
    ]]);

    const res = await request(app)
      .get('/afiliados/me/alimentos-disponibles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].calorias_por_100g).toBe(155.4);
  });

  test('POST /afiliados/me/registro-ejercicio registra y actualiza el resumen diario', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    pool.query.mockResolvedValueOnce([[{ id_ciclo: 100, id_usuario: 100 }]]); // verificarCicloDe

    const secuencia = [
      [{ insertId: 11 }],                                                        // INSERT REGISTRO_EJERCICIO
      [[{ calorias_consumidas: 0, agua_vasos: 0, ejercicios_realizados: 1 }]],   // agregados sincronizar
      [{ affectedRows: 1 }],                                                      // upsert PROGRESO_DIARIO
      [[{ id_usuario: 100, fecha: '2026-08-30', ejercicios_realizados: 1 }]],     // lectura del resumen
    ];
    const conn = conexionFalsa({ secuencia });
    pool.getConnection = jest.fn().mockResolvedValue(conn);

    const res = await request(app)
      .post('/afiliados/me/registro-ejercicio')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_ciclo: 100, id_rutina: 100, orden: 1, fecha: '2026-08-30', series: 4, repeticiones: 10, peso_utilizado_kg: 60 });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/Ejercicio registrado/);
    expect(res.body.id_registro).toBe(11);
    expect(res.body.resumen.ejercicios_realizados).toBe(1);
    expect(conn.beginTransaction).toHaveBeenCalled();
    expect(conn.commit).toHaveBeenCalled();
  });

  test('POST /afiliados/me/registro-ejercicio con ciclo ajeno devuelve 403', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();
    pool.query.mockResolvedValueOnce([[{ id_ciclo: 200, id_usuario: 999 }]]); // ciclo de otro

    const res = await request(app)
      .post('/afiliados/me/registro-ejercicio')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_ciclo: 200, id_rutina: 100, orden: 1, fecha: '2026-08-30', series: 3, repeticiones: 8 });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/no te pertenece/);
  });

  test('POST /afiliados/me/registro-ejercicio sin datos requeridos devuelve 400', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    const res = await request(app)
      .post('/afiliados/me/registro-ejercicio')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_ciclo: 100 });

    expect(res.status).toBe(400);
  });

  test('POST /afiliados/me/consumo-alimento-real calcula calorías Atwater', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    pool.query.mockResolvedValueOnce([[{ id_ciclo: 100, id_usuario: 100 }]]); // verificarCicloDe

    const secuencia = [
      [{ affectedRows: 1, insertId: 25 }],                                       // INSERT...SELECT alimento
      [[{ calorias_consumidas: 233.1 }]],                                         // valor calculado
      [[{ calorias_consumidas: 233.1, agua_vasos: 0, ejercicios_realizados: 0 }]], // agregados
      [{ affectedRows: 1 }],                                                       // upsert resumen
      [[{ id_usuario: 100, calorias_consumidas: 233.1 }]],                         // lectura resumen
    ];
    const conn = conexionFalsa({ secuencia });
    pool.getConnection = jest.fn().mockResolvedValue(conn);

    const res = await request(app)
      .post('/afiliados/me/consumo-alimento-real')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_ciclo: 100, num_comida: 1, id_alimento: 3, fecha: '2026-08-30', cantidad_g_consumida: 150 });

    expect(res.status).toBe(201);
    expect(Number(res.body.calorias_consumidas)).toBeCloseTo(233.1, 1);
    expect(res.body.message).toMatch(/Consumo de alimento registrado/);
  });

  test('GET /afiliados/me/registro-ejercicio/historial devuelve registros con volumen', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();
    pool.query.mockResolvedValueOnce([[
      { id_registro: 11, fecha: '2026-08-30', nombre_ejercicio: 'Press de banca', series: 4, repeticiones: 10, peso_utilizado_kg: 60, volumen: 2400 },
    ]]);

    const res = await request(app)
      .get('/afiliados/me/registro-ejercicio/historial')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].volumen).toBe(2400);
  });

  test('GET /afiliados/me/consumo-alimento-real/historial devuelve consumos con calorías', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();
    pool.query.mockResolvedValueOnce([[
      { id_consumo: 25, fecha: '2026-08-30', nombre_alimento: 'Huevo entero', cantidad_g_consumida: 150, calorias_consumidas: 233.1 },
    ]]);

    const res = await request(app)
      .get('/afiliados/me/consumo-alimento-real/historial')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('FASE 1 — Progreso diario', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /progreso/resumen sin token devuelve 401', async () => {
    const res = await request(app).get('/progreso/resumen');
    expect(res.status).toBe(401);
  });

  test('GET /progreso/resumen?fecha= sincroniza y devuelve el día', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    // sincronizar: agregados + upsert + lectura
    pool.query.mockResolvedValueOnce([[
      { calorias_consumidas: 233.1, agua_vasos: 8, ejercicios_realizados: 1 },
    ]]);
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    pool.query.mockResolvedValueOnce([[
      { fecha: '2026-08-30', calorias_consumidas: 233.1, agua_vasos: 8, ejercicios_realizados: 1, nivel_energia: 4 },
    ]]);
    // getByFecha
    pool.query.mockResolvedValueOnce([[
      { fecha: '2026-08-30', calorias_consumidas: 233.1, agua_vasos: 8, ejercicios_realizados: 1, nivel_energia: 4 },
    ]]);

    const res = await request(app)
      .get('/progreso/resumen?fecha=2026-08-30')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.agua_vasos).toBe(8);
    expect(res.body.calorias_consumidas).toBe(233.1);
  });

  test('PUT /progreso/resumen actualiza energía y ánimo', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);          // upsert estado
    pool.query.mockResolvedValueOnce([[
      { fecha: '2026-08-30', nivel_energia: 4, estado_animo: 'Bueno', observaciones: 'Sesion completa', duracion_minutos: 65 },
    ]]);

    const res = await request(app)
      .put('/progreso/resumen')
      .set('Authorization', `Bearer ${token}`)
      .send({ fecha: '2026-08-30', nivel_energia: 4, estado_animo: 'Bueno', observaciones: 'Sesion completa', duracion_minutos: 65 });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/actualizado correctamente/);
    expect(res.body.resumen.nivel_energia).toBe(4);
  });

  test('PUT /progreso/resumen sin fecha devuelve 400', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    const res = await request(app)
      .put('/progreso/resumen')
      .set('Authorization', `Bearer ${token}`)
      .send({ nivel_energia: 4 });

    expect(res.status).toBe(400);
  });
});