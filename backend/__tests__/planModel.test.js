'use strict';

// Tests unitarios de PlanModel: entrenamiento, rutinas y plan nutricional.
// El pool y las conexiones transaccionales están mockeados.

jest.mock('../config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const pool = require('../config/db');
const PlanModel = require('../models/planModel');

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

describe('planModel.getEntrenamientoByCiclo', () => {
  test('devuelve null cuando el ciclo no tiene plan', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(PlanModel.getEntrenamientoByCiclo(5)).resolves.toBeNull();
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('parsea ejercicios en string JSON y filtra nulos', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_ciclo: 5, observaciones: 'ok' }]])
      .mockResolvedValueOnce([[
        {
          id_rutina: 1,
          ejercicios: JSON.stringify([
            { id_ejercicio: 3, orden: 2 },
            null,
            { id_ejercicio: null },
          ]),
        },
        {
          id_rutina: 2,
          ejercicios: [{ id_ejercicio: 4, orden: 1 }],
        },
      ]]);

    const plan = await PlanModel.getEntrenamientoByCiclo(5);
    expect(plan.id_ciclo).toBe(5);
    expect(plan.rutinas).toHaveLength(2);
    expect(plan.rutinas[0].ejercicios).toEqual([{ id_ejercicio: 3, orden: 2 }]);
    expect(plan.rutinas[1].ejercicios).toEqual([{ id_ejercicio: 4, orden: 1 }]);
  });

  test('tolera rutinas sin ejercicios (null)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_ciclo: 5 }]])
      .mockResolvedValueOnce([[{ id_rutina: 1, ejercicios: null }]]);

    const plan = await PlanModel.getEntrenamientoByCiclo(5);
    expect(plan.rutinas[0].ejercicios).toEqual([]);
  });
});

describe('planModel.getRutinaDiaria', () => {
  test('devuelve null si no existe rutina para el día', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(PlanModel.getRutinaDiaria(5, 2)).resolves.toBeNull();
  });

  test('ordena y filtra por el enfoque muscular de la rutina', async () => {
    pool.query.mockResolvedValueOnce([[
      {
        id_rutina: 9,
        enfoque_muscular: 'Pierna',
        dia_numero: 2,
        ejercicios: JSON.stringify([
          { id_ejercicio: 1, grupo_muscular: 'Pierna', orden: 2 },
          { id_ejercicio: 2, grupo_muscular: 'Pecho', orden: 1 },
          { id_ejercicio: 3, grupo_muscular: 'pierna', orden: 1 },
        ]),
      },
    ]]);

    const rutina = await PlanModel.getRutinaDiaria(5, 2);
    expect(rutina.ejercicios.map((e) => e.id_ejercicio)).toEqual([3, 1]);
  });

  test('acepta un grupo_muscular explícito', async () => {
    pool.query.mockResolvedValueOnce([[
      {
        id_rutina: 9,
        enfoque_muscular: 'Pierna',
        ejercicios: [
          { id_ejercicio: 1, grupo_muscular: 'Pecho', orden: 1 },
          { id_ejercicio: 2, grupo_muscular: 'Pierna', orden: 2 },
        ],
      },
    ]]);

    const rutina = await PlanModel.getRutinaDiaria(5, 2, 'Pecho');
    expect(rutina.ejercicios).toEqual([{ id_ejercicio: 1, grupo_muscular: 'Pecho', orden: 1 }]);
  });

  test('fallback: si nada coincide devuelve todos los ejercicios', async () => {
    pool.query.mockResolvedValueOnce([[
      {
        id_rutina: 9,
        enfoque_muscular: 'Core',
        ejercicios: [
          { id_ejercicio: 1, grupo_muscular: 'Pecho', orden: 2 },
          { id_ejercicio: 2, grupo_muscular: 'Pierna', orden: 1 },
        ],
      },
    ]]);

    const rutina = await PlanModel.getRutinaDiaria(5, 2);
    expect(rutina.ejercicios.map((e) => e.id_ejercicio)).toEqual([2, 1]);
  });
});

