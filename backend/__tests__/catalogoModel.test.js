'use strict';

// Tests unitarios del modelo de catálogo. Se mockea el pool MySQL y se
// verifican las consultas y el resamblado de restricciones.

jest.mock('../config/db', () => ({ query: jest.fn() }));

const pool = require('../config/db');
const CatalogoModel = require('../models/catalogoModel');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('catalogoModel - ejercicios', () => {
  test('getAllEjercicios devuelve [] sin filas', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(CatalogoModel.getAllEjercicios()).resolves.toEqual([]);
  });

  test('getAllEjercicios adjunta restricciones excluidas', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_ejercicio: 1, nombre_ejercicio: 'Sentadilla' }]])
      .mockResolvedValueOnce([[
        {
          id_ejercicio: 1,
          id_restriccion: 2,
          nombre_restriccion: 'Rodilla',
          tipo_restriccion: 'Lesion',
        },
      ]]);
    const result = await CatalogoModel.getAllEjercicios();
    expect(result[0].restricciones_excluidas).toEqual([
      { id_restriccion: 2, nombre_restriccion: 'Rodilla', tipo_restriccion: 'Lesion' },
    ]);
  });

  test('createEjercicio inserta con descripción opcional', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 8 }]);
    const id = await CatalogoModel.createEjercicio({
      nombre_ejercicio: 'Press',
      grupo_muscular: 'Pecho',
      nivel_minimo: 'Principiante',
    });
    expect(id).toBe(8);
    expect(pool.query.mock.calls[0][1][2]).toBeNull();
  });

  test('updateEjercicio y deleteEjercicio devuelven affectedRows', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(
      CatalogoModel.updateEjercicio(1, {
        nombre_ejercicio: 'Press',
        grupo_muscular: 'Pecho',
        nivel_minimo: 'Principiante',
      })
    ).resolves.toBe(1);

    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(CatalogoModel.deleteEjercicio(1)).resolves.toBe(0);
  });
});

describe('catalogoModel - alimentos y restricciones', () => {
  test('CRUD de alimentos', async () => {
    pool.query.mockResolvedValueOnce([[{ id_alimento: 1 }]]);
    await expect(CatalogoModel.getAllAlimentos()).resolves.toEqual([{ id_alimento: 1 }]);

    pool.query.mockResolvedValueOnce([{ insertId: 3 }]);
    await expect(
      CatalogoModel.createAlimento({
        nombre_alimento: 'Pollo',
        proteinas: 20,
        carbohidratos: 0,
        grasas: 5,
      })
    ).resolves.toBe(3);

    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(
      CatalogoModel.updateAlimento(3, {
        nombre_alimento: 'Pollo',
        proteinas: 20,
        carbohidratos: 0,
        grasas: 5,
      })
    ).resolves.toBe(1);

    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(CatalogoModel.deleteAlimento(3)).resolves.toBe(1);
  });

  test('CRUD de restricciones', async () => {
    pool.query.mockResolvedValueOnce([[{ id_restriccion: 1 }]]);
    await expect(CatalogoModel.getAllRestricciones()).resolves.toEqual([{ id_restriccion: 1 }]);

    pool.query.mockResolvedValueOnce([{ insertId: 4 }]);
    await expect(
      CatalogoModel.createRestriccion({ nombre_restriccion: 'Asma', tipo: 'Enfermedad' })
    ).resolves.toBe(4);

    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(
      CatalogoModel.updateRestriccion(4, { nombre_restriccion: 'Asma', tipo: 'Enfermedad' })
    ).resolves.toBe(1);

    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(CatalogoModel.deleteRestriccion(4)).resolves.toBe(1);
  });

  test('restricciones por afiliado: listar, agregar y quitar', async () => {
    pool.query.mockResolvedValueOnce([[{ id_restriccion: 1 }]]);
    await expect(CatalogoModel.getRestriccionesByAfiliado(1)).resolves.toEqual([
      { id_restriccion: 1 },
    ]);

    pool.query.mockResolvedValueOnce([{}]);
    await expect(CatalogoModel.addRestriccionToAfiliado(1, 2)).resolves.toBeUndefined();

    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(CatalogoModel.removeRestriccionFromAfiliado(1, 2)).resolves.toBe(1);
  });
});

describe('catalogoModel - disponibilidad, progreso y dashboard', () => {
  test('catálogos disponibles por afiliado', async () => {
    pool.query.mockResolvedValueOnce([[{ id_ejercicio: 1 }]]);
    await expect(CatalogoModel.getEjerciciosDisponibles(1)).resolves.toEqual([
      { id_ejercicio: 1 },
    ]);

    pool.query.mockResolvedValueOnce([[{ id_alimento: 1 }]]);
    await expect(CatalogoModel.getAlimentosDisponibles(1)).resolves.toEqual([
      { id_alimento: 1 },
    ]);
  });

  test('progreso físico: listar y crear con peso legacy', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
    await expect(CatalogoModel.getProgresoByAfiliado(1)).resolves.toEqual([{ id: 1 }]);

    pool.query.mockResolvedValueOnce([{}]);
    await CatalogoModel.createProgreso(
      { id_ciclo: 1, fecha_registro: '2026-10-01', peso: 75 },
      9
    );
    expect(pool.query.mock.calls[1][1]).toEqual([
      1,
      '2026-10-01',
      75,
      null,
      null,
      null,
      null,
      null,
      9,
    ]);
  });

  test('getDashboardKPIs combina KPIs y objetivos', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total_afiliados: 3, ingresos: 100 }]])
      .mockResolvedValueOnce([[{ objetivo: 'Fuerza', cantidad: 2 }]]);
    await expect(CatalogoModel.getDashboardKPIs()).resolves.toEqual({
      total_afiliados: 3,
      ingresos: 100,
      por_objetivo: [{ objetivo: 'Fuerza', cantidad: 2 }],
    });
  });
});
