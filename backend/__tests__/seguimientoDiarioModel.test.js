'use strict';

// Tests unitarios de SeguimientoDiarioModel: progreso de ejercicios, agua,
// consumo de alimentos e historiales. Sin base de datos real.

jest.mock('../config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const pool = require('../config/db');
const Model = require('../models/seguimientoDiarioModel');

function makeConn() {
  return {
    query: jest.fn().mockResolvedValue([{}]),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('seguimientoDiarioModel.saveProgresoEjercicio', () => {
  test('inserta cada ejercicio, hace commit y libera la conexión', async () => {
    const conn = makeConn();
    pool.getConnection.mockResolvedValue(conn);

    const res = await Model.saveProgresoEjercicio(7, 3, '2026-10-21', [
      { id_ejercicio: 1, completado: true },
      { id_ejercicio: 2, completado: false },
    ]);

    expect(res).toEqual({ message: 'Progreso guardado correctamente' });
    expect(conn.query).toHaveBeenCalledTimes(2);
    expect(conn.query.mock.calls[0][1]).toEqual([7, 3, 1, '2026-10-21', 1]);
    expect(conn.query.mock.calls[1][1]).toEqual([7, 3, 2, '2026-10-21', 0]);
    expect(conn.beginTransaction).toHaveBeenCalled();
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.rollback).not.toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('hace rollback y propaga el error si falla una inserción', async () => {
    const conn = makeConn();
    conn.query.mockRejectedValueOnce(new Error('fk'));
    pool.getConnection.mockResolvedValue(conn);

    await expect(
      Model.saveProgresoEjercicio(7, 3, '2026-10-21', [{ id_ejercicio: 99, completado: 1 }])
    ).rejects.toThrow('fk');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });
});

describe('seguimientoDiarioModel.getProgresoEjercicio', () => {
  test('devuelve las filas de progreso', async () => {
    const rows = [{ id_ejercicio: 1, completado: 1 }];
    pool.query.mockResolvedValueOnce([rows]);

    await expect(Model.getProgresoEjercicio(7, 3, '2026-10-21')).resolves.toEqual(rows);
    expect(pool.query.mock.calls[0][0]).toContain('PROGRESO_EJERCICIO_DIARIO');
    expect(pool.query.mock.calls[0][1]).toEqual([7, 3, '2026-10-21']);
  });
});

describe('seguimientoDiarioModel.agua', () => {
  test('saveAgua hace upsert y devuelve mensaje', async () => {
    pool.query.mockResolvedValueOnce([{}]);

    await expect(Model.saveAgua(7, '2026-10-21', 8)).resolves.toEqual({
      message: 'Agua registrada correctamente',
    });
    expect(pool.query.mock.calls[0][0]).toContain('REGISTRO_AGUA');
    expect(pool.query.mock.calls[0][1]).toEqual([7, '2026-10-21', 8]);
  });

  test('getAgua devuelve la fila o el valor por defecto', async () => {
    pool.query.mockResolvedValueOnce([[{ vasos: 6 }]]);
    await expect(Model.getAgua(7, '2026-10-21')).resolves.toEqual({ vasos: 6 });

    pool.query.mockResolvedValueOnce([[]]);
    await expect(Model.getAgua(7, '2026-10-20')).resolves.toEqual({ vasos: 0 });
  });
});

describe('seguimientoDiarioModel.saveConsumoAlimento', () => {
  test('inserta cada alimento y hace commit', async () => {
    const conn = makeConn();
    pool.getConnection.mockResolvedValue(conn);

    const res = await Model.saveConsumoAlimento(7, 3, '2026-10-21', [
      { id_alimento: 10, num_comida: 1, consumido: true },
      { id_alimento: 11, num_comida: 2, consumido: false },
    ]);

    expect(res).toEqual({ message: 'Consumo guardado correctamente' });
    expect(conn.query).toHaveBeenCalledTimes(2);
    expect(conn.query.mock.calls[0][1]).toEqual([7, 3, 10, 1, '2026-10-21', 1]);
    expect(conn.query.mock.calls[1][1]).toEqual([7, 3, 11, 2, '2026-10-21', 0]);
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('hace rollback si falla la inserción', async () => {
    const conn = makeConn();
    conn.query.mockRejectedValueOnce(new Error('boom'));
    pool.getConnection.mockResolvedValue(conn);

    await expect(
      Model.saveConsumoAlimento(7, 3, '2026-10-21', [{ id_alimento: 1 }])
    ).rejects.toThrow('boom');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });
});

describe('seguimientoDiarioModel historiales', () => {
  test('getAguaHistorial sin filtros usa solo el usuario', async () => {
    pool.query.mockResolvedValueOnce([[{ fecha: '2026-10-21', vasos: 4 }]]);

    const rows = await Model.getAguaHistorial(7);
    expect(rows).toHaveLength(1);
    expect(pool.query.mock.calls[0][0]).not.toContain('fecha >=');
    expect(pool.query.mock.calls[0][0]).not.toContain('fecha <=');
    expect(pool.query.mock.calls[0][1]).toEqual([7]);
  });

  test('getAguaHistorial aplica fechaInicio y fechaFin', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await Model.getAguaHistorial(7, '2026-01-01', '2026-12-31');
    expect(pool.query.mock.calls[0][0]).toContain('fecha >= ?');
    expect(pool.query.mock.calls[0][0]).toContain('fecha <= ?');
    expect(pool.query.mock.calls[0][1]).toEqual([7, '2026-01-01', '2026-12-31']);
  });

  test('getConsumoHistorial sin filtros y con filtros', async () => {
    pool.query.mockResolvedValueOnce([[{ id_alimento: 1 }]]);
    await expect(Model.getConsumoHistorial(7)).resolves.toEqual([{ id_alimento: 1 }]);
    expect(pool.query.mock.calls[0][1]).toEqual([7]);

    pool.query.mockResolvedValueOnce([[]]);
    await Model.getConsumoHistorial(7, '2026-01-01', '2026-01-31');
    expect(pool.query.mock.calls[1][0]).toContain('ca.fecha >= ?');
    expect(pool.query.mock.calls[1][0]).toContain('ca.fecha <= ?');
    expect(pool.query.mock.calls[1][1]).toEqual([7, '2026-01-01', '2026-01-31']);
  });

  test('getProgresoEjercicioHistorial combina todos los filtros', async () => {
    pool.query.mockResolvedValueOnce([[{ id_ejercicio: 2 }]]);

    const rows = await Model.getProgresoEjercicioHistorial(7, 3, '2026-01-01', '2026-02-01');
    expect(rows).toEqual([{ id_ejercicio: 2 }]);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('pe.id_ciclo = ?');
    expect(sql).toContain('pe.fecha >= ?');
    expect(sql).toContain('pe.fecha <= ?');
    expect(params).toEqual([7, 3, '2026-01-01', '2026-02-01']);
  });

  test('getProgresoEjercicioHistorial sin filtros opcionales', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await Model.getProgresoEjercicioHistorial(7);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).not.toContain('pe.id_ciclo = ?');
    expect(sql).not.toContain('pe.fecha >=');
    expect(params).toEqual([7]);
  });
});