describe('planModel CRUD entrenamiento/rutinas', () => {
  test('createEntrenamiento usa nulls por defecto', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 11 }]);
    await expect(PlanModel.createEntrenamiento(5)).resolves.toBe(11);
    expect(pool.query.mock.calls[0][1]).toEqual([5, null, null]);
  });

  test('updateEntrenamiento devuelve affectedRows', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(PlanModel.updateEntrenamiento(5, { observaciones: 'nuevo' }, 2)).resolves.toBe(1);
    expect(pool.query.mock.calls[0][1]).toEqual([2, 'nuevo', 5]);
  });

  test('createRutina devuelve insertId', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 20 }]);
    await expect(PlanModel.createRutina(5, 'Día 1', 'Pecho', 1)).resolves.toBe(20);
  });

  test('addEjercicioToRutina ejecuta el insert', async () => {
    pool.query.mockResolvedValueOnce([{}]);
    await PlanModel.addEjercicioToRutina(20, 3, 4, 12, 1);
    expect(pool.query.mock.calls[0][1]).toEqual([20, 1, 3, 4, 12]);
  });

  test('removeEjercicioFromRutina devuelve affectedRows', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(PlanModel.removeEjercicioFromRutina(20, 3)).resolves.toBe(1);
  });

  test('updateEjercicioEnRutina arma todos los sets', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 2 }]);
    const affected = await PlanModel.updateEjercicioEnRutina(20, 3, {
      series: 4,
      repeticiones: 12,
      peso_kg: 40,
      descanso_seg: 60,
    });
    expect(affected).toBe(2);
    expect(pool.query.mock.calls[0][0]).toContain('series=?');
    expect(pool.query.mock.calls[0][0]).toContain('descanso_seg=?');
    expect(pool.query.mock.calls[0][1]).toEqual([4, 12, 40, 60, 20, 3]);
  });

  test('updateEjercicioEnRutina actualiza solo los campos enviados', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await PlanModel.updateEjercicioEnRutina(20, 3, { peso_kg: 0 });
    expect(pool.query.mock.calls[0][0]).toBe(
      'UPDATE RUTINA_EJERCICIO SET peso_kg=? WHERE id_rutina=? AND id_ejercicio=?'
    );
  });

  test('updateEjercicioEnRutina devuelve 0 sin campos', async () => {
    await expect(PlanModel.updateEjercicioEnRutina(20, 3, {})).resolves.toBe(0);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('updateDescripcionEjercicio normaliza undefined a null', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(PlanModel.updateDescripcionEjercicio(3, undefined)).resolves.toBe(1);
    expect(pool.query.mock.calls[0][1]).toEqual([null, 3]);
  });

  test('deleteRutina borra ejercicios y rutina en transacción', async () => {
    const conn = makeConn();
    conn.query
      .mockResolvedValueOnce([{ affectedRows: 2 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(PlanModel.deleteRutina(20)).resolves.toBe(1);
    expect(conn.beginTransaction).toHaveBeenCalled();
    expect(conn.query.mock.calls[0][0]).toContain('RUTINA_EJERCICIO');
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('deleteRutina hace rollback ante error', async () => {
    const conn = makeConn();
    conn.query.mockRejectedValueOnce(new Error('fk'));
    pool.getConnection.mockResolvedValue(conn);

    await expect(PlanModel.deleteRutina(20)).rejects.toThrow('fk');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });
});

describe('planModel nutricional', () => {
  test('getNutricionalByCiclo devuelve null sin plan', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    await expect(PlanModel.getNutricionalByCiclo(5)).resolves.toBeNull();
  });

  test('getNutricionalByCiclo agrega el detalle', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id_ciclo: 5, calorias_objetivo: 2000 }]])
      .mockResolvedValueOnce([[{ num_comida: 1, nombre_alimento: 'Arroz' }]]);

    const plan = await PlanModel.getNutricionalByCiclo(5);
    expect(plan.calorias_objetivo).toBe(2000);
    expect(plan.detalle).toEqual([{ num_comida: 1, nombre_alimento: 'Arroz' }]);
  });

  test('createNutricional usa nulls y recomendación por defecto', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 30 }]);
    await expect(PlanModel.createNutricional(5, 2000, 5)).resolves.toBe(30);
    expect(pool.query.mock.calls[0][1]).toEqual([5, 2000, 5, null, null, null]);
  });

  test('updateNutricional incluye recomendación solo si viene definida', async () => {
    pool.query.mockResolvedValue([{ affectedRows: 1 }]);

    await PlanModel.updateNutricional(5, { calorias_objetivo: 1800, num_comidas: 4 }, 2);
    expect(pool.query.mock.calls[0][0]).not.toContain('recomendacion_agua_vasos=?');
    expect(pool.query.mock.calls[0][1]).toEqual([1800, 4, 2, null, 5]);

    await PlanModel.updateNutricional(5, {
      calorias_objetivo: 1900,
      num_comidas: 5,
      observaciones: 'ok',
      recomendacion_agua_vasos: 10,
    }, 2);
    expect(pool.query.mock.calls[1][0]).toContain('recomendacion_agua_vasos=?');
    expect(pool.query.mock.calls[1][1]).toEqual([1900, 5, 2, 'ok', 10, 5]);
  });

  test('clearDetalleNutricional y addAlimentoToDetalle', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 3 }]);
    await expect(PlanModel.clearDetalleNutricional(5)).resolves.toBe(3);

    pool.query.mockResolvedValueOnce([{}]);
    await PlanModel.addAlimentoToDetalle(5, 10, 2, 150);
    expect(pool.query.mock.calls[1][1]).toEqual([5, 2, 10, 150]);
  });

  test('updateAlimentoEnDetalle mueve de comida con transacción', async () => {
    const conn = makeConn();
    conn.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{}]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(PlanModel.updateAlimentoEnDetalle(5, 10, {
      num_comida: 3,
      num_comida_anterior: 1,
    })).resolves.toBe(1);

    expect(conn.beginTransaction).toHaveBeenCalled();
    expect(conn.query.mock.calls[1][1]).toEqual([5, 3, 10, 100]);
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('updateAlimentoEnDetalle devuelve 0 si la fila anterior no existe', async () => {
    const conn = makeConn();
    conn.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    pool.getConnection.mockResolvedValue(conn);

    await expect(PlanModel.updateAlimentoEnDetalle(5, 10, {
      num_comida: 3,
      num_comida_anterior: 1,
    })).resolves.toBe(0);
    expect(conn.query).toHaveBeenCalledTimes(1);
    expect(conn.release).toHaveBeenCalled();
  });

  test('updateAlimentoEnDetalle hace rollback si falla el movimiento', async () => {
    const conn = makeConn();
    conn.query.mockRejectedValueOnce(new Error('db'));
    pool.getConnection.mockResolvedValue(conn);

    await expect(PlanModel.updateAlimentoEnDetalle(5, 10, {
      num_comida: 3,
      num_comida_anterior: 1,
    })).rejects.toThrow('db');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  test('updateAlimentoEnDetalle actualiza cantidad en una comida concreta', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(PlanModel.updateAlimentoEnDetalle(5, 10, {
      cantidad_g: 200,
      num_comida_anterior: 1,
    })).resolves.toBe(1);
    expect(pool.query.mock.calls[0][0]).toContain('num_comida=?');
    expect(pool.query.mock.calls[0][1]).toEqual([200, 5, 1, 10]);
  });

  test('updateAlimentoEnDetalle actualiza todas las comidas sin anterior', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 2 }]);
    await expect(PlanModel.updateAlimentoEnDetalle(5, 10, { cantidad_g: 50 })).resolves.toBe(2);
    expect(pool.query.mock.calls[0][0]).not.toContain('num_comida=?');
    expect(pool.query.mock.calls[0][1]).toEqual([50, 5, 10]);
  });

  test('updateAlimentoEnDetalle devuelve 0 sin cantidad', async () => {
    await expect(PlanModel.updateAlimentoEnDetalle(5, 10, {})).resolves.toBe(0);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('removeAlimentoDeDetalle con y sin num_comida', async () => {
    pool.query.mockResolvedValue([{ affectedRows: 1 }]);

    await expect(PlanModel.removeAlimentoDeDetalle(5, 10, 2)).resolves.toBe(1);
    expect(pool.query.mock.calls[0][0]).toContain('num_comida=?');

    await expect(PlanModel.removeAlimentoDeDetalle(5, 10)).resolves.toBe(1);
    expect(pool.query.mock.calls[1][0]).not.toContain('num_comida=?');
    expect(pool.query.mock.calls[1][1]).toEqual([5, 10]);
  });
});
