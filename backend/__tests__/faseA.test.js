// backend/__tests__/faseA.test.js
// FASE A — A.1 PATCH /afiliados/me (perfil propio: peso, talla, teléfono, correo),
// A.2 macronutrientes en CONSUMO_ALIMENTO_REAL (Atwater),
// A.3 rutina del día filtrada por grupo muscular.
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

// Comodín: conexión transaccional para operaciones que usan getConnection.
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

function tokenAdmin(sub = 1) {
  return jwt.sign(
    { sub, email: 'admin@metafit.com', role: 'Administrador' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('FASE A.1 — PATCH /afiliados/me (perfil propio)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PATCH /afiliados/me sin token devuelve 401', async () => {
    const res = await request(app)
      .patch('/afiliados/me')
      .send({ peso: 80 });
    expect(res.status).toBe(401);
  });

  test('PATCH /afiliados/me actualiza correo, teléfono, talla y peso (con IMC)', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    // Unicidad de correo: no existe otro usuario con ese correo
    pool.query.mockResolvedValueOnce([[]]);

    const secuencia = [
      [{ affectedRows: 1 }],                       // UPDATE AFILIADO (telefono/estatura_cm)
      [{ affectedRows: 1 }],                       // UPDATE USUARIO (correo)
      [[{ id_ciclo: 5 }]],                         // ciclo activo para el peso
      [{ affectedRows: 1 }],                       // upsert PROGRESO_FISICO de hoy
    ];
    const conn = conexionFalsa({ secuencia });
    pool.getConnection = jest.fn().mockResolvedValue(conn);

    // getMeData → recalcular IMC (80 kg / 1.75 m² = 26.12)
    pool.query.mockResolvedValueOnce([[{
      id_usuario: 100,
      telefono: '3001234567',
      estatura_cm: 175,
      correo: 'carlos.nuevo@test.com',
      peso_kg: 80,
    }]]);

    const res = await request(app)
      .patch('/afiliados/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ peso: 80, talla: 175, telefono: '3001234567', correo: 'carlos.nuevo@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Perfil actualizado/);
    expect(Number(res.body.imc)).toBeCloseTo(26.12, 1);
    expect(res.body.perfil.correo).toBe('carlos.nuevo@test.com');
    expect(res.body.perfil.peso_kg).toBe(80);
    expect(conn.beginTransaction).toHaveBeenCalled();
    expect(conn.commit).toHaveBeenCalled();
  });

  test('PATCH /afiliados/me con correo en uso por otro devuelve 409', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();
    pool.query.mockResolvedValueOnce([[
      { id_usuario: 200, correo: 'tomado@test.com', rol: 'Afiliado', estado: 'Activo' },
    ]]); // findByEmail → pertenece a OTRO usuario

    const res = await request(app)
      .patch('/afiliados/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ correo: 'tomado@test.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya está en uso/);
  });

  test('PATCH /afiliados/me con peso fuera de rango devuelve 400', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    const res = await request(app)
      .patch('/afiliados/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ peso: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/20 y 300 kg/);
  });

  test('PATCH /afiliados/me con correo inválido devuelve 400', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    const res = await request(app)
      .patch('/afiliados/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ correo: 'correo-mal-escrito' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/correo inválido/);
  });

  test('PATCH /afiliados/me con peso pero sin ciclo activo devuelve 400', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    const secuencia = [
      [{ affectedRows: 1 }],                       // UPDATE AFILIADO (talla)
      [[]],                                        // sin ciclo activo → SIN_CICLO_ACTIVO
    ];
    const conn = conexionFalsa({ secuencia });
    pool.getConnection = jest.fn().mockResolvedValue(conn);

    const res = await request(app)
      .patch('/afiliados/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ peso: 80, talla: 175 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ciclo activo/);
    expect(conn.rollback).toHaveBeenCalled();
  });

  test('PATCH /afiliados/me sin campos devuelve 400', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    const res = await request(app)
      .patch('/afiliados/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('FASE A.2 — Macronutrientes en CONSUMO_ALIMENTO_REAL', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST consumo-alimento-real devuelve calorías y macros Atwater', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    pool.query.mockResolvedValueOnce([[{ id_ciclo: 100, id_usuario: 100 }]]); // verificarCicloDe

    // Huevo entero (P13, C1.1, G11) x 150 g → 233.1 kcal, 19.5g P, 1.65g C, 16.5g G
    const secuencia = [
      [{ affectedRows: 1, insertId: 25 }],
      [[{
        calorias_consumidas: 233.1,
        proteinas_consumidas: 19.5,
        carbohidratos_consumidos: 1.65,
        grasas_consumidas: 16.5,
      }]],
      [[{ calorias_consumidas: 233.1, proteinas_consumidas: 19.5, agua_vasos: 0, ejercicios_realizados: 0 }]],
      [{ affectedRows: 1 }],
      [[{ id_usuario: 100, calorias_consumidas: 233.1 }]],
    ];
    const conn = conexionFalsa({ secuencia });
    pool.getConnection = jest.fn().mockResolvedValue(conn);

    const res = await request(app)
      .post('/afiliados/me/consumo-alimento-real')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_ciclo: 100, num_comida: 1, id_alimento: 3, fecha: '2026-08-30', cantidad_g_consumida: 150 });

    expect(res.status).toBe(201);
    expect(Number(res.body.calorias_consumidas)).toBeCloseTo(233.1, 1);
    expect(Number(res.body.proteinas_consumidas)).toBeCloseTo(19.5, 1);
    expect(Number(res.body.carbohidratos_consumidos)).toBeCloseTo(1.65, 1);
    expect(Number(res.body.grasas_consumidas)).toBeCloseTo(16.5, 1);
  });

  test('GET historial de consumos devuelve macros por registro', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();
    pool.query.mockResolvedValueOnce([[
      {
        id_consumo: 25,
        fecha: '2026-08-30',
        nombre_alimento: 'Huevo entero',
        cantidad_g_consumida: 150,
        calorias_consumidas: 233.1,
        proteinas_consumidas: 19.5,
        carbohidratos_consumidos: 1.65,
        grasas_consumidas: 16.5,
      },
    ]]);

    const res = await request(app)
      .get('/afiliados/me/consumo-alimento-real/historial')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].proteinas_consumidas).toBe(19.5);
    expect(res.body[0].grasas_consumidas).toBe(16.5);
  });
});

