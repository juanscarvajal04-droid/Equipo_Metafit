'use strict';

// Tests unitarios de UsuarioService: normalización, reglas de
// auto-modificación y auto-sanación del push token.

jest.mock('../models/usuarioModel', () => ({
  findAll: jest.fn(),
  findRecepcionistas: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  getFoto: jest.fn(),
  setFoto: jest.fn(),
  delete: jest.fn(),
}));
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../migrations/migracionPushToken', () => ({
  asegurarColumnaPushToken: jest.fn().mockResolvedValue(undefined),
}));

const UsuarioModel = require('../models/usuarioModel');
const pool = require('../config/db');
const { asegurarColumnaPushToken } = require('../migrations/migracionPushToken');
const UsuarioService = require('../services/usuarioService');

const USUARIO_DB = {
  id_usuario: 1,
  nombres: 'Ana',
  apellidos: 'Pérez',
  correo: 'ana@metafit.com',
  rol: 'Recepcionista',
  estado: 'Activo',
  foto: '/uploads/ana.jpg',
  fecha_registro: '2026-01-01',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usuarioService - consultas y normalización', () => {
  test('getAll y getRecepcionistas normalizan la lista', async () => {
    UsuarioModel.findAll.mockResolvedValue([USUARIO_DB]);
    UsuarioModel.findRecepcionistas.mockResolvedValue([USUARIO_DB]);

    const all = await UsuarioService.getAll();
    expect(all[0]).toMatchObject({
      id: 1,
      id_usuario: 1,
      correo: 'ana@metafit.com',
      email: 'ana@metafit.com',
      rol: 'Recepcionista',
      role: 'Recepcionista',
    });
    expect(await UsuarioService.getRecepcionistas()).toHaveLength(1);
  });

  test('getById normaliza y devuelve null si no existe', async () => {
    UsuarioModel.findById.mockResolvedValueOnce(USUARIO_DB).mockResolvedValueOnce(null);
    expect((await UsuarioService.getById(1)).nombres).toBe('Ana');
    await expect(UsuarioService.getById(99)).resolves.toBeNull();
  });

  test('getFoto y setFoto delegan en el modelo', async () => {
    UsuarioModel.getFoto.mockResolvedValue('/uploads/ana.jpg');
    UsuarioModel.setFoto.mockResolvedValue(true);

    await expect(UsuarioService.getFoto(1)).resolves.toBe('/uploads/ana.jpg');
    await expect(UsuarioService.setFoto(1, '/uploads/ana.jpg')).resolves.toBe(true);
    expect(UsuarioModel.getFoto).toHaveBeenCalledWith(1);
    expect(UsuarioModel.setFoto).toHaveBeenCalledWith(1, '/uploads/ana.jpg');
  });
});

describe('usuarioService - push token', () => {
  test('guarda el token directamente', async () => {
    pool.query.mockResolvedValueOnce([{}]);
    await UsuarioService.guardarPushToken(1, 'ExpoToken');
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE USUARIO SET push_token = ? WHERE id_usuario = ?',
      ['ExpoToken', 1]
    );
    expect(asegurarColumnaPushToken).not.toHaveBeenCalled();
  });

  test('auto-sana la columna si no existe y reintenta', async () => {
    pool.query
      .mockRejectedValueOnce(Object.assign(new Error('col'), { code: 'ER_BAD_FIELD_ERROR' }))
      .mockResolvedValueOnce([{}]);
    await UsuarioService.guardarPushToken(1, 'ExpoToken');
    expect(asegurarColumnaPushToken).toHaveBeenCalled();
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  test('propaga errores distintos a la columna ausente', async () => {
    pool.query.mockRejectedValueOnce(new Error('db'));
    await expect(UsuarioService.guardarPushToken(1, 'x')).rejects.toThrow('db');
  });
});

describe('usuarioService - CRUD', () => {
  test('create exige campos y normaliza al creado', async () => {
    await expect(UsuarioService.create({})).rejects.toThrow('Todos los campos son requeridos');

    UsuarioModel.create.mockResolvedValue(1);
    UsuarioModel.findById.mockResolvedValue(USUARIO_DB);
    const user = await UsuarioService.create({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@metafit.com',
      password: 'secreto',
      rol: 'Recepcionista',
    });
    expect(UsuarioModel.create).toHaveBeenCalledWith({
      nombres: 'Ana',
      apellidos: 'Pérez',
      correo: 'ana@metafit.com',
      contrasena: 'secreto',
      rol: 'Recepcionista',
      estado: undefined,
    });
    expect(user.id).toBe(1);
  });

  test('update bloquea autodesactivación y cambio de rol', async () => {
    await expect(
      UsuarioService.update(1, { estado: 'Inactivo' }, 1, 'Administrador')
    ).rejects.toThrow('No puedes desactivar tu propia cuenta');
    await expect(
      UsuarioService.update(1, { rol: 'Entrenador' }, 1, 'Administrador')
    ).rejects.toThrow('No puedes cambiar tu propio rol');
  });

  test('update exige campos, devuelve null o normaliza', async () => {
    await expect(UsuarioService.update(2, {}, 1, 'Administrador')).rejects.toThrow(
      'No se enviaron campos para actualizar'
    );

    UsuarioModel.update.mockResolvedValueOnce(0);
    await expect(
      UsuarioService.update(2, { nombres: 'Luis' }, 1, 'Administrador')
    ).resolves.toBeNull();

    UsuarioModel.update.mockResolvedValueOnce(1);
    UsuarioModel.findById.mockResolvedValue(USUARIO_DB);
    const user = await UsuarioService.update(2, { nombres: 'Ana' }, 1, 'Administrador');
    expect(user.nombres).toBe('Ana');
  });

  test('delete impide auto-eliminación y devuelve booleanos', async () => {
    await expect(UsuarioService.delete(1, 1)).rejects.toThrow('No puedes eliminarte a ti mismo');

    UsuarioModel.delete.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    await expect(UsuarioService.delete(2, 1)).resolves.toBe(false);
    await expect(UsuarioService.delete(2, 1)).resolves.toBe(true);
  });

  test('normalizarUsuario maneja null y todos los alias', () => {
    expect(UsuarioService.normalizarUsuario(null)).toBeNull();
    expect(UsuarioService.normalizarUsuario(USUARIO_DB)).toEqual({
      id: 1,
      id_usuario: 1,
      correo: 'ana@metafit.com',
      email: 'ana@metafit.com',
      rol: 'Recepcionista',
      role: 'Recepcionista',
      nombres: 'Ana',
      apellidos: 'Pérez',
      estado: 'Activo',
      foto: '/uploads/ana.jpg',
      fecha_registro: '2026-01-01',
    });
  });
});
