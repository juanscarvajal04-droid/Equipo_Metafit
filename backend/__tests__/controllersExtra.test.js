'use strict';

// Tests unitarios adicionales de los controladores de registro/progreso,
// catálogo, usuarios y notificaciones, junto con FiltroService y
// RegistroService reales (con pool y modelos mockeados).

jest.mock('../config/db', () => ({
  query: jest.fn(),
  execute: jest.fn(),
  getConnection: jest.fn(),
}));
jest.mock('../services/registroService', () => ({
  registerEjercicio: jest.fn(),
  registerConsumoAlimento: jest.fn(),
  getHistorialEjercicios: jest.fn(),
  getEvolucionEjercicio: jest.fn(),
  getHistorialConsumos: jest.fn(),
}));
jest.mock('../services/filtroService', () => ({
  getEjerciciosFiltrados: jest.fn(),
  getAlimentosFiltrados: jest.fn(),
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
jest.mock('../models/progresoDiarioModel', () => ({
  sincronizar: jest.fn(),
  getByFecha: jest.fn(),
  guardarEstado: jest.fn(),
  getHistorial: jest.fn(),
}));
jest.mock('../models/cicloModel', () => ({ findById: jest.fn() }));
jest.mock('../models/registroEjercicioModel', () => ({
  insertar: jest.fn(),
  getHistorial: jest.fn(),
  getEvolucion: jest.fn(),
}));
jest.mock('../models/consumoAlimentoRealModel', () => ({
  insertar: jest.fn(),
  getHistorial: jest.fn(),
}));
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
  getEjerciciosDisponibles: jest.fn(),
  getAlimentosDisponibles: jest.fn(),
}));
jest.mock('../models/notificacionModel', () => ({ getByRole: jest.fn() }));
jest.mock('../middlewares/uploadFoto', () => ({ eliminarFotoAnterior: jest.fn() }));

const pool = require('../config/db');
const RegistroServiceMock = require('../services/registroService');
const FiltroServiceMock = require('../services/filtroService');
const UsuarioService = require('../services/usuarioService');
const ProgresoDiarioModel = require('../models/progresoDiarioModel');
const CicloModel = require('../models/cicloModel');
const RegistroEjercicioModel = require('../models/registroEjercicioModel');
const ConsumoAlimentoRealModel = require('../models/consumoAlimentoRealModel');
const CatalogoModel = require('../models/catalogoModel');
const NotificacionModel = require('../models/notificacionModel');
const { eliminarFotoAnterior } = require('../middlewares/uploadFoto');

const RegistroController = require('../controllers/registroController');
const ProgresoController = require('../controllers/progresoController');
const CatalogoController = require('../controllers/catalogoController');
const UsuarioController = require('../controllers/usuarioController');
const NotificacionController = require('../controllers/notificacionController');

// Implementaciones reales: sus dependencias (pool/modelos) están mockeadas.
const FiltroService = jest.requireActual('../services/filtroService');
const RegistroService = jest.requireActual('../services/registroService');

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
    user: { sub: 1, role: 'Afiliado' },
    ...overrides,
  };
}

function errorCon(codigo, mensaje = 'error') {
  const err = new Error(mensaje);
  err.code = codigo;
  return err;
}

