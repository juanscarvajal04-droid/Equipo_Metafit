'use strict';

// Tests unitarios de PagoModel y CicloModel. Se mockea el pool y las
// conexiones transaccionales para cubrir consultas, filtros y rollback.

jest.mock('../config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const pool = require('../config/db');
const PagoModel = require('../models/pagoModel');
const CicloModel = require('../models/cicloModel');

function makeConn() {
  return {
    query: jest.fn(),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('pagoModel', () => {
  test('findByAfiliado y getUltimo', async () => {
    pool.query.mockResolvedValueOnce([[{ id_pago: 1 }]]);
    await expect(PagoModel.findByAfiliado(2)).resolves.toEqual([{ id_pago: 1 }]);

    pool.query.mockResolvedValueOnce([[{ id_pago: 1 }]]);
    await expect(PagoModel.getUltimo(2)).resolves.toEqual({ id_pago: 1 });

    pool.query.mockResolvedValueOnce([[]]);
    await expect(PagoModel.getUltimo(2)).resolves.toBeNull();
  });

  test('getAll aplica filtros opcionales', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await PagoModel.getAll();
    expect(pool.query.mock.calls[0][0]).not.toContain('WHERE');

    pool.query.mockResolvedValueOnce([[{ id_pago: 1 }]]);
    await PagoModel.getAll({
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-12-31',
      id_recepcionista: 4,
    });
    expect(pool.query.mock.calls[1][0]).toContain(
      'WHERE p.fecha_pago >= ? AND p.fecha_pago <= ? AND p.registrado_por = ?'
    );
    expect(pool.query.mock.calls[1][1]).toEqual([
      '2026-01-01',
      '2026-12-31',
      4,
    ]);
  });

  test('getMetricas devuelve agregados y total numérico', async () => {
    pool.query
      .mockResolvedValueOnce([[{ mes: 10, anio: 2026, total: 100 }]])
      .mockResolvedValueOnce([[{ id_usuario: 4, total_recaudado: 100 }]])
      .mockResolvedValueOnce([[{ total: '100' }]])
      .mockResolvedValueOnce([[{ id_pago: 1 }]]);

    const result = await PagoModel.getMetricas({ fecha_inicio: '2026-01-01' });
    expect(result).toEqual({
      ingresos_por_mes: [{ mes: 10, anio: 2026, total: 100 }],
      pagos_por_recepcionista: [{ id_usuario: 4, total_recaudado: 100 }],
      total_recaudado: 100,
      ultimos_pagos: [{ id_pago: 1 }],
    });
  });

  test('create respeta fecha_vencimiento o suma 30 días', async () => {
    pool.query.mockResolvedValue([{ insertId: 5 }]);

    const explicit = await PagoModel.create(2, {
      fecha_pago: '2026-10-01',
      fecha_vencimiento: '2026-12-01',
      valor_pagado: 90000,
      estado: 'Pagado',
      registrado_por: 4,
    });
    expect(explicit).toEqual({ id_pago: 5, fecha_vencimiento: '2026-12-01' });

    const calculated = await PagoModel.create(2, { fecha_pago: '2026-10-01' });
    expect(calculated.fecha_vencimiento).toBe('2026-10-31');
    expect(pool.query.mock.calls[1][1]).toEqual([
      2,
      '2026-10-01',
      80000,
      'Pagado',
      '2026-10-31',
      null,
      null,
    ]);
  });
});

describe('cicloModel', () => {
  test('findByAfiliado y findById', async () => {
    pool.query.mockResolvedValueOnce([[{ id_ciclo: 1 }]]);
    await expect(CicloModel.findByAfiliado(2)).resolves.toEqual([{ id_ciclo: 1 }]);
    expect(pool.query.mock.calls[0][0]).toContain('entrenador_foto');

    pool.query.mockResolvedValueOnce([[{ id_ciclo: 1 }]]);
    await expect(CicloModel.findById(1)).resolves.toEqual({ id_ciclo: 1 });

    pool.query.mockResolvedValueOnce([[]]);
    await expect(CicloModel.findById(9)).resolves.toBeNull();
  });

  test('create hace commit y devuelve el id', async () => {
    const conn = makeConn();
    conn.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ insertId: 10 }]);
    pool.getConnection.mockResolvedValue(conn);

    const id = await CicloModel.create({
      id_usuario: 2,
      fecha_inicio: '2026-10-01',
      fecha_fin: '2026-10-31',
      objetivo_fisico: 'Fuerza',
      nivel_experiencia: 'Intermedio',
      disponibilidad_dias: 4,
      registrado_por: 1,
    });
    expect(id).toBe(10);
    expect(conn.beginTransaction).toHaveBeenCalled();
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('create hace rollback si falla la inserción', async () => {
    const conn = makeConn();
    conn.query.mockResolvedValueOnce([{}]).mockRejectedValueOnce(new Error('db'));
    pool.getConnection.mockResolvedValue(conn);

    await expect(CicloModel.create({ id_usuario: 2 })).rejects.toThrow('db');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('update arma sets y devuelve 0 sin campos', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const affected = await CicloModel.update(1, {
      activo: 1,
      fecha_inicio: '2026-10-01',
      fecha_fin: '2026-10-31',
      objetivo_fisico: 'Fuerza',
      nivel_experiencia: 'Intermedio',
      disponibilidad_dias: 4,
      grupo_muscular_prioritario: 'Pierna',
      observaciones: null,
    });
    expect(affected).toBe(1);
    expect(pool.query.mock.calls[0][0]).toContain('disponibilidad_dias=?');

    await expect(CicloModel.update(1, {})).resolves.toBe(0);
  });

  test('remove borra hijos en transacción y hace rollback al fallar', async () => {
    const conn = makeConn();
    conn.query.mockResolvedValue([{ affectedRows: 1 }]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(CicloModel.remove(1)).resolves.toBe(1);
    expect(conn.beginTransaction).toHaveBeenCalled();
    expect(conn.query.mock.calls.some(([sql]) => sql.includes('NOTA_EJERCICIO'))).toBe(true);
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();

    const failConn = makeConn();
    failConn.query.mockRejectedValueOnce(new Error('fk'));
    pool.getConnection.mockResolvedValue(failConn);
    await expect(CicloModel.remove(2)).rejects.toThrow('fk');
    expect(failConn.rollback).toHaveBeenCalled();
    expect(failConn.release).toHaveBeenCalled();
  });
});
