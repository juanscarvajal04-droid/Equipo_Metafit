'use strict';

// Tests unitarios del controlador de planes: validaciones, códigos HTTP
// y traducción de errores de MySQL, con el modelo mockeado.

jest.mock('../models/planModel', () => ({
  getEntrenamientoByCiclo: jest.fn(),
  getRutinaDiaria: jest.fn(),
  createEntrenamiento: jest.fn(),
  updateEntrenamiento: jest.fn(),
  createRutina: jest.fn(),
  addEjercicioToRutina: jest.fn(),
  updateEjercicioEnRutina: jest.fn(),
  updateDescripcionEjercicio: jest.fn(),
  removeEjercicioFromRutina: jest.fn(),
  deleteRutina: jest.fn(),
  getNutricionalByCiclo: jest.fn(),
  createNutricional: jest.fn(),
  updateNutricional: jest.fn(),
  addAlimentoToDetalle: jest.fn(),
  updateAlimentoEnDetalle: jest.fn(),
  removeAlimentoDeDetalle: jest.fn(),
}));
jest.mock('../services/pushService', () => ({
  enviarPushAUsuarioDelCiclo: jest.fn().mockResolvedValue({ ok: true }),
}));

const controller = require('../controllers/planController');
const PlanModel = require('../models/planModel');
const { enviarPushAUsuarioDelCiclo } = require('../services/pushService');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeReq(overrides = {}) {
  return {
    params: {},
    query: {},
    body: {},
    user: { sub: 1 },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('planController - entrenamiento', () => {
  test('getEntrenamiento devuelve plan, 404 y 500', async () => {
    PlanModel.getEntrenamientoByCiclo.mockResolvedValueOnce({ id: 1 });
    const ok = makeRes();
    await controller.getEntrenamiento(makeReq({ params: { id_ciclo: '1' } }), ok);
    expect(ok.json).toHaveBeenCalledWith({ id: 1 });

    PlanModel.getEntrenamientoByCiclo.mockResolvedValueOnce(null);
    const notFound = makeRes();
    await controller.getEntrenamiento(makeReq(), notFound);
    expect(notFound.status).toHaveBeenCalledWith(404);

    PlanModel.getEntrenamientoByCiclo.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.getEntrenamiento(makeReq(), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('getRutinaDiaria valida día y devuelve 404', async () => {
    const invalid = makeRes();
    await controller.getRutinaDiaria(makeReq({ params: { dia_numero: '8' } }), invalid);
    expect(invalid.status).toHaveBeenCalledWith(400);

    PlanModel.getRutinaDiaria.mockResolvedValueOnce(null);
    const notFound = makeRes();
    await controller.getRutinaDiaria(makeReq({ params: { dia_numero: '2' } }), notFound);
    expect(notFound.status).toHaveBeenCalledWith(404);

    PlanModel.getRutinaDiaria.mockResolvedValueOnce({ id_rutina: 1 });
    const ok = makeRes();
    await controller.getRutinaDiaria(
      makeReq({
        params: { id_ciclo: '1', dia_numero: '2' },
        query: { grupo_muscular: 'Pierna' },
      }),
      ok
    );
    expect(ok.json).toHaveBeenCalledWith({ id_rutina: 1 });
    expect(PlanModel.getRutinaDiaria).toHaveBeenCalledWith('1', 2, 'Pierna');

    PlanModel.getRutinaDiaria.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.getRutinaDiaria(makeReq({ params: { dia_numero: '2' } }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('createEntrenamiento valida, crea y traduce duplicado', async () => {
    const missing = makeRes();
    await controller.createEntrenamiento(makeReq({ body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(400);

    PlanModel.createEntrenamiento.mockResolvedValueOnce(3);
    const ok = makeRes();
    await controller.createEntrenamiento(
      makeReq({ body: { id_ciclo: 3, observaciones: 'ok' } }),
      ok
    );
    expect(ok.status).toHaveBeenCalledWith(201);
    expect(enviarPushAUsuarioDelCiclo).toHaveBeenCalled();

    PlanModel.createEntrenamiento.mockRejectedValueOnce(
      Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' })
    );
    const dup = makeRes();
    await controller.createEntrenamiento(makeReq({ body: { id_ciclo: 3 } }), dup);
    expect(dup.status).toHaveBeenCalledWith(400);

    PlanModel.createEntrenamiento.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.createEntrenamiento(makeReq({ body: { id_ciclo: 3 } }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('updateEntrenamiento responde éxito y error', async () => {
    PlanModel.updateEntrenamiento.mockResolvedValueOnce({});
    const ok = makeRes();
    await controller.updateEntrenamiento(makeReq({ params: { id: '1' } }), ok);
    expect(ok.json).toHaveBeenCalledWith({ message: 'Plan de entrenamiento actualizado' });

    PlanModel.updateEntrenamiento.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.updateEntrenamiento(makeReq({ params: { id: '1' } }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });
});

describe('planController - rutinas y ejercicios', () => {
  test('createRutina valida campos, día y duplicado', async () => {
    const missing = makeRes();
    await controller.createRutina(makeReq({ body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(400);

    const invalidDay = makeRes();
    await controller.createRutina(
      makeReq({ body: { id_ciclo: 1, nombre_rutina: 'Push', dia_numero: 9 } }),
      invalidDay
    );
    expect(invalidDay.status).toHaveBeenCalledWith(400);

    PlanModel.createRutina.mockResolvedValueOnce(9);
    const ok = makeRes();
    await controller.createRutina(
      makeReq({ body: { id_ciclo: 1, nombre_rutina: 'Push', dia_numero: 1 } }),
      ok
    );
    expect(ok.status).toHaveBeenCalledWith(201);

    PlanModel.createRutina.mockRejectedValueOnce(
      Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' })
    );
    const dup = makeRes();
    await controller.createRutina(
      makeReq({ body: { id_ciclo: 1, nombre_rutina: 'Push', dia_numero: 1 } }),
      dup
    );
    expect(dup.status).toHaveBeenCalledWith(400);

    PlanModel.createRutina.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.createRutina(
      makeReq({ body: { id_ciclo: 1, nombre_rutina: 'Push', dia_numero: 1 } }),
      error
    );
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('addEjercicio valida y traduce duplicado', async () => {
    const missing = makeRes();
    await controller.addEjercicio(makeReq({ body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(400);

    PlanModel.addEjercicioToRutina.mockResolvedValueOnce({});
    const ok = makeRes();
    await controller.addEjercicio(
      makeReq({ body: { id_ejercicio: 1, series: 3, repeticiones: 10, orden: 1 } }),
      ok
    );
    expect(ok.status).toHaveBeenCalledWith(201);

    PlanModel.addEjercicioToRutina.mockRejectedValueOnce(
      Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' })
    );
    const dup = makeRes();
    await controller.addEjercicio(
      makeReq({ body: { id_ejercicio: 1, series: 3, repeticiones: 10, orden: 1 } }),
      dup
    );
    expect(dup.status).toHaveBeenCalledWith(400);
  });

  test('updateEjercicio cubre cantidad, descripción, 404 y errores', async () => {
    const empty = makeRes();
    await controller.updateEjercicio(makeReq({ params: { id_rutina: '1', id_ejercicio: '2' } }), empty);
    expect(empty.status).toHaveBeenCalledWith(400);

    PlanModel.updateEjercicioEnRutina.mockResolvedValueOnce(1);
    PlanModel.updateDescripcionEjercicio.mockResolvedValueOnce({});
    const ok = makeRes();
    await controller.updateEjercicio(
      makeReq({
        params: { id_rutina: '1', id_ejercicio: '2' },
        body: { series: '4', peso_kg: '60', descripcion: 'Técnica' },
      }),
      ok
    );
    expect(ok.json).toHaveBeenCalledWith({ message: 'Ejercicio actualizado correctamente', affected: 1 });

    PlanModel.updateEjercicioEnRutina.mockResolvedValueOnce(0);
    const notFound = makeRes();
    await controller.updateEjercicio(
      makeReq({ params: { id_rutina: '1', id_ejercicio: '2' }, body: { series: 4 } }),
      notFound
    );
    expect(notFound.status).toHaveBeenCalledWith(404);

    PlanModel.updateEjercicioEnRutina.mockRejectedValueOnce(
      Object.assign(new Error('check'), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' })
    );
    const invalid = makeRes();
    await controller.updateEjercicio(
      makeReq({ params: { id_rutina: '1', id_ejercicio: '2' }, body: { series: 4 } }),
      invalid
    );
    expect(invalid.status).toHaveBeenCalledWith(400);

    PlanModel.updateEjercicioEnRutina.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.updateEjercicio(
      makeReq({ params: { id_rutina: '1', id_ejercicio: '2' }, body: { series: 4 } }),
      error
    );
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('removeEjercicio y deleteRutina', async () => {
    PlanModel.removeEjercicioFromRutina.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const notFound = makeRes();
    await controller.removeEjercicio(makeReq(), notFound);
    expect(notFound.status).toHaveBeenCalledWith(404);
    const ok = makeRes();
    await controller.removeEjercicio(makeReq(), ok);
    expect(ok.json).toHaveBeenCalledWith({
      message: 'Ejercicio eliminado de la rutina',
      affected: 1,
    });

    PlanModel.removeEjercicioFromRutina.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.removeEjercicio(makeReq(), error);
    expect(error.status).toHaveBeenCalledWith(500);

    PlanModel.deleteRutina.mockResolvedValueOnce({});
    const okDelete = makeRes();
    await controller.deleteRutina(makeReq(), okDelete);
    expect(okDelete.json).toHaveBeenCalledWith({ message: 'Rutina eliminada correctamente' });

    PlanModel.deleteRutina.mockRejectedValueOnce(new Error('db'));
    const errorDelete = makeRes();
    await controller.deleteRutina(makeReq(), errorDelete);
    expect(errorDelete.status).toHaveBeenCalledWith(500);
  });
});

describe('planController - planes nutricionales', () => {
  test('getNutricional devuelve plan, 404 y 500', async () => {
    PlanModel.getNutricionalByCiclo.mockResolvedValueOnce({ id: 1 });
    const ok = makeRes();
    await controller.getNutricional(makeReq(), ok);
    expect(ok.json).toHaveBeenCalledWith({ id: 1 });

    PlanModel.getNutricionalByCiclo.mockResolvedValueOnce(null);
    const notFound = makeRes();
    await controller.getNutricional(makeReq(), notFound);
    expect(notFound.status).toHaveBeenCalledWith(404);

    PlanModel.getNutricionalByCiclo.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.getNutricional(makeReq(), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('createNutricional acepta alias legacy y traduce errores', async () => {
    const missing = makeRes();
    await controller.createNutricional(makeReq({ body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(400);

    PlanModel.createNutricional.mockResolvedValueOnce(5);
    const ok = makeRes();
    await controller.createNutricional(
      makeReq({
        body: {
          id_ciclo: 1,
          calorias_estimadas: 1800,
          num_comidas_diarias: 5,
          recomendacion_agua_vasos: 8,
        },
      }),
      ok
    );
    expect(ok.status).toHaveBeenCalledWith(201);
    expect(PlanModel.createNutricional.mock.calls[0][5]).toBe(8);
    expect(enviarPushAUsuarioDelCiclo).toHaveBeenCalled();

    const invalidAgua = makeRes();
    await controller.createNutricional(
      makeReq({
        body: {
          id_ciclo: 1,
          calorias_objetivo: 1800,
          num_comidas: 5,
          recomendacion_agua_vasos: 99,
        },
      }),
      invalidAgua
    );
    expect(invalidAgua.status).toHaveBeenCalledWith(400);

    PlanModel.createNutricional.mockRejectedValueOnce(
      Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' })
    );
    const dup = makeRes();
    await controller.createNutricional(
      makeReq({ body: { id_ciclo: 1, calorias_objetivo: 1800, num_comidas: 5 } }),
      dup
    );
    expect(dup.status).toHaveBeenCalledWith(400);

    PlanModel.createNutricional.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.createNutricional(
      makeReq({ body: { id_ciclo: 1, calorias_objetivo: 1800, num_comidas: 5 } }),
      error
    );
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('updateNutricional valida y actualiza', async () => {
    const missing = makeRes();
    await controller.updateNutricional(makeReq({ body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(400);

    PlanModel.updateNutricional.mockResolvedValueOnce({});
    const ok = makeRes();
    await controller.updateNutricional(
      makeReq({
        params: { id: '1' },
        body: {
          calorias_estimadas: 1900,
          num_comidas_diarias: 4,
          recomendacion_agua_vasos: 10,
        },
      }),
      ok
    );
    expect(ok.json).toHaveBeenCalledWith({ message: 'Plan nutricional actualizado' });
    expect(PlanModel.updateNutricional.mock.calls[0][1]).toMatchObject({
      recomendacion_agua_vasos: 10,
    });

    const invalidAgua = makeRes();
    await controller.updateNutricional(
      makeReq({
        params: { id: '1' },
        body: { calorias_objetivo: 1900, num_comidas: 4, recomendacion_agua_vasos: -1 },
      }),
      invalidAgua
    );
    expect(invalidAgua.status).toHaveBeenCalledWith(400);

    PlanModel.updateNutricional.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.updateNutricional(
      makeReq({ body: { calorias_objetivo: 1900, num_comidas: 4 } }),
      error
    );
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('addAlimento valida alias, duplicado y error', async () => {
    const missing = makeRes();
    await controller.addAlimento(makeReq({ body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(400);

    PlanModel.addAlimentoToDetalle.mockResolvedValueOnce({});
    const ok = makeRes();
    await controller.addAlimento(
      makeReq({ body: { id_alimento: 1, numero_comida: 2, cantidad: 150 } }),
      ok
    );
    expect(ok.status).toHaveBeenCalledWith(201);

    PlanModel.addAlimentoToDetalle.mockRejectedValueOnce(
      Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' })
    );
    const dup = makeRes();
    await controller.addAlimento(
      makeReq({ body: { id_alimento: 1, num_comida: 2, cantidad_g: 150 } }),
      dup
    );
    expect(dup.status).toHaveBeenCalledWith(400);

    PlanModel.addAlimentoToDetalle.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.addAlimento(
      makeReq({ body: { id_alimento: 1, num_comida: 2, cantidad_g: 150 } }),
      error
    );
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('updateDetalle cubre validación, 404, duplicado y constraints', async () => {
    const empty = makeRes();
    await controller.updateDetalle(makeReq({ params: { id_plan: '1', id_detalle: '2' } }), empty);
    expect(empty.status).toHaveBeenCalledWith(400);

    PlanModel.updateAlimentoEnDetalle.mockResolvedValueOnce(1);
    const ok = makeRes();
    await controller.updateDetalle(
      makeReq({
        params: { id_plan: '1', id_detalle: '2' },
        body: { cantidad_gramos: 200, num_comida: 3, num_comida_anterior: 2 },
      }),
      ok
    );
    expect(ok.json).toHaveBeenCalledWith({ message: 'Detalle nutricional actualizado', affected: 1 });

    PlanModel.updateAlimentoEnDetalle.mockResolvedValueOnce(0);
    const notFound = makeRes();
    await controller.updateDetalle(
      makeReq({ params: { id_plan: '1', id_detalle: '2' }, body: { cantidad_g: 100 } }),
      notFound
    );
    expect(notFound.status).toHaveBeenCalledWith(404);

    PlanModel.updateAlimentoEnDetalle.mockRejectedValueOnce(
      Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' })
    );
    const dup = makeRes();
    await controller.updateDetalle(
      makeReq({ params: { id_plan: '1', id_detalle: '2' }, body: { num_comida: 2 } }),
      dup
    );
    expect(dup.status).toHaveBeenCalledWith(409);

    PlanModel.updateAlimentoEnDetalle.mockRejectedValueOnce(
      Object.assign(new Error('check'), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' })
    );
    const invalid = makeRes();
    await controller.updateDetalle(
      makeReq({ params: { id_plan: '1', id_detalle: '2' }, body: { cantidad_g: -1 } }),
      invalid
    );
    expect(invalid.status).toHaveBeenCalledWith(400);
  });

  test('removeDetalle devuelve 404, éxito y 500', async () => {
    PlanModel.removeAlimentoDeDetalle.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const notFound = makeRes();
    await controller.removeDetalle(
      makeReq({ params: { id_plan: '1', id_detalle: '2' }, body: { num_comida: 1 } }),
      notFound
    );
    expect(notFound.status).toHaveBeenCalledWith(404);

    const ok = makeRes();
    await controller.removeDetalle(
      makeReq({ params: { id_plan: '1', id_detalle: '2' }, body: { num_comida: 1 } }),
      ok
    );
    expect(ok.json).toHaveBeenCalledWith({
      message: 'Alimento eliminado del plan nutricional',
      affected: 1,
    });

    PlanModel.removeAlimentoDeDetalle.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.removeDetalle(makeReq(), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });
});
