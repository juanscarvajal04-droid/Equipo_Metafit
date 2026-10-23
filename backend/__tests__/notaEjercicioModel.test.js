'use strict';

// Tests unitarios de NotaEjercicioModel: upsert idempotente y CRUD.

jest.mock('../config/db', () => ({ query: jest.fn() }));

const pool = require('../config/db');
const Model = require('../models/notaEjercicioModel');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notaEjercicioModel.create', () => {
  test('actualiza la nota existente y devuelve su id', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_nota: 12 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await expect(Model.create({
      id_usuario: 7,
      id_ejercicio: 3,
      id_ciclo: 2,
      nota: '  subir peso  ',
      fecha_nota: '2026-10-21',
    })).resolves.toBe(12);

    expect(pool.query.mock.calls[0][1]).toEqual([7, 3, 2, '2026-10-21']);
    expect(pool.query.mock.calls[1][0]).toContain('UPDATE NOTA_EJERCICIO');
    expect(pool.query.mock.calls[1][1]).toEqual(['  subir peso  ', 12]);
  });

  test('inserta la nota nueva con fecha por defecto y nota null', async () => {
    pool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 33 }]);

    const id = await Model.create({
      id_usuario: 7,
      id_ejercicio: 3,
      id_ciclo: 2,
    });

    expect(id).toBe(33);
    const params = pool.query.mock.calls[1][1];
    expect(params).toHaveLength(5);
    expect(params.slice(0, 4)).toEqual([7, 3, 2, null]);
    expect(params[4]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('notaEjercicioModel consultas', () => {
  test('findByUsuario devuelve filas con nombre de ejercicio', async () => {
    const rows = [{ id_nota: 1, nombre_ejercicio: 'Sentadilla' }];
    pool.query.mockResolvedValueOnce([rows]);

    await expect(Model.findByUsuario(7)).resolves.toEqual(rows);
    expect(pool.query.mock.calls[0][1]).toEqual([7]);
  });

  test('findByUsuarioYCiclo filtra por ciclo', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await Model.findByUsuarioYCiclo(7, 2);
    expect(pool.query.mock.calls[0][0]).toContain('n.id_ciclo = ?');
    expect(pool.query.mock.calls[0][1]).toEqual([7, 2]);
  });
});

describe('notaEjercicioModel update/remove', () => {
  test('update normaliza nota undefined a null y devuelve affectedRows', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await expect(Model.update(5, 7, undefined)).resolves.toBe(1);
    expect(pool.query.mock.calls[0][1]).toEqual([null, 5, 7]);
  });

  test('remove devuelve affectedRows', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(Model.remove(5, 7)).resolves.toBe(0);
    expect(pool.query.mock.calls[0][1]).toEqual([5, 7]);
  });
});