describe('FASE A.3 — Rutina del día filtrada por grupo muscular', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET rutina/:dia_numero sin token devuelve 401', async () => {
    const res = await request(app)
      .get('/planes/entrenamiento/8/rutina/2');
    expect(res.status).toBe(401);
  });

  test('GET rutina/:dia_numero con admin filtra solo el grupo del día', async () => {
    pool.query.mockResolvedValueOnce([[
      {
        id_rutina: 23,
        nombre_rutina: 'Espalda y bíceps',
        enfoque_muscular: 'Espalda',
        dia_numero: 2,
        ejercicios: JSON.stringify([
          { orden: 1, id_ejercicio: 31, nombre_ejercicio: 'Dominadas', grupo_muscular: 'Espalda', series: 4, repeticiones: 10, peso_kg: null, descanso_seg: 90, instrucciones: null },
          { orden: 2, id_ejercicio: 32, nombre_ejercicio: 'Curl de bíceps', grupo_muscular: 'Bíceps', series: 3, repeticiones: 12, peso_kg: 10, descanso_seg: 60, instrucciones: null },
        ]),
      },
    ]]);

    const res = await request(app)
      .get('/planes/entrenamiento/8/rutina/2')
      .set('Authorization', `Bearer ${tokenAdmin()}`);

    expect(res.status).toBe(200);
    expect(res.body.enfoque_muscular).toBe('Espalda');
    expect(res.body.ejercicios).toHaveLength(1);
    expect(res.body.ejercicios[0].nombre_ejercicio).toBe('Dominadas');
    expect(res.body.ejercicios[0].grupo_muscular).toBe('Espalda');
  });

  test('GET rutina/:dia_numero con afiliado dueño del ciclo filtra por enfoque', async () => {
    const token = await loginAfiliado();
    pool.query.mockReset();

    // requireOwnCiclo → CicloModel.findById → ciclo del afiliado (id_usuario=100)
    pool.query.mockResolvedValueOnce([[{ id_ciclo: 8, id_usuario: 100 }]]);

    pool.query.mockResolvedValueOnce([[
      {
        id_rutina: 24,
        nombre_rutina: 'Cardio',
        enfoque_muscular: 'Pecho',
        dia_numero: 3,
        ejercicios: JSON.stringify([
          { orden: 1, id_ejercicio: 41, nombre_ejercicio: 'Press de banca', grupo_muscular: 'Pecho', series: 4, repeticiones: 8, peso_kg: 40, descanso_seg: 90, instrucciones: null },
          { orden: 2, id_ejercicio: 42, nombre_ejercicio: 'Sentadilla', grupo_muscular: 'Pierna', series: 3, repeticiones: 12, peso_kg: 60, descanso_seg: 60, instrucciones: null },
        ]),
      },
    ]]);

    const res = await request(app)
      .get('/planes/entrenamiento/8/rutina/3?grupo_muscular=Pecho')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ejercicios).toHaveLength(1);
    expect(res.body.ejercicios[0].nombre_ejercicio).toBe('Press de banca');
  });

  test('GET rutina/:dia_numero con día inválido devuelve 400', async () => {
    const res = await request(app)
      .get('/planes/entrenamiento/8/rutina/9')
      .set('Authorization', `Bearer ${tokenAdmin()}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/entre 1 y 7/);
  });

  test('GET rutina/:dia_numero sin rutina ese día devuelve 404', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/planes/entrenamiento/8/rutina/6')
      .set('Authorization', `Bearer ${tokenAdmin()}`);

    expect(res.status).toBe(404);
  });

  test('GET rutina/:dia_numero muestra TODA la rutina si ningún ejercicio coincide (fallback)', async () => {
    pool.query.mockResolvedValueOnce([[
      {
        id_rutina: 25,
        nombre_rutina: 'Espalda',
        enfoque_muscular: 'Espalda',
        dia_numero: 4,
        ejercicios: JSON.stringify([
          { orden: 1, id_ejercicio: 51, nombre_ejercicio: 'Press de banca', grupo_muscular: 'Pecho', series: 4, repeticiones: 8, peso_kg: 40, descanso_seg: 90, instrucciones: null },
          { orden: 2, id_ejercicio: 52, nombre_ejercicio: 'Sentadilla', grupo_muscular: 'Piernas', series: 3, repeticiones: 12, peso_kg: 60, descanso_seg: 60, instrucciones: null },
        ]),
      },
    ]]);

    const res = await request(app)
      .get('/planes/entrenamiento/8/rutina/4')
      .set('Authorization', `Bearer ${tokenAdmin()}`);

    expect(res.status).toBe(200);
    expect(res.body.ejercicios).toHaveLength(2);
    expect(res.body.ejercicios[0].nombre_ejercicio).toBe('Press de banca');
    expect(res.body.ejercicios[1].nombre_ejercicio).toBe('Sentadilla');
  });
});