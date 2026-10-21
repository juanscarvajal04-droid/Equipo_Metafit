'use strict';

// Tests unitarios de controladores de catálogo, usuarios, pagos, ciclos y
// configuración. Todos los modelos/servicios están mockeados.

jest.mock('../models/catalogoModel', () => ({
  getAllEjercicios: jest.fn(),
  createEjercicio: jest.fn(),
  getAllAlimentos: jest.fn(),
  createAlimento: jest.fn(),
  deleteEjercicio: jest.fn(),
  updateEjercicio: jest.fn(),
  deleteAlimento: jest.fn(),
  updateAlimento: jest.fn(),
  getAllRestricciones: jest.fn(),
  createRestriccion: jest.fn(),
  updateRestriccion: jest.fn(),
  deleteRestriccion: jest.fn(),
}));
jest.mock('../services/usuarioService', () => ({
  getRecepcionistas: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  guardarPushToken: jest.fn(),
  getFoto: jest.fn(),
  setFoto: jest.fn(),
  delete: jest.fn(),
}));
jest.mock('../models/pagoModel', () => ({
  findByAfiliado: jest.fn(),
  getAll: jest.fn(),
  getMetricas: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../models/afiliadoModel', () => ({ findById: jest.fn() }));
jest.mock('../services/facturaService', () => ({ enviarFacturaPago: jest.fn() }));
jest.mock('../services/n8nWebhookService', () => ({ notificarPago: jest.fn() }));
jest.mock('../services/afiliadoService', () => ({
  updateCiclo: jest.fn(),
  deleteCiclo: jest.fn(),
}));
jest.mock('../models/configuracionModel', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

const catalogo = require('../controllers/catalogoController');
const CatalogoModel = require('../models/catalogoModel');
const usuario = require('../controllers/usuarioController');
const UsuarioService = require('../services/usuarioService');
const pago = require('../controllers/pagoController');
const PagoModel = require('../models/pagoModel');
const AfiliadoModel = require('../models/afiliadoModel');
const { enviarFacturaPago } = require('../services/facturaService');
const { notificarPago } = require('../services/n8nWebhookService');
const ciclo = require('../controllers/cicloController');
const AfiliadoService = require('../services/afiliadoService');
const configuracion = require('../controllers/configuracionController');
const ConfiguracionModel = require('../models/configuracionModel');

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
    user: { sub: 1, role: 'Administrador' },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('catalogoController', () => {
  test('ejercicios: listar, crear, actualizar y borrar', async () => {
    CatalogoModel.getAllEjercicios.mockResolvedValueOnce([{ id: 1 }]);
    const rList = makeRes();
    await catalogo.getAllEjercicios(makeReq(), rList);
    expect(rList.json).toHaveBeenCalledWith([{ id: 1 }]);

    CatalogoModel.createEjercicio.mockResolvedValueOnce(5);
    const rCreate = makeRes();
    await catalogo.createEjercicio(
      makeReq({ body: { nombre_ejercicio: 'Sentadilla', grupo_muscular: 'Pierna', nivel_minimo: 'Principiante' } }),
      rCreate
    );
    expect(rCreate.status).toHaveBeenCalledWith(201);
    expect(rCreate.json).toHaveBeenCalledWith({ id: 5, message: 'Ejercicio creado' });

    CatalogoModel.updateEjercicio.mockResolvedValueOnce(1);
    const rUpdate = makeRes();
    await catalogo.updateEjercicio(
      makeReq({ params: { id: '5' }, body: { nombre_ejercicio: 'Sentadilla', grupo_muscular: 'Pierna', nivel_minimo: 'Principiante' } }),
      rUpdate
    );
    expect(rUpdate.json).toHaveBeenCalledWith({ message: 'Ejercicio actualizado' });

    CatalogoModel.deleteEjercicio.mockResolvedValueOnce(1);
    const rDelete = makeRes();
    await catalogo.deleteEjercicio(makeReq({ params: { id: '5' } }), rDelete);
    expect(rDelete.json).toHaveBeenCalledWith({ message: 'Ejercicio eliminado' });
  });

  test('ejercicios: validaciones, 404, duplicado, referencia y error', async () => {
    const badCreate = makeRes();
    await catalogo.createEjercicio(makeReq({ body: {} }), badCreate);
    expect(badCreate.status).toHaveBeenCalledWith(400);

    CatalogoModel.createEjercicio.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }));
    const dup = makeRes();
    await catalogo.createEjercicio(
      makeReq({ body: { nombre_ejercicio: 'X', grupo_muscular: 'Y', nivel_minimo: 'Z' } }),
      dup
    );
    expect(dup.status).toHaveBeenCalledWith(400);

    CatalogoModel.createEjercicio.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await catalogo.createEjercicio(
      makeReq({ body: { nombre_ejercicio: 'X', grupo_muscular: 'Y', nivel_minimo: 'Z' } }),
      error
    );
    expect(error.status).toHaveBeenCalledWith(500);

    const badUpdate = makeRes();
    await catalogo.updateEjercicio(makeReq({ body: {} }), badUpdate);
    expect(badUpdate.status).toHaveBeenCalledWith(400);

    CatalogoModel.updateEjercicio.mockResolvedValueOnce(0);
    const notFound = makeRes();
    await catalogo.updateEjercicio(
      makeReq({ body: { nombre_ejercicio: 'X', grupo_muscular: 'Y', nivel_minimo: 'Z' } }),
      notFound
    );
    expect(notFound.status).toHaveBeenCalledWith(404);

    CatalogoModel.deleteEjercicio.mockResolvedValueOnce(0);
    const delete404 = makeRes();
    await catalogo.deleteEjercicio(makeReq(), delete404);
    expect(delete404.status).toHaveBeenCalledWith(404);

    CatalogoModel.deleteEjercicio.mockRejectedValueOnce(
      Object.assign(new Error('fk'), { code: 'ER_ROW_IS_REFERENCED_2' })
    );
    const referenced = makeRes();
    await catalogo.deleteEjercicio(makeReq(), referenced);
    expect(referenced.status).toHaveBeenCalledWith(409);
  });

  test('alimentos: CRUD y errores', async () => {
    CatalogoModel.getAllAlimentos.mockResolvedValueOnce([{ id: 1 }]);
    const rList = makeRes();
    await catalogo.getAllAlimentos(makeReq(), rList);
    expect(rList.json).toHaveBeenCalledWith([{ id: 1 }]);

    CatalogoModel.createAlimento.mockResolvedValueOnce(2);
    const rCreate = makeRes();
    await catalogo.createAlimento(
      makeReq({ body: { nombre_alimento: 'Pollo', proteinas: 20, carbohidratos: 0, grasas: 5 } }),
      rCreate
    );
    expect(rCreate.status).toHaveBeenCalledWith(201);

    const bad = makeRes();
    await catalogo.createAlimento(makeReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    CatalogoModel.updateAlimento.mockResolvedValueOnce(1);
    const rUpdate = makeRes();
    await catalogo.updateAlimento(
      makeReq({ params: { id: '2' }, body: { nombre_alimento: 'Pollo', proteinas: 20, carbohidratos: 0, grasas: 5 } }),
      rUpdate
    );
    expect(rUpdate.json).toHaveBeenCalledWith({ message: 'Alimento actualizado' });

    CatalogoModel.deleteAlimento.mockResolvedValueOnce(1);
    const rDelete = makeRes();
    await catalogo.deleteAlimento(makeReq({ params: { id: '2' } }), rDelete);
    expect(rDelete.json).toHaveBeenCalledWith({ message: 'Alimento eliminado' });

    CatalogoModel.deleteAlimento.mockResolvedValueOnce(0);
    const notFound = makeRes();
    await catalogo.deleteAlimento(makeReq(), notFound);
    expect(notFound.status).toHaveBeenCalledWith(404);

    CatalogoModel.deleteAlimento.mockRejectedValueOnce(
      Object.assign(new Error('fk'), { code: 'ER_ROW_IS_REFERENCED' })
    );
    const referenced = makeRes();
    await catalogo.deleteAlimento(makeReq(), referenced);
    expect(referenced.status).toHaveBeenCalledWith(409);
  });

  test('restricciones: listar, crear, actualizar y borrar', async () => {
    CatalogoModel.getAllRestricciones.mockResolvedValueOnce([{ id: 1 }]);
    const rList = makeRes();
    await catalogo.getAllRestricciones(makeReq(), rList);
    expect(rList.json).toHaveBeenCalledWith([{ id: 1 }]);

    CatalogoModel.createRestriccion.mockResolvedValueOnce(3);
    const rCreate = makeRes();
    await catalogo.createRestriccion(
      makeReq({ body: { nombre_restriccion: 'Asma', tipo: 'Enfermedad' } }),
      rCreate
    );
    expect(rCreate.status).toHaveBeenCalledWith(201);

    const missing = makeRes();
    await catalogo.createRestriccion(makeReq({ body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(400);

    const invalidType = makeRes();
    await catalogo.createRestriccion(
      makeReq({ body: { nombre_restriccion: 'Asma', tipo: 'Otro' } }),
      invalidType
    );
    expect(invalidType.status).toHaveBeenCalledWith(400);

    CatalogoModel.updateRestriccion.mockResolvedValueOnce(1);
    const rUpdate = makeRes();
    await catalogo.updateRestriccion(
      makeReq({ params: { id: '3' }, body: { nombre_restriccion: 'Asma', tipo: 'Enfermedad' } }),
      rUpdate
    );
    expect(rUpdate.json).toHaveBeenCalledWith({ message: 'Restricción actualizada' });

    CatalogoModel.updateRestriccion.mockResolvedValueOnce(0);
    const notFound = makeRes();
    await catalogo.updateRestriccion(
      makeReq({ body: { nombre_restriccion: 'Asma', tipo: 'Enfermedad' } }),
      notFound
    );
    expect(notFound.status).toHaveBeenCalledWith(404);

    CatalogoModel.deleteRestriccion.mockResolvedValueOnce(1);
    const rDelete = makeRes();
    await catalogo.deleteRestriccion(makeReq({ params: { id: '3' } }), rDelete);
    expect(rDelete.json).toHaveBeenCalledWith({ message: 'Restricción eliminada' });

    CatalogoModel.deleteRestriccion.mockResolvedValueOnce(0);
    const delete404 = makeRes();
    await catalogo.deleteRestriccion(makeReq(), delete404);
    expect(delete404.status).toHaveBeenCalledWith(404);

    CatalogoModel.deleteRestriccion.mockRejectedValueOnce(
      Object.assign(new Error('fk'), { code: 'ER_ROW_IS_REFERENCED_2' })
    );
    const referenced = makeRes();
    await catalogo.deleteRestriccion(makeReq(), referenced);
    expect(referenced.status).toHaveBeenCalledWith(409);
  });

  test('cada listado responde 500 ante fallo del modelo', async () => {
    CatalogoModel.getAllEjercicios.mockRejectedValueOnce(new Error('db'));
    CatalogoModel.getAllAlimentos.mockRejectedValueOnce(new Error('db'));
    CatalogoModel.getAllRestricciones.mockRejectedValueOnce(new Error('db'));
    for (const fn of [catalogo.getAllEjercicios, catalogo.getAllAlimentos, catalogo.getAllRestricciones]) {
      const res = makeRes();
      await fn(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    }
  });
});

describe('usuarioController', () => {
  test('listados y detalle', async () => {
    UsuarioService.getRecepcionistas.mockResolvedValue([{ id: 1 }]);
    UsuarioService.getAll.mockResolvedValue([{ id: 1 }]);
    UsuarioService.getById.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });

    const rRecep = makeRes();
    await usuario.getRecepcionistas(makeReq(), rRecep);
    expect(rRecep.json).toHaveBeenCalledWith([{ id: 1 }]);

    const rAll = makeRes();
    await usuario.getAll(makeReq(), rAll);
    expect(rAll.json).toHaveBeenCalledWith([{ id: 1 }]);

    const r404 = makeRes();
    await usuario.getById(makeReq({ params: { id: '9' } }), r404);
    expect(r404.status).toHaveBeenCalledWith(404);

    const rById = makeRes();
    await usuario.getById(makeReq({ params: { id: '9' } }), rById);
    expect(rById.json).toHaveBeenCalledWith({ id: 1 });
  });

  test('create traduce validación, duplicado y error', async () => {
    UsuarioService.create.mockResolvedValueOnce({ id_usuario: 1 });
    const ok = makeRes();
    await usuario.create(makeReq({ body: { correo: 'a@b.com' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(201);

    UsuarioService.create
      .mockRejectedValueOnce(new Error('Todos los campos son requeridos'))
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }))
      .mockRejectedValueOnce(new Error('db'));
    const statuses = [];
    for (let i = 0; i < 3; i++) {
      const res = makeRes();
      await usuario.create(makeReq(), res);
      statuses.push(res.status.mock.calls[0][0]);
    }
    expect(statuses).toEqual([400, 400, 500]);
  });

  test('update, push token y delete', async () => {
    UsuarioService.update.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });
    const notFound = makeRes();
    await usuario.update(makeReq(), notFound);
    expect(notFound.status).toHaveBeenCalledWith(404);
    const ok = makeRes();
    await usuario.update(makeReq(), ok);
    expect(ok.json).toHaveBeenCalledWith({ id: 1 });

    UsuarioService.guardarPushToken.mockResolvedValue({});
    const noToken = makeRes();
    await usuario.guardarPushToken(makeReq({ body: {} }), noToken);
    expect(noToken.status).toHaveBeenCalledWith(400);
    const pushOk = makeRes();
    await usuario.guardarPushToken(makeReq({ body: { push_token: ' ExpoToken ' } }), pushOk);
    expect(UsuarioService.guardarPushToken).toHaveBeenCalledWith(1, 'ExpoToken');
    expect(pushOk.json).toHaveBeenCalledWith({ message: 'Push token registrado' });

    UsuarioService.delete.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const delete404 = makeRes();
    await usuario.delete(makeReq(), delete404);
    expect(delete404.status).toHaveBeenCalledWith(404);
    const deleteOk = makeRes();
    await usuario.delete(makeReq(), deleteOk);
    expect(deleteOk.json).toHaveBeenCalledWith({ message: 'Usuario eliminado correctamente' });
  });

  test('subirFoto valida archivo, guarda la URL y responde 404/500', async () => {
    const sinArchivo = makeRes();
    await usuario.subirFoto(makeReq(), sinArchivo);
    expect(sinArchivo.status).toHaveBeenCalledWith(400);

    UsuarioService.getFoto.mockResolvedValue(null);
    UsuarioService.setFoto.mockResolvedValue(true);
    const ok = makeRes();
    await usuario.subirFoto(
      makeReq({
        protocol: 'http',
        get: () => 'localhost:3000',
        file: { path: '/app/uploads/staff.jpg', filename: 'staff.jpg' },
      }),
      ok
    );
    expect(UsuarioService.setFoto).toHaveBeenCalledWith(1, '/uploads/staff.jpg');
    expect(ok.json).toHaveBeenCalledWith({
      message: 'Foto de perfil actualizada',
      foto: '/uploads/staff.jpg',
      url: 'http://localhost:3000/uploads/staff.jpg',
    });

    UsuarioService.setFoto.mockResolvedValueOnce(false);
    const noUser = makeRes();
    await usuario.subirFoto(
      makeReq({
        protocol: 'https',
        get: () => 'api.test',
        file: { path: 'https://cdn.test/staff.jpg', filename: 'staff.jpg' },
      }),
      noUser
    );
    expect(noUser.status).toHaveBeenCalledWith(404);

    UsuarioService.getFoto.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await usuario.subirFoto(
      makeReq({
        protocol: 'http',
        get: () => 'localhost:3000',
        file: { path: '/app/uploads/staff.jpg', filename: 'staff.jpg' },
      }),
      error
    );
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('update y delete traducen errores de negocio', async () => {
    const cases = [
      [new Error('No puedes desactivar tu propia cuenta'), 400],
      [Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }), 400],
      [new Error('db'), 500],
    ];
    for (const [error, status] of cases) {
      UsuarioService.update.mockRejectedValueOnce(error);
      const res = makeRes();
      await usuario.update(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(status);
    }

    const deleteCases = [
      [new Error('No puedes eliminarte a ti mismo'), 400],
      [Object.assign(new Error('fk'), { code: 'ER_ROW_IS_REFERENCED_2' }), 400],
      [new Error('db'), 500],
    ];
    for (const [error, status] of deleteCases) {
      UsuarioService.delete.mockRejectedValueOnce(error);
      const res = makeRes();
      await usuario.delete(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(status);
    }
  });
});

describe('pagoController', () => {
  test('consultas de pagos y métricas', async () => {
    PagoModel.findByAfiliado.mockResolvedValue([{ id: 1 }]);
    PagoModel.getAll.mockResolvedValue([{ id: 1 }]);
    PagoModel.getMetricas.mockResolvedValue({ total: 100 });

    const r1 = makeRes();
    await pago.getByAfiliado(makeReq({ params: { id: '1' } }), r1);
    expect(r1.json).toHaveBeenCalledWith([{ id: 1 }]);

    const r2 = makeRes();
    await pago.getAll(makeReq({ query: { fecha_inicio: '2026-01-01' } }), r2);
    expect(r2.json).toHaveBeenCalledWith([{ id: 1 }]);

    const r3 = makeRes();
    await pago.getMetricas(makeReq(), r3);
    expect(r3.json).toHaveBeenCalledWith({ total: 100 });
  });

  test('create registra pago y dispara factura/webhook', async () => {
    PagoModel.create.mockResolvedValue({ id_pago: 10, fecha_vencimiento: '2026-11-20' });
    AfiliadoModel.findById.mockResolvedValue({ id_usuario: 1, correo: 'ana@metafit.com' });
    enviarFacturaPago.mockResolvedValue(true);
    notificarPago.mockResolvedValue({});

    const res = makeRes();
    await pago.create(
      makeReq({
        params: { id: '1' },
        body: { valor_pagado: 90000, metodo_pago: 'Tarjeta' },
      }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 10,
      fecha_vencimiento: '2026-11-20',
      message: 'Pago registrado correctamente',
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(enviarFacturaPago).toHaveBeenCalled();
    expect(notificarPago).toHaveBeenCalled();
  });

  test('create responde 500 si el modelo falla', async () => {
    PagoModel.create.mockRejectedValueOnce(new Error('db'));
    const res = makeRes();
    await pago.create(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('consultas responden 500 ante error', async () => {
    PagoModel.findByAfiliado.mockRejectedValueOnce(new Error('db'));
    PagoModel.getAll.mockRejectedValueOnce(new Error('db'));
    PagoModel.getMetricas.mockRejectedValueOnce(new Error('db'));
    for (const fn of [pago.getByAfiliado, pago.getAll, pago.getMetricas]) {
      const res = makeRes();
      await fn(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    }
  });
});

describe('cicloController y configuracionController', () => {
  test('updateCiclo traduce todos los códigos', async () => {
    AfiliadoService.updateCiclo
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(Object.assign(new Error('no'), { code: 'NO_ENCONTRADO' }))
      .mockRejectedValueOnce(Object.assign(new Error('dato'), { code: 'DATOS_INVALIDOS' }))
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }))
      .mockRejectedValueOnce(Object.assign(new Error('check'), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' }))
      .mockRejectedValueOnce(new Error('db'));
    const ok = makeRes();
    await ciclo.updateCiclo(makeReq(), ok);
    expect(ok.json).toHaveBeenCalledWith({ message: 'Ciclo actualizado correctamente' });

    const statuses = [];
    for (const expected of [404, 404, 400, 400, 400, 500]) {
      const res = makeRes();
      await ciclo.updateCiclo(makeReq(), res);
      statuses.push(res.status.mock.calls[0][0]);
    }
    expect(statuses).toEqual([404, 404, 400, 400, 400, 500]);
  });

  test('deleteCiclo responde éxito, 404 y 500', async () => {
    AfiliadoService.deleteCiclo.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const ok = makeRes();
    await ciclo.deleteCiclo(makeReq(), ok);
    expect(ok.json).toHaveBeenCalledWith({ message: 'Ciclo eliminado correctamente' });
    const notFound = makeRes();
    await ciclo.deleteCiclo(makeReq(), notFound);
    expect(notFound.status).toHaveBeenCalledWith(404);

    AfiliadoService.deleteCiclo.mockRejectedValueOnce(
      Object.assign(new Error('no'), { code: 'NO_ENCONTRADO' })
    );
    const error404 = makeRes();
    await ciclo.deleteCiclo(makeReq(), error404);
    expect(error404.status).toHaveBeenCalledWith(404);

    AfiliadoService.deleteCiclo.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await ciclo.deleteCiclo(makeReq(), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('configuración de precio: obtener, actualizar y validar', async () => {
    ConfiguracionModel.get.mockResolvedValueOnce('90000').mockResolvedValueOnce(null);
    const rGet = makeRes();
    await configuracion.getPrecioMembresia(makeReq(), rGet);
    expect(rGet.json).toHaveBeenCalledWith({ clave: 'precio_membresia', valor: 90000 });
    const rDefault = makeRes();
    await configuracion.getPrecioMembresia(makeReq(), rDefault);
    expect(rDefault.json).toHaveBeenCalledWith({ clave: 'precio_membresia', valor: 80000 });

    ConfiguracionModel.set.mockResolvedValue({});
    const rUpdate = makeRes();
    await configuracion.updatePrecioMembresia(makeReq({ body: { valor: '85000.4' } }), rUpdate);
    expect(ConfiguracionModel.set).toHaveBeenCalledWith('precio_membresia', '85000');
    expect(rUpdate.json).toHaveBeenCalledWith({
      message: 'Precio de membresia actualizado',
      valor: 85000.4,
    });

    for (const valor of [null, 'abc', 0, -1]) {
      const res = makeRes();
      await configuracion.updatePrecioMembresia(makeReq({ body: { valor } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    }

    ConfiguracionModel.get.mockRejectedValueOnce(new Error('db'));
    const errorGet = makeRes();
    await configuracion.getPrecioMembresia(makeReq(), errorGet);
    expect(errorGet.status).toHaveBeenCalledWith(500);

    ConfiguracionModel.set.mockRejectedValueOnce(new Error('db'));
    const errorSet = makeRes();
    await configuracion.updatePrecioMembresia(makeReq({ body: { valor: 90000 } }), errorSet);
    expect(errorSet.status).toHaveBeenCalledWith(500);
  });
});
