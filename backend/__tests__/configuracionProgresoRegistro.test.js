'use strict';

// Tests unitarios de los modelos pequeños: configuración, progreso diario y
// registro de ejercicios. Pool mockeado.

jest.mock('../config/db', () => ({ query: jest.fn() }));

const pool = require('../config/db');
const ConfiguracionModel = require('../models/configuracionModel');
const ProgresoDiarioModel = require('../models/progresoDiarioModel');
const RegistroEjercicioModel = require('../models/registroEjercicioModel');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('configuracionModel', () => {
  test('get devuelve el valor o null', async () => {
    pool.query.mockResolvedValueOnce([[{ valor: '80000' }]]);
    await expect(ConfiguracionModel.get('precio')).resolves.toBe('80000');

    pool.query.mockResolvedValueOnce([[]]);
    await expect(ConfiguracionModel.get('otra')).resolves.toBeNull();
  });

  test('set hace upsert', async () => {
    pool.query.mockResolvedValueOnce([{}]);
    await ConfiguracionModel.set('precio', '90000');
    expect(pool.query.mock.calls[0][0]).toContain('ON DUPLICATE KEY UPDATE');
    expect(pool.query.mock.calls[0][1]).toEqual(['precio', '90000', '90000']);
  });
});

describe('progresoDiarioModel.sincronizar', () => {
  test('usa la conexión recibida y devuelve la fila actualizada', async () => {
    const conn = {
      query: jest.fn()
        .mockResolvedValueOnce([[{ calorias_consumidas: 1800, agua_vasos: 8, ejercicios_realizados: 2 }]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ id_progreso_diario: 1, fecha: '2026-10-21' }]]),
    };

    const res = await ProgresoDiarioModel.sincronizar(conn, 7, '2026-10-21');
    expect(res).toEqual({ id_progreso_diario: 1, fecha: '2026-10-21' });
    expect(conn.query).toHaveBeenCalledTimes(3);
    expect(conn.query.mock.calls[1][1]).toEqual([7, '2026-10-21', 1800, 8, 2]);
  });

  test('sin conexión usa el pool y devuelve fallback si no hay fila', async () => {
    pool.query
      .mockResolvedValueOnce([[{ calorias_consumidas: 0, agua_vasos: 0, ejercicios_realizados: 0 }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[]]);

    await expect(ProgresoDiarioModel.sincronizar(null, 7, '2026-10-21')).resolves.toEqual({
      id_usuario: 7,
      fecha: '2026-10-21',
    });
  });
});

describe('progresoDiarioModel.guardarEstado', () => {
  test('normaliza falsy a null y devuelve la fila', async () => {
    pool.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[{ id_usuario: 7, nivel_energia: 4 }]]);

    const res = await ProgresoDiarioModel.guardarEstado(7, '2026-10-21', {
      nivel_energia: 0,
      estado_animo: '',
      observaciones: null,
      duracion_minutos: undefined,
    });
    expect(res).toEqual({ id_usuario: 7, nivel_energia: 4 });
    expect(pool.query.mock.calls[0][1]).toEqual([7, '2026-10-21', null, null, null, null]);
  });

  test('conserva valores enviados', async () => {
    pool.query.mockResolvedValueOnce([{}]).mockResolvedValueOnce([[{ id_usuario: 7 }]]);
    await ProgresoDiarioModel.guardarEstado(7, '2026-10-21', {
      nivel_energia: 4,
      estado_animo: 'Bien',
      observaciones: 'ok',
      duracion_minutos: 45,
    });
    expect(pool.query.mock.calls[0][1]).toEqual([7, '2026-10-21', 4, 'Bien', 'ok', 45]);
  });
});

describe('progresoDiarioModel.getByFecha / getHistorial', () => {
  test('getByFecha devuelve la fila o undefined', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
    await expect(ProgresoDiarioModel.getByFecha(7, '2026-10-21')).resolves.toEqual({ id: 1 });

    pool.query.mockResolvedValueOnce([[]]);
    await expect(ProgresoDiarioModel.getByFecha(7, '2026-10-20')).resolves.toBeUndefined();
  });

  test('getHistorial sin filtros', async () => {
    pool.query.mockResolvedValueOnce([[{ fecha: '2026-10-21' }]]);
    await ProgresoDiarioModel.getHistorial(7, {});
    expect(pool.query.mock.calls[0][0]).not.toContain('fecha >=');
    expect(pool.query.mock.calls[0][1]).toEqual([7]);
  });

  test('getHistorial con fechaInicio y fechaFin', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await ProgresoDiarioModel.getHistorial(7, {
      fechaInicio: '2026-01-01',
      fechaFin: '2026-12-31',
    });
    expect(pool.query.mock.calls[0][0]).toContain('fecha >= ?');
    expect(pool.query.mock.calls[0][0]).toContain('fecha <= ?');
    expect(pool.query.mock.calls[0][1]).toEqual([7, '2026-01-01', '2026-12-31']);
  });
});

describe('registroEjercicioModel', () => {
  test('insertar usa nulls para peso y notas y devuelve insertId', async () => {
    const conn = { query: jest.fn().mockResolvedValue([{ insertId: 44 }]) };
    const id = await RegistroEjercicioModel.insertar(conn, {
      id_usuario: 7,
      id_ciclo: 2,
      id_rutina: 3,
      orden: 1,
      fecha: '2026-10-21',
      series: 4,
      repeticiones: 12,
    });
    expect(id).toBe(44);
    expect(conn.query.mock.calls[0][1]).toEqual([7, 2, 3, 1, '2026-10-21', 4, 12, null, null]);
  });

  test('insertar conserva peso y notas', async () => {
    const conn = { query: jest.fn().mockResolvedValue([{ insertId: 45 }]) };
    await RegistroEjercicioModel.insertar(conn, {
      id_usuario: 7,
      id_ciclo: 2,
      id_rutina: 3,
      orden: 1,
      fecha: '2026-10-21',
      series: 4,
      repeticiones: 12,
      peso_utilizado_kg: 40,
      notas: 'ok',
    });
    expect(conn.query.mock.calls[0][1].slice(-2)).toEqual([40, 'ok']);
  });

  test('getHistorial sin filtros opcionales', async () => {
    pool.query.mockResolvedValueOnce([[{ id_registro: 1 }]]);
    await RegistroEjercicioModel.getHistorial(7, {});
    expect(pool.query.mock.calls[0][0]).not.toContain('re.id_ciclo = ?');
    expect(pool.query.mock.calls[0][1]).toEqual([7]);
  });

  test('getHistorial con todos los filtros', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await RegistroEjercicioModel.getHistorial(7, {
      id_ciclo: 2,
      fechaInicio: '2026-01-01',
      fechaFin: '2026-12-31',
    });
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('re.id_ciclo = ?');
    expect(sql).toContain('re.fecha >= ?');
    expect(sql).toContain('re.fecha <= ?');
    expect(params).toEqual([7, 2, '2026-01-01', '2026-12-31']);
  });

  test('getEvolucion sin y con fechas', async () => {
    pool.query.mockResolvedValue([[]]);

    await RegistroEjercicioModel.getEvolucion(7, 3, {});
    expect(pool.query.mock.calls[0][1]).toEqual([7, 3]);

    await RegistroEjercicioModel.getEvolucion(7, 3, {
      fechaInicio: '2026-01-01',
      fechaFin: '2026-02-01',
    });
    expect(pool.query.mock.calls[1][0]).toContain('re.fecha >= ?');
    expect(pool.query.mock.calls[1][1]).toEqual([7, 3, '2026-01-01', '2026-02-01']);
  });
});