function makeConn() {
  return {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────
// registroController
// ─────────────────────────────────────────────────────────────
describe('registroController', () => {
  test('catálogos disponibles devuelven los datos filtrados', async () => {
    FiltroServiceMock.getEjerciciosFiltrados.mockResolvedValueOnce([{ id_ejercicio: 1 }]);
    FiltroServiceMock.getAlimentosFiltrados.mockResolvedValueOnce([{ id_alimento: 2 }]);

    const resEj = makeRes();
    await RegistroController.getEjerciciosDisponibles(makeReq({ query: { grupo_muscular: 'Pierna' } }), resEj);
    expect(FiltroServiceMock.getEjerciciosFiltrados).toHaveBeenCalledWith(1, { grupo_muscular: 'Pierna' });
    expect(resEj.json).toHaveBeenCalledWith([{ id_ejercicio: 1 }]);

    const resAl = makeRes();
    await RegistroController.getAlimentosDisponibles(makeReq({ query: { max_kcal: '200' } }), resAl);
    expect(FiltroServiceMock.getAlimentosFiltrados).toHaveBeenCalledWith(1, { max_kcal: '200' });
    expect(resAl.json).toHaveBeenCalledWith([{ id_alimento: 2 }]);
  });

  test('catálogos disponibles responden 500 si el filtro falla', async () => {
    FiltroServiceMock.getEjerciciosFiltrados.mockRejectedValueOnce(new Error('db'));
    FiltroServiceMock.getAlimentosFiltrados.mockRejectedValueOnce(new Error('db'));

    const resEj = makeRes();
    await RegistroController.getEjerciciosDisponibles(makeReq(), resEj);
    expect(resEj.status).toHaveBeenCalledWith(500);

    const resAl = makeRes();
    await RegistroController.getAlimentosDisponibles(makeReq(), resAl);
    expect(resAl.status).toHaveBeenCalledWith(500);
  });

  test('registerEjercicio responde 201 y propaga el resultado', async () => {
    RegistroServiceMock.registerEjercicio.mockResolvedValueOnce({ id_registro: 9, resumen: {} });

    const res = makeRes();
    await RegistroController.registerEjercicio(
      makeReq({ body: { id_ciclo: 1, id_rutina: 2, orden: 1, fecha: '2026-10-21', series: 3, repeticiones: 10 } }),
      res
    );

    expect(RegistroServiceMock.registerEjercicio).toHaveBeenCalledWith(1, expect.objectContaining({ id_ciclo: 1 }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id_registro: 9, resumen: {} });
  });

  test('mapearError traduce todos los códigos de negocio', async () => {
    const cases = [
      [errorCon('DATOS_INCOMPLETOS', 'faltan datos'), 400, 'faltan datos'],
      [errorCon('DATOS_INVALIDOS', 'datos inválidos'), 400, 'datos inválidos'],
      [errorCon('CICLO_NO_ENCONTRADO', 'sin ciclo'), 404, 'sin ciclo'],
      [errorCon('CICLO_AJENO', 'ciclo ajeno'), 403, 'ciclo ajeno'],
      [errorCon('ALIMENTO_NO_ENCONTRADO', 'sin alimento'), 400, 'sin alimento'],
      [
        errorCon('ER_NO_REFERENCED_ROW_2', 'Cannot add or update a child row: fk_rejec_rutejec'),
        400,
        'El ejercicio no pertenece a la rutina indicada',
      ],
      [
        errorCon('ER_NO_REFERENCED_ROW_2', 'Cannot add or update a child row: fk_creal_detalle'),
        400,
        'El alimento no pertenece al plan nutricional del ciclo',
      ],
      [errorCon('ER_NO_REFERENCED_ROW_2', 'otra fk'), 500, 'Error interno del servidor'],
      [errorCon('ER_DUP_ENTRY', 'duplicado'), 409, 'Ya existe un registro idéntico para esa fecha'],
      [new Error('inesperado'), 500, 'Error interno del servidor'],
    ];

    for (const [error, status, mensaje] of cases) {
      RegistroServiceMock.registerEjercicio.mockRejectedValueOnce(error);
      const res = makeRes();
      await RegistroController.registerEjercicio(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(status);
      expect(res.json).toHaveBeenCalledWith({ error: mensaje });
    }
  });

  test('registerConsumoAlimento responde 201 y traduce errores', async () => {
    RegistroServiceMock.registerConsumoAlimento.mockResolvedValueOnce({ id_consumo: 4, calorias_consumidas: 120 });
    const ok = makeRes();
    await RegistroController.registerConsumoAlimento(
      makeReq({ body: { id_ciclo: 1, num_comida: 2, id_alimento: 3, fecha: '2026-10-21', cantidad_g_consumida: 100 } }),
      ok
    );
    expect(ok.status).toHaveBeenCalledWith(201);
    expect(ok.json).toHaveBeenCalledWith({ id_consumo: 4, calorias_consumidas: 120 });

    RegistroServiceMock.registerConsumoAlimento.mockRejectedValueOnce(errorCon('DATOS_INVALIDOS', 'mal'));
    const error = makeRes();
    await RegistroController.registerConsumoAlimento(makeReq(), error);
    expect(error.status).toHaveBeenCalledWith(400);
  });

  test('historiales delegan y responden 500 ante error', async () => {
    RegistroServiceMock.getHistorialEjercicios.mockResolvedValueOnce([{ id_registro: 1 }]);
    RegistroServiceMock.getHistorialConsumos.mockResolvedValueOnce([{ id_consumo: 1 }]);

    const resEj = makeRes();
    await RegistroController.getHistorialEjercicios(makeReq({ query: { limit: '5' } }), resEj);
    expect(RegistroServiceMock.getHistorialEjercicios).toHaveBeenCalledWith(1, { limit: '5' });
    expect(resEj.json).toHaveBeenCalledWith([{ id_registro: 1 }]);

    const resCon = makeRes();
    await RegistroController.getHistorialConsumos(makeReq(), resCon);
    expect(RegistroServiceMock.getHistorialConsumos).toHaveBeenCalledWith(1, {});
    expect(resCon.json).toHaveBeenCalledWith([{ id_consumo: 1 }]);

    RegistroServiceMock.getHistorialEjercicios.mockRejectedValueOnce(new Error('db'));
    const errorEj = makeRes();
    await RegistroController.getHistorialEjercicios(makeReq(), errorEj);
    expect(errorEj.status).toHaveBeenCalledWith(500);

    RegistroServiceMock.getHistorialConsumos.mockRejectedValueOnce(new Error('db'));
    const errorCon = makeRes();
    await RegistroController.getHistorialConsumos(makeReq(), errorCon);
    expect(errorCon.status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────────────────────────────────────────────
// progresoController
// ─────────────────────────────────────────────────────────────
describe('progresoController', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('getResumen sincroniza y devuelve el día solicitado', async () => {
    ProgresoDiarioModel.sincronizar.mockResolvedValueOnce({});
    ProgresoDiarioModel.getByFecha.mockResolvedValueOnce({ fecha: '2026-10-20', agua_vasos: 5 });

    const res = makeRes();
    await ProgresoController.getResumen(makeReq({ query: { fecha: '2026-10-20' } }), res);

    expect(ProgresoDiarioModel.sincronizar).toHaveBeenCalledWith(null, 1, '2026-10-20');
    expect(ProgresoDiarioModel.getByFecha).toHaveBeenCalledWith(1, '2026-10-20');
    expect(res.json).toHaveBeenCalledWith({ fecha: '2026-10-20', agua_vasos: 5 });
  });

  test('getResumen sin fecha usa hoy y devuelve ceros si no hay fila', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-05T12:00:00'));
    ProgresoDiarioModel.sincronizar.mockResolvedValueOnce({});
    ProgresoDiarioModel.getByFecha.mockResolvedValueOnce(null);

    const res = makeRes();
    await ProgresoController.getResumen(makeReq(), res);

    expect(ProgresoDiarioModel.sincronizar).toHaveBeenCalledWith(null, 1, '2026-03-05');
    expect(res.json).toHaveBeenCalledWith({
      fecha: '2026-03-05',
      calorias_consumidas: 0,
      agua_vasos: 0,
      ejercicios_realizados: 0,
    });
  });

  test('getResumen responde 500 si el modelo falla', async () => {
    ProgresoDiarioModel.sincronizar.mockRejectedValueOnce(new Error('db'));

    const res = makeRes();
    await ProgresoController.getResumen(makeReq({ query: { fecha: '2026-10-20' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('updateResumen guarda el estado y responde con el resumen', async () => {
    ProgresoDiarioModel.guardarEstado.mockResolvedValueOnce({ nivel_energia: 4 });

    const res = makeRes();
    await ProgresoController.updateResumen(
      makeReq({ body: { fecha: '21/10/2026', nivel_energia: 4 } }),
      res
    );

    expect(ProgresoDiarioModel.guardarEstado).toHaveBeenCalledWith(1, '2026-10-21', expect.objectContaining({ nivel_energia: 4 }));
    expect(res.json).toHaveBeenCalledWith({
      message: 'Resumen diario actualizado correctamente',
      resumen: { nivel_energia: 4 },
    });
  });

  test('updateResumen valida fecha y traduce errores', async () => {
    const sinFecha = makeRes();
    await ProgresoController.updateResumen(makeReq({ body: {} }), sinFecha);
    expect(sinFecha.status).toHaveBeenCalledWith(400);
    expect(sinFecha.json).toHaveBeenCalledWith({ error: 'fecha es requerida' });

    const invalida = makeRes();
    await ProgresoController.updateResumen(makeReq({ body: { fecha: 'no-es-fecha' } }), invalida);
    expect(invalida.status).toHaveBeenCalledWith(400);

    ProgresoDiarioModel.guardarEstado.mockRejectedValueOnce(errorCon('DATOS_INCOMPLETOS', 'faltan'));
    const incompleto = makeRes();
    await ProgresoController.updateResumen(makeReq({ body: { fecha: '2026-10-21' } }), incompleto);
    expect(incompleto.status).toHaveBeenCalledWith(400);

    ProgresoDiarioModel.guardarEstado.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await ProgresoController.updateResumen(makeReq({ body: { fecha: '2026-10-21' } }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('getHistorial delega y responde 500 ante error', async () => {
    ProgresoDiarioModel.getHistorial.mockResolvedValueOnce([{ fecha: '2026-10-21' }]);
    const ok = makeRes();
    await ProgresoController.getHistorial(makeReq({ query: { fechaInicio: '2026-10-01' } }), ok);
    expect(ProgresoDiarioModel.getHistorial).toHaveBeenCalledWith(1, { fechaInicio: '2026-10-01' });
    expect(ok.json).toHaveBeenCalledWith([{ fecha: '2026-10-21' }]);

    ProgresoDiarioModel.getHistorial.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await ProgresoController.getHistorial(makeReq(), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('getEvolucionEjercicio convierte el id y delega', async () => {
    RegistroServiceMock.getEvolucionEjercicio.mockResolvedValueOnce([{ fecha: '2026-10-21', volumen: 100 }]);
    const ok = makeRes();
    await ProgresoController.getEvolucionEjercicio(
      makeReq({ params: { idEjercicio: '7' }, query: { desde: '2026-10-01' } }),
      ok
    );
    expect(RegistroServiceMock.getEvolucionEjercicio).toHaveBeenCalledWith(1, 7, { desde: '2026-10-01' });
    expect(ok.json).toHaveBeenCalledWith([{ fecha: '2026-10-21', volumen: 100 }]);

    RegistroServiceMock.getEvolucionEjercicio.mockRejectedValueOnce(new Error('db'));
    const error = makeRes();
    await ProgresoController.getEvolucionEjercicio(makeReq({ params: { idEjercicio: '7' } }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────────────────────────────────────────────
// catalogoController (ramas de error no cubiertas)
// ─────────────────────────────────────────────────────────────
describe('catalogoController ramas adicionales', () => {
  test('createAlimento traduce duplicado y error genérico', async () => {
    CatalogoModel.createAlimento
      .mockRejectedValueOnce(errorCon('ER_DUP_ENTRY'))
      .mockRejectedValueOnce(new Error('db'));
    const dup = makeRes();
    await CatalogoController.createAlimento(
      makeReq({ body: { nombre_alimento: 'Pollo', proteinas: 1, carbohidratos: 2, grasas: 3 } }),
      dup
    );
    expect(dup.status).toHaveBeenCalledWith(400);

    const error = makeRes();
    await CatalogoController.createAlimento(
      makeReq({ body: { nombre_alimento: 'Pollo', proteinas: 1, carbohidratos: 2, grasas: 3 } }),
      error
    );
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('updateEjercicio traduce duplicado y error genérico', async () => {
    const body = { nombre_ejercicio: 'Sentadilla', grupo_muscular: 'Pierna', nivel_minimo: 'Principiante' };
    CatalogoModel.updateEjercicio
      .mockRejectedValueOnce(errorCon('ER_DUP_ENTRY'))
      .mockRejectedValueOnce(new Error('db'));

    const dup = makeRes();
    await CatalogoController.updateEjercicio(makeReq({ body }), dup);
    expect(dup.status).toHaveBeenCalledWith(400);

    const error = makeRes();
    await CatalogoController.updateEjercicio(makeReq({ body }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('deleteEjercicio y deleteAlimento responden 500 ante error genérico', async () => {
    CatalogoModel.deleteEjercicio.mockRejectedValueOnce(new Error('db'));
    const errorEj = makeRes();
    await CatalogoController.deleteEjercicio(makeReq({ params: { id: '1' } }), errorEj);
    expect(errorEj.status).toHaveBeenCalledWith(500);

    CatalogoModel.deleteAlimento.mockRejectedValueOnce(new Error('db'));
    const errorAl = makeRes();
    await CatalogoController.deleteAlimento(makeReq({ params: { id: '1' } }), errorAl);
    expect(errorAl.status).toHaveBeenCalledWith(500);
  });

  test('updateAlimento valida, 404, duplicado y error genérico', async () => {
    const body = { nombre_alimento: 'Pollo', proteinas: 1, carbohidratos: 2, grasas: 3 };

    const invalid = makeRes();
    await CatalogoController.updateAlimento(makeReq({ body: {} }), invalid);
    expect(invalid.status).toHaveBeenCalledWith(400);

    CatalogoModel.updateAlimento.mockResolvedValueOnce(0);
    const notFound = makeRes();
    await CatalogoController.updateAlimento(makeReq({ body }), notFound);
    expect(notFound.status).toHaveBeenCalledWith(404);

    CatalogoModel.updateAlimento
      .mockRejectedValueOnce(errorCon('ER_DUP_ENTRY'))
      .mockRejectedValueOnce(new Error('db'));
    const dup = makeRes();
    await CatalogoController.updateAlimento(makeReq({ body }), dup);
    expect(dup.status).toHaveBeenCalledWith(400);

    const error = makeRes();
    await CatalogoController.updateAlimento(makeReq({ body }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('createRestriccion traduce duplicado y error genérico', async () => {
    const body = { nombre_restriccion: 'Asma', tipo: 'Enfermedad' };
    CatalogoModel.createRestriccion
      .mockRejectedValueOnce(errorCon('ER_DUP_ENTRY'))
      .mockRejectedValueOnce(new Error('db'));

    const dup = makeRes();
    await CatalogoController.createRestriccion(makeReq({ body }), dup);
    expect(dup.status).toHaveBeenCalledWith(400);

    const error = makeRes();
    await CatalogoController.createRestriccion(makeReq({ body }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('updateRestriccion valida tipo, duplicado y error genérico', async () => {
    const body = { nombre_restriccion: 'Asma', tipo: 'Enfermedad' };

    const missing = makeRes();
    await CatalogoController.updateRestriccion(makeReq({ body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(400);

    const invalidType = makeRes();
    await CatalogoController.updateRestriccion(
      makeReq({ body: { nombre_restriccion: 'Asma', tipo: 'Otro' } }),
      invalidType
    );
    expect(invalidType.status).toHaveBeenCalledWith(400);

    CatalogoModel.updateRestriccion
      .mockRejectedValueOnce(errorCon('ER_DUP_ENTRY'))
      .mockRejectedValueOnce(new Error('db'));
    const dup = makeRes();
    await CatalogoController.updateRestriccion(makeReq({ body }), dup);
    expect(dup.status).toHaveBeenCalledWith(400);

    const error = makeRes();
    await CatalogoController.updateRestriccion(makeReq({ body }), error);
    expect(error.status).toHaveBeenCalledWith(500);
  });

  test('deleteRestriccion responde 500 ante error genérico', async () => {
    CatalogoModel.deleteRestriccion.mockRejectedValueOnce(new Error('db'));
    const res = makeRes();
    await CatalogoController.deleteRestriccion(makeReq({ params: { id: '1' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────────────────────────────────────────────
// usuarioController (ramas adicionales)
// ─────────────────────────────────────────────────────────────
describe('usuarioController ramas adicionales', () => {
  test('listados y detalle responden 500 ante error del servicio', async () => {
    UsuarioService.getRecepcionistas.mockRejectedValueOnce(new Error('db'));
    UsuarioService.getAll.mockRejectedValueOnce(new Error('db'));
    UsuarioService.getById.mockRejectedValueOnce(new Error('db'));

    const recep = makeRes();
    await UsuarioController.getRecepcionistas(makeReq(), recep);
    expect(recep.status).toHaveBeenCalledWith(500);

    const all = makeRes();
    await UsuarioController.getAll(makeReq(), all);
    expect(all.status).toHaveBeenCalledWith(500);

    const byId = makeRes();
    await UsuarioController.getById(makeReq({ params: { id: '1' } }), byId);
    expect(byId.status).toHaveBeenCalledWith(500);
  });

  test('update traduce todos los mensajes de negocio', async () => {
    const mensajes = [
      'No se enviaron campos para actualizar',
      'No puedes desactivar tu propia cuenta',
      'No puedes cambiar tu propio rol',
    ];
    for (const mensaje of mensajes) {
      UsuarioService.update.mockRejectedValueOnce(new Error(mensaje));
      const res = makeRes();
      await UsuarioController.update(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: mensaje });
    }
  });

  test('guardarPushToken responde 500 ante error del servicio', async () => {
    UsuarioService.guardarPushToken.mockRejectedValueOnce(new Error('db'));
    const res = makeRes();
    await UsuarioController.guardarPushToken(makeReq({ body: { push_token: 'token' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('subirFoto con Cloudinary devuelve la URL y borra la foto anterior', async () => {
    UsuarioService.getFoto.mockResolvedValueOnce('/uploads/vieja.jpg');
    UsuarioService.setFoto.mockResolvedValueOnce(true);

    const res = makeRes();
    await UsuarioController.subirFoto(
      makeReq({
        protocol: 'https',
        get: () => 'api.test',
        file: { path: 'https://cdn.test/nueva.jpg', filename: 'nueva.jpg' },
      }),
      res
    );

    expect(UsuarioService.setFoto).toHaveBeenCalledWith(1, 'https://cdn.test/nueva.jpg');
    expect(eliminarFotoAnterior).toHaveBeenCalledWith('/uploads/vieja.jpg');
    expect(res.json).toHaveBeenCalledWith({
      message: 'Foto de perfil actualizada',
      foto: 'https://cdn.test/nueva.jpg',
      url: 'https://cdn.test/nueva.jpg',
    });
  });

  test('subirFoto no borra la foto anterior si es la misma', async () => {
    UsuarioService.getFoto.mockResolvedValueOnce('/uploads/misma.jpg');
    UsuarioService.setFoto.mockResolvedValueOnce(true);

    const res = makeRes();
    await UsuarioController.subirFoto(
      makeReq({
        protocol: 'http',
        get: () => 'localhost:3000',
        file: { path: '/app/uploads/misma.jpg', filename: 'misma.jpg' },
      }),
      res
    );

    expect(eliminarFotoAnterior).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Foto de perfil actualizada',
      foto: '/uploads/misma.jpg',
      url: 'http://localhost:3000/uploads/misma.jpg',
    });
  });
});

// ─────────────────────────────────────────────────────────────
// notificacionController
// ─────────────────────────────────────────────────────────────
describe('notificacionController', () => {
  test('devuelve las notificaciones del rol', async () => {
    NotificacionModel.getByRole.mockResolvedValueOnce([{ id: 1 }]);
    const res = makeRes();
    await NotificacionController.getNotificaciones(makeReq({ user: { sub: 1, role: 'Administrador' } }), res);
    expect(NotificacionModel.getByRole).toHaveBeenCalledWith('Administrador');
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  test('responde 500 si el modelo falla', async () => {
    NotificacionModel.getByRole.mockRejectedValueOnce(new Error('db'));
    const res = makeRes();
    await NotificacionController.getNotificaciones(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────────────────────────────────────────────
// FiltroService real
// ─────────────────────────────────────────────────────────────
describe('filtroService', () => {
  test('getEjerciciosFiltrados sin filtro devuelve todo', async () => {
    const ejercicios = [{ id_ejercicio: 1 }, { id_ejercicio: 2 }];
    CatalogoModel.getEjerciciosDisponibles.mockResolvedValueOnce(ejercicios);

    await expect(FiltroService.getEjerciciosFiltrados(1)).resolves.toEqual(ejercicios);
    expect(CatalogoModel.getEjerciciosDisponibles).toHaveBeenCalledWith(1);
  });

  test('getEjerciciosFiltrados filtra por grupo muscular sin distinguir mayúsculas', async () => {
    CatalogoModel.getEjerciciosDisponibles.mockResolvedValueOnce([
      { id_ejercicio: 1, grupo_muscular: 'Pierna' },
      { id_ejercicio: 2, grupo_muscular: 'PIERNA' },
      { id_ejercicio: 3, grupo_muscular: 'Brazo' },
      { id_ejercicio: 4 },
    ]);

    const res = await FiltroService.getEjerciciosFiltrados(1, { grupo_muscular: '  pierna  ' });
    expect(res.map(e => e.id_ejercicio)).toEqual([1, 2]);
  });

  test('getAlimentosFiltrados devuelve [] sin catálogo base', async () => {
    CatalogoModel.getAlimentosDisponibles.mockResolvedValueOnce([]);
    await expect(FiltroService.getAlimentosFiltrados(1)).resolves.toEqual([]);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('getAlimentosFiltrados enriquece con calorías y mantiene nulos', async () => {
    CatalogoModel.getAlimentosDisponibles.mockResolvedValueOnce([
      { id_alimento: 1, proteinas: 10 },
      { id_alimento: 2, proteinas: 20 },
      { id_alimento: 3, proteinas: 30 },
    ]);
    pool.query.mockResolvedValueOnce([[
      { id_alimento: 1, calorias_por_100g: 100 },
      { id_alimento: 2, calorias_por_100g: 300 },
    ]]);

    const res = await FiltroService.getAlimentosFiltrados(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('v_alimento_calorias'),
      [[1, 2, 3]]
    );
    expect(res).toEqual([
      { id_alimento: 1, proteinas: 10, calorias_por_100g: 100 },
      { id_alimento: 2, proteinas: 20, calorias_por_100g: 300 },
      { id_alimento: 3, proteinas: 30, calorias_por_100g: null },
    ]);
  });

  test('getAlimentosFiltrados aplica max_kcal conservando calorías desconocidas', async () => {
    CatalogoModel.getAlimentosDisponibles.mockResolvedValueOnce([
      { id_alimento: 1, proteinas: 10 },
      { id_alimento: 2, proteinas: 20 },
      { id_alimento: 3, proteinas: 30 },
    ]);
    pool.query.mockResolvedValueOnce([[
      { id_alimento: 1, calorias_por_100g: 100 },
      { id_alimento: 2, calorias_por_100g: 300 },
    ]]);

    const res = await FiltroService.getAlimentosFiltrados(1, { max_kcal: '200' });
    expect(res.map(a => a.id_alimento)).toEqual([1, 3]);
  });

  test('getAlimentosFiltrados aplica min_proteinas', async () => {
    CatalogoModel.getAlimentosDisponibles.mockResolvedValueOnce([
      { id_alimento: 1, proteinas: 10 },
      { id_alimento: 2, proteinas: 25 },
    ]);
    pool.query.mockResolvedValueOnce([[]]);

    const res = await FiltroService.getAlimentosFiltrados(1, { min_proteinas: '15' });
    expect(res.map(a => a.id_alimento)).toEqual([2]);
  });
});

// ─────────────────────────────────────────────────────────────
// RegistroService real
// ─────────────────────────────────────────────────────────────
describe('registroService', () => {
  describe('registerEjercicio', () => {
    const datos = {
      id_ciclo: 1,
      id_rutina: 2,
      orden: 1,
      fecha: '2026-10-21',
      series: 3,
      repeticiones: 10,
    };

    test('valida datos incompletos', async () => {
      await expect(RegistroService.registerEjercicio(1, {}))
        .rejects.toMatchObject({ code: 'DATOS_INCOMPLETOS' });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test('valida fecha inválida', async () => {
      await expect(RegistroService.registerEjercicio(1, { ...datos, fecha: 'no-es-fecha' }))
        .rejects.toMatchObject({ code: 'DATOS_INVALIDOS' });
      expect(CicloModel.findById).not.toHaveBeenCalled();
    });

    test('valida ciclo inexistente y ajeno', async () => {
      CicloModel.findById.mockResolvedValueOnce(null);
      await expect(RegistroService.registerEjercicio(1, datos))
        .rejects.toMatchObject({ code: 'CICLO_NO_ENCONTRADO' });

      CicloModel.findById.mockResolvedValueOnce({ id_usuario: 99 });
      await expect(RegistroService.registerEjercicio(1, datos))
        .rejects.toMatchObject({ code: 'CICLO_AJENO' });
    });

    test('valida series y repeticiones mínimas', async () => {
      CicloModel.findById.mockResolvedValueOnce({ id_usuario: 1 });
      await expect(RegistroService.registerEjercicio(1, { ...datos, series: 0 }))
        .rejects.toMatchObject({ code: 'DATOS_INVALIDOS' });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test('registra en transacción y confirma', async () => {
      CicloModel.findById.mockResolvedValueOnce({ id_usuario: 1 });
      const conn = makeConn();
      pool.getConnection.mockResolvedValueOnce(conn);
      RegistroEjercicioModel.insertar.mockResolvedValueOnce(11);
      ProgresoDiarioModel.sincronizar.mockResolvedValueOnce({ id_progreso_diario: 5 });

      const res = await RegistroService.registerEjercicio(1, { ...datos, peso_utilizado_kg: 50, notas: 'ok' });

      expect(RegistroEjercicioModel.insertar).toHaveBeenCalledWith(conn, expect.objectContaining({
        id_usuario: 1, id_ciclo: 1, id_rutina: 2, orden: 1, fecha: '2026-10-21', series: 3, repeticiones: 10,
      }));
      expect(ProgresoDiarioModel.sincronizar).toHaveBeenCalledWith(conn, 1, '2026-10-21');
      expect(conn.commit).toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
      expect(res).toEqual({
        message: 'Ejercicio registrado correctamente',
        id_registro: 11,
        resumen: { id_progreso_diario: 5 },
      });
    });

    test('hace rollback y libera la conexión ante error de BD', async () => {
      CicloModel.findById.mockResolvedValueOnce({ id_usuario: 1 });
      const conn = makeConn();
      pool.getConnection.mockResolvedValueOnce(conn);
      RegistroEjercicioModel.insertar.mockRejectedValueOnce(new Error('db'));

      await expect(RegistroService.registerEjercicio(1, datos)).rejects.toThrow('db');
      expect(conn.rollback).toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
      expect(conn.commit).not.toHaveBeenCalled();
    });
  });

  describe('registerConsumoAlimento', () => {
    const datos = {
      id_ciclo: 1,
      num_comida: 2,
      id_alimento: 3,
      fecha: '2026-10-21',
      cantidad_g_consumida: 150,
    };

    test('valida datos incompletos', async () => {
      await expect(RegistroService.registerConsumoAlimento(1, {}))
        .rejects.toMatchObject({ code: 'DATOS_INCOMPLETOS' });
    });

    test('valida cantidad positiva', async () => {
      CicloModel.findById.mockResolvedValueOnce({ id_usuario: 1 });
      await expect(RegistroService.registerConsumoAlimento(1, { ...datos, cantidad_g_consumida: 0 }))
        .rejects.toMatchObject({ code: 'DATOS_INVALIDOS' });
      expect(pool.getConnection).not.toHaveBeenCalled();
    });

    test('registra el consumo y devuelve los macros', async () => {
      CicloModel.findById.mockResolvedValueOnce({ id_usuario: 1 });
      const conn = makeConn();
      pool.getConnection.mockResolvedValueOnce(conn);
      ConsumoAlimentoRealModel.insertar.mockResolvedValueOnce({
        id_consumo: 8,
        calorias_consumidas: 200,
        proteinas_consumidas: 20,
        carbohidratos_consumidos: 10,
        grasas_consumidas: 5,
      });
      ProgresoDiarioModel.sincronizar.mockResolvedValueOnce({ calorias_consumidas: 200 });

      const res = await RegistroService.registerConsumoAlimento(1, datos);

      expect(ConsumoAlimentoRealModel.insertar).toHaveBeenCalledWith(conn, expect.objectContaining({
        id_usuario: 1, id_ciclo: 1, num_comida: 2, id_alimento: 3, fecha: '2026-10-21', cantidad_g_consumida: 150,
      }));
      expect(conn.commit).toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
      expect(res).toEqual({
        message: 'Consumo de alimento registrado correctamente',
        id_consumo: 8,
        calorias_consumidas: 200,
        proteinas_consumidas: 20,
        carbohidratos_consumidos: 10,
        grasas_consumidas: 5,
        resumen: { calorias_consumidas: 200 },
      });
    });

    test('hace rollback y libera la conexión ante error de BD', async () => {
      CicloModel.findById.mockResolvedValueOnce({ id_usuario: 1 });
      const conn = makeConn();
      pool.getConnection.mockResolvedValueOnce(conn);
      ConsumoAlimentoRealModel.insertar.mockRejectedValueOnce(new Error('db'));

      await expect(RegistroService.registerConsumoAlimento(1, datos)).rejects.toThrow('db');
      expect(conn.rollback).toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalled();
      expect(conn.commit).not.toHaveBeenCalled();
    });
  });

  test('historiales y evolución delegan en los modelos', async () => {
    RegistroEjercicioModel.getHistorial.mockResolvedValueOnce([{ id_registro: 1 }]);
    RegistroEjercicioModel.getEvolucion.mockResolvedValueOnce([{ volumen: 100 }]);
    ConsumoAlimentoRealModel.getHistorial.mockResolvedValueOnce([{ id_consumo: 1 }]);

    await expect(RegistroService.getHistorialEjercicios(1, { limit: 10 })).resolves.toEqual([{ id_registro: 1 }]);
    expect(RegistroEjercicioModel.getHistorial).toHaveBeenCalledWith(1, { limit: 10 });

    await expect(RegistroService.getEvolucionEjercicio(1, 3, {})).resolves.toEqual([{ volumen: 100 }]);
    expect(RegistroEjercicioModel.getEvolucion).toHaveBeenCalledWith(1, 3, {});

    await expect(RegistroService.getHistorialConsumos(1, {})).resolves.toEqual([{ id_consumo: 1 }]);
    expect(ConsumoAlimentoRealModel.getHistorial).toHaveBeenCalledWith(1, {});
  });
});
