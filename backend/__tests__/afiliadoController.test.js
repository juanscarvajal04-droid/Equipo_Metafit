'use strict';

// Tests unitarios del controlador de afiliados.
// Se mockean servicio, registros y efectos externos para cubrir la
// traducción HTTP de cada operación sin tocar la base de datos.

jest.mock('../services/afiliadoService', () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMe: jest.fn(),
  getFoto: jest.fn(),
  setFoto: jest.fn(),
  delete: jest.fn(),
  getCiclos: jest.fn(),
  createCiclo: jest.fn(),
  getRestricciones: jest.fn(),
  addRestriccion: jest.fn(),
  removeRestriccion: jest.fn(),
  getEjerciciosDisponibles: jest.fn(),
  getAlimentosDisponibles: jest.fn(),
  getProgreso: jest.fn(),
  createProgreso: jest.fn(),
  saveProgresoEjercicio: jest.fn(),
  getProgresoEjercicio: jest.fn(),
  saveAgua: jest.fn(),
  getAgua: jest.fn(),
  saveConsumoAlimento: jest.fn(),
  getAguaHistorial: jest.fn(),
  getConsumoHistorial: jest.fn(),
  getProgresoEjercicioHistorial: jest.fn(),
  guardarNotaEjercicio: jest.fn(),
  getMisNotasEjercicio: jest.fn(),
  getNotasEjercicioDeAfiliado: jest.fn(),
  actualizarNotaEjercicio: jest.fn(),
  eliminarNotaEjercicio: jest.fn(),
}));
jest.mock('../services/registroService', () => ({
  getHistorialEjercicios: jest.fn(),
}));
jest.mock('../services/bienvenidaService', () => ({
  enviarCorreoBienvenida: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock('../services/n8nWebhookService', () => ({
  notificarNuevoAfiliado: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock('../middlewares/uploadFoto', () => ({
  eliminarFotoAnterior: jest.fn(),
}));

const controller = require('../controllers/afiliadoController');
const AfiliadoService = require('../services/afiliadoService');
const RegistroService = require('../services/registroService');
const { enviarCorreoBienvenida } = require('../services/bienvenidaService');
const { notificarNuevoAfiliado } = require('../services/n8nWebhookService');
const { eliminarFotoAnterior } = require('../middlewares/uploadFoto');

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
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost:3000'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('afiliadoController - catálogo y CRUD', () => {
  test('getAll normaliza paginación', async () => {
    AfiliadoService.getAll.mockResolvedValue([{ id_usuario: 1 }]);
    const res = makeRes();
    await controller.getAll(makeReq({ query: { page: '2', limit: '999' } }), res);
    expect(AfiliadoService.getAll).toHaveBeenCalledWith({ page: 2, limit: 200 });
    expect(res.json).toHaveBeenCalledWith([{ id_usuario: 1 }]);
  });

  test('getAll responde 500 ante error', async () => {
    AfiliadoService.getAll.mockRejectedValue(new Error('db'));
    const res = makeRes();
    await controller.getAll(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getById devuelve 404 o el afiliado', async () => {
    AfiliadoService.getById.mockResolvedValueOnce(null);
    const res404 = makeRes();
    await controller.getById(makeReq({ params: { id: '9' } }), res404);
    expect(res404.status).toHaveBeenCalledWith(404);

    AfiliadoService.getById.mockResolvedValueOnce({ id_usuario: 9 });
    const res = makeRes();
    await controller.getById(makeReq({ params: { id: '9' } }), res);
    expect(res.json).toHaveBeenCalledWith({ id_usuario: 9 });
  });

  test('create devuelve 201 y lanza bienvenida y webhook', async () => {
    AfiliadoService.create.mockResolvedValue({ id: 7, password_temporal: 'MF_123@2025' });
    AfiliadoService.getById.mockResolvedValue({ id_usuario: 7, correo: 'nuevo@metafit.com' });
    const res = makeRes();
    await controller.create(
      makeReq({ body: { nombres: 'Nuevo', documento: '123' }, user: { sub: 4 } }),
      res
    );
    expect(AfiliadoService.create).toHaveBeenCalledWith(
      { nombres: 'Nuevo', documento: '123' },
      4
    );
    expect(res.status).toHaveBeenCalledWith(201);
    await Promise.resolve();
    await Promise.resolve();
    expect(enviarCorreoBienvenida).toHaveBeenCalledWith(
      { id_usuario: 7, correo: 'nuevo@metafit.com' },
      'MF_123@2025'
    );
    expect(notificarNuevoAfiliado).toHaveBeenCalled();
  });

  test('create omite efectos externos sin contraseña y traduce errores', async () => {
    AfiliadoService.create.mockResolvedValueOnce({ id: 8 });
    await controller.create(makeReq(), makeRes());
    expect(enviarCorreoBienvenida).not.toHaveBeenCalled();

    AfiliadoService.create.mockRejectedValueOnce(
      new Error('Nombre y documento son requeridos')
    );
    const res400 = makeRes();
    await controller.create(makeReq(), res400);
    expect(res400.status).toHaveBeenCalledWith(400);

    AfiliadoService.create.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }));
    const resDup = makeRes();
    await controller.create(makeReq(), resDup);
    expect(resDup.status).toHaveBeenCalledWith(400);

    AfiliadoService.create.mockRejectedValueOnce(new Error('otro'));
    const res500 = makeRes();
    await controller.create(makeReq(), res500);
    expect(res500.status).toHaveBeenCalledWith(500);
  });

  test('update y delete traducen encontrado/no encontrado', async () => {
    AfiliadoService.update.mockResolvedValueOnce(false);
    const res404 = makeRes();
    await controller.update(makeReq({ params: { id: '2' } }), res404);
    expect(res404.status).toHaveBeenCalledWith(404);

    AfiliadoService.update.mockResolvedValueOnce(true);
    const res = makeRes();
    await controller.update(makeReq({ params: { id: '2' } }), res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Afiliado actualizado correctamente' });

    AfiliadoService.delete.mockResolvedValueOnce(true);
    const resDelete = makeRes();
    await controller.delete(makeReq({ params: { id: '2' } }), resDelete);
    expect(resDelete.json).toHaveBeenCalledWith({ message: 'Afiliado eliminado correctamente' });

    AfiliadoService.delete.mockRejectedValueOnce(
      Object.assign(new Error('fk'), { code: 'ER_ROW_IS_REFERENCED_2' })
    );
    const resFk = makeRes();
    await controller.delete(makeReq({ params: { id: '2' } }), resFk);
    expect(resFk.status).toHaveBeenCalledWith(400);
  });
});

describe('afiliadoController - ciclos, restricciones y progreso', () => {
  test('getCiclos y createCiclo', async () => {
    AfiliadoService.getCiclos.mockResolvedValue([{ id_ciclo: 1 }]);
    const res = makeRes();
    await controller.getCiclos(makeReq({ params: { id: '1' } }), res);
    expect(res.json).toHaveBeenCalledWith([{ id_ciclo: 1 }]);

    AfiliadoService.createCiclo.mockResolvedValue({ id_ciclo: 2 });
    const resCreate = makeRes();
    await controller.createCiclo(makeReq({ body: { id_usuario: 1 } }), resCreate);
    expect(resCreate.status).toHaveBeenCalledWith(201);
  });

  test('createCiclo traduce validación, duplicado y error', async () => {
    AfiliadoService.createCiclo
      .mockRejectedValueOnce(new Error('id_usuario, fecha_inicio y fecha_fin son requeridos'))
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }))
      .mockRejectedValueOnce(new Error('db'));
    const r1 = makeRes();
    const r2 = makeRes();
    const r3 = makeRes();
    await controller.createCiclo(makeReq(), r1);
    await controller.createCiclo(makeReq(), r2);
    await controller.createCiclo(makeReq(), r3);
    expect(r1.status).toHaveBeenCalledWith(400);
    expect(r2.status).toHaveBeenCalledWith(400);
    expect(r3.status).toHaveBeenCalledWith(500);
  });

  test('restricciones: listar, agregar y remover', async () => {
    AfiliadoService.getRestricciones.mockResolvedValue([{ id_restriccion: 1 }]);
    const res = makeRes();
    await controller.getRestricciones(makeReq({ params: { id: '1' } }), res);
    expect(res.json).toHaveBeenCalledWith([{ id_restriccion: 1 }]);

    AfiliadoService.addRestriccion.mockResolvedValue({ id: 3 });
    const resAdd = makeRes();
    await controller.addRestriccion(
      makeReq({ params: { id: '1' }, body: { id_restriccion: 2 } }),
      resAdd
    );
    expect(resAdd.status).toHaveBeenCalledWith(201);

    AfiliadoService.removeRestriccion.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const resRemove404 = makeRes();
    await controller.removeRestriccion(
      makeReq({ params: { id: '1', id_restriccion: '2' } }),
      resRemove404
    );
    expect(resRemove404.status).toHaveBeenCalledWith(404);
    const resRemove = makeRes();
    await controller.removeRestriccion(
      makeReq({ params: { id: '1', id_restriccion: '2' } }),
      resRemove
    );
    expect(resRemove.json).toHaveBeenCalledWith({ message: 'Restricción removida' });
  });

  test('catálogos disponibles y progreso combinado', async () => {
    AfiliadoService.getEjerciciosDisponibles.mockResolvedValue([{ id_ejercicio: 1 }]);
    AfiliadoService.getAlimentosDisponibles.mockResolvedValue([{ id_alimento: 1 }]);
    const res1 = makeRes();
    const res2 = makeRes();
    await controller.getEjerciciosDisponibles(makeReq({ params: { id: '1' } }), res1);
    await controller.getAlimentosDisponibles(makeReq({ params: { id: '1' } }), res2);
    expect(res1.json).toHaveBeenCalledWith([{ id_ejercicio: 1 }]);
    expect(res2.json).toHaveBeenCalledWith([{ id_alimento: 1 }]);

    AfiliadoService.getProgreso.mockResolvedValue([{ peso: 70 }]);
    RegistroService.getHistorialEjercicios.mockResolvedValue([{ nota: 'ok' }]);
    const res3 = makeRes();
    await controller.getProgreso(makeReq({ params: { id: '1' } }), res3);
    expect(res3.json).toHaveBeenCalledWith({
      historial: [{ peso: 70 }],
      registros: [{ nota: 'ok' }],
    });
  });

  test('createProgreso traduce validación y duplicado', async () => {
    AfiliadoService.createProgreso
      .mockResolvedValueOnce({ id: 1 })
      .mockRejectedValueOnce(new Error('id_ciclo, fecha_registro y peso son requeridos'))
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }));
    const ok = makeRes();
    const bad = makeRes();
    const dup = makeRes();
    await controller.createProgreso(makeReq(), ok);
    await controller.createProgreso(makeReq(), bad);
    await controller.createProgreso(makeReq(), dup);
    expect(ok.status).toHaveBeenCalledWith(201);
    expect(bad.status).toHaveBeenCalledWith(400);
    expect(dup.status).toHaveBeenCalledWith(400);
  });

  test('subirFoto valida archivo, actualiza y borra la anterior', async () => {
    const resNoFile = makeRes();
    await controller.subirFoto(makeReq(), resNoFile);
    expect(resNoFile.status).toHaveBeenCalledWith(400);

    AfiliadoService.getFoto.mockResolvedValue('/uploads/old.jpg');
    AfiliadoService.setFoto.mockResolvedValue(true);
    const res = makeRes();
    await controller.subirFoto(
      makeReq({
        params: { id: '5' },
        file: { path: '/app/uploads/new.jpg', filename: 'new.jpg' },
      }),
      res
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Foto de perfil actualizada',
      foto: '/uploads/new.jpg',
      url: 'http://localhost:3000/uploads/new.jpg',
    });
    expect(eliminarFotoAnterior).toHaveBeenCalledWith('/uploads/old.jpg');

    AfiliadoService.setFoto.mockResolvedValue(false);
    const res404 = makeRes();
    await controller.subirFoto(
      makeReq({ file: { path: 'https://cdn/new.jpg', filename: 'new.jpg' } }),
      res404
    );
    expect(res404.status).toHaveBeenCalledWith(404);
  });
});

describe('afiliadoController - endpoints /me y notas', () => {
  test('getMe, mis ciclos, mi progreso y restricciones', async () => {
    AfiliadoService.getById.mockResolvedValueOnce(null).mockResolvedValueOnce({ id_usuario: 1 });
    const r404 = makeRes();
    await controller.getMe(makeReq(), r404);
    expect(r404.status).toHaveBeenCalledWith(404);
    const rMe = makeRes();
    await controller.getMe(makeReq(), rMe);
    expect(rMe.json).toHaveBeenCalledWith({ id_usuario: 1 });

    AfiliadoService.getCiclos.mockResolvedValue([{ id_ciclo: 1 }]);
    const rCiclos = makeRes();
    await controller.getMisCiclos(makeReq(), rCiclos);
    expect(rCiclos.json).toHaveBeenCalledWith([{ id_ciclo: 1 }]);

    AfiliadoService.getProgreso.mockResolvedValue([{ peso: 70 }]);
    const rProgreso = makeRes();
    await controller.getMiProgreso(makeReq(), rProgreso);
    expect(rProgreso.json).toHaveBeenCalledWith([{ peso: 70 }]);

    AfiliadoService.getRestricciones.mockResolvedValue([{ id: 1 }]);
    const rRestr = makeRes();
    await controller.getMisRestricciones(makeReq(), rRestr);
    expect(rRestr.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  test('updateMe traduce todos los códigos de error', async () => {
    AfiliadoService.updateMe
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(Object.assign(new Error('dato'), { code: 'DATOS_INVALIDOS' }))
      .mockRejectedValueOnce(Object.assign(new Error('correo'), { code: 'CORREO_EN_USO' }))
      .mockRejectedValueOnce(Object.assign(new Error('no'), { code: 'NO_ENCONTRADO' }))
      .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }))
      .mockRejectedValueOnce(Object.assign(new Error('peso'), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' }))
      .mockRejectedValueOnce(new Error('db'));
    const ok = makeRes();
    await controller.updateMe(makeReq(), ok);
    expect(ok.json).toHaveBeenCalledWith({ ok: true });

    const statuses = [];
    for (const code of [400, 409, 404, 400, 400, 500]) {
      const res = makeRes();
      await controller.updateMe(makeReq(), res);
      statuses.push(res.status.mock.calls[0][0]);
    }
    expect(statuses).toEqual([400, 409, 404, 400, 400, 500]);
  });

  test('getAguaAfiliado devuelve vasos y litros para el staff', async () => {
    const query = { fechaInicio: '2026-10-15', fechaFin: '2026-10-21' };
    AfiliadoService.getAguaHistorial.mockResolvedValueOnce([
      { fecha: '2026-10-20', vasos: 8 },
      { fecha: '2026-10-19', vasos: 3 },
    ]);
    const res = makeRes();
    await controller.getAguaAfiliado(makeReq({ params: { id: '9' }, query }), res);
    expect(AfiliadoService.getAguaHistorial).toHaveBeenCalledWith('9', query);
    expect(res.json).toHaveBeenCalledWith([
      { fecha: '2026-10-20', vasos: 8, litros: 2 },
      { fecha: '2026-10-19', vasos: 3, litros: 0.75 },
    ]);

    AfiliadoService.getAguaHistorial.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await controller.getAguaAfiliado(makeReq({ params: { id: '9' } }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('progreso de ejercicio, agua y consumo', async () => {
    AfiliadoService.saveProgresoEjercicio.mockResolvedValue({ id: 1 });
    AfiliadoService.getProgresoEjercicio.mockResolvedValue([{ id_ejercicio: 1 }]);
    AfiliadoService.saveAgua.mockResolvedValue({ id: 1 });
    AfiliadoService.getAgua.mockResolvedValue({ ml: 500 });
    AfiliadoService.saveConsumoAlimento.mockResolvedValue({ id: 1 });
    AfiliadoService.getAguaHistorial.mockResolvedValue([{ ml: 500 }]);
    AfiliadoService.getConsumoHistorial.mockResolvedValue([{ kcal: 100 }]);
    AfiliadoService.getProgresoEjercicioHistorial.mockResolvedValue([{ reps: 10 }]);

    const r1 = makeRes();
    await controller.saveProgresoEjercicio(makeReq(), r1);
    expect(r1.status).toHaveBeenCalledWith(201);

    const r2 = makeRes();
    await controller.getProgresoEjercicio(
      makeReq({ params: { idCiclo: '1', fecha: '2026-10-01' } }),
      r2
    );
    expect(r2.json).toHaveBeenCalledWith({ ejercicios: [{ id_ejercicio: 1 }] });

    const r3 = makeRes();
    await controller.saveAgua(makeReq(), r3);
    expect(r3.status).toHaveBeenCalledWith(201);

    const r4 = makeRes();
    await controller.getAgua(makeReq({ params: { fecha: '2026-10-01' } }), r4);
    expect(r4.json).toHaveBeenCalledWith({ ml: 500 });

    const r5 = makeRes();
    await controller.saveConsumoAlimento(makeReq(), r5);
    expect(r5.status).toHaveBeenCalledWith(201);

    const r6 = makeRes();
    await controller.getAguaHistorial(makeReq({ query: { limite: 5 } }), r6);
    expect(r6.json).toHaveBeenCalledWith([{ ml: 500 }]);

    const r7 = makeRes();
    await controller.getConsumoHistorial(makeReq(), r7);
    expect(r7.json).toHaveBeenCalledWith([{ kcal: 100 }]);

    const r8 = makeRes();
    await controller.getProgresoEjercicioHistorial(makeReq(), r8);
    expect(r8.json).toHaveBeenCalledWith([{ reps: 10 }]);

    AfiliadoService.saveAgua.mockRejectedValueOnce(new Error('datos requeridos'));
    const rBad = makeRes();
    await controller.saveAgua(makeReq(), rBad);
    expect(rBad.status).toHaveBeenCalledWith(400);
  });

  test('notas de ejercicio: crear, listar, actualizar y eliminar', async () => {
    AfiliadoService.guardarNotaEjercicio.mockResolvedValue({ id_nota: 1 });
    AfiliadoService.getMisNotasEjercicio.mockResolvedValue([{ id_nota: 1 }]);
    AfiliadoService.actualizarNotaEjercicio.mockResolvedValue({ ok: true });
    AfiliadoService.eliminarNotaEjercicio.mockResolvedValue({ ok: true });
    AfiliadoService.getNotasEjercicioDeAfiliado.mockResolvedValue([{ id_nota: 1 }]);

    const r1 = makeRes();
    await controller.crearNotaEjercicio(makeReq(), r1);
    expect(r1.status).toHaveBeenCalledWith(201);

    const r2 = makeRes();
    await controller.getMisNotasEjercicio(makeReq({ query: { id_ciclo: '1' } }), r2);
    expect(r2.json).toHaveBeenCalledWith([{ id_nota: 1 }]);

    const r3 = makeRes();
    await controller.actualizarNotaEjercicio(
      makeReq({ params: { id_nota: '1' }, body: { nota: 'ok' } }),
      r3
    );
    expect(r3.json).toHaveBeenCalledWith({ ok: true });

    const r4 = makeRes();
    await controller.eliminarNotaEjercicio(makeReq({ params: { id_nota: '1' } }), r4);
    expect(r4.json).toHaveBeenCalledWith({ ok: true });

    const r5 = makeRes();
    await controller.getNotasEjercicioAfiliado(makeReq({ params: { id: '1' } }), r5);
    expect(r5.json).toHaveBeenCalledWith([{ id_nota: 1 }]);

    AfiliadoService.guardarNotaEjercicio.mockRejectedValueOnce(
      Object.assign(new Error('fk'), { code: 'ER_NO_REFERENCED_ROW_2' })
    );
    const rBad = makeRes();
    await controller.crearNotaEjercicio(makeReq(), rBad);
    expect(rBad.status).toHaveBeenCalledWith(400);

    AfiliadoService.actualizarNotaEjercicio.mockRejectedValueOnce(
      Object.assign(new Error('no'), { code: 'NO_ENCONTRADO' })
    );
    const r404 = makeRes();
    await controller.actualizarNotaEjercicio(makeReq(), r404);
    expect(r404.status).toHaveBeenCalledWith(404);
  });
});
