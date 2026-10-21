'use strict';

// Tests unitarios de UsuarioModel: mapeo de filas y construcción del UPDATE.

jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../services/authService', () => ({
  hashPassword: jest.fn().mockResolvedValue('hash-bcrypt'),
}));

const pool = require('../config/db');
const UsuarioModel = require('../models/usuarioModel');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usuarioModel', () => {
  test('findByEmail devuelve la fila o null', async () => {
    pool.query.mockResolvedValueOnce([[{ id_usuario: 1 }]]);
    await expect(UsuarioModel.findByEmail('ana@metafit.com')).resolves.toEqual({ id_usuario: 1 });

    pool.query.mockResolvedValueOnce([[]]);
    await expect(UsuarioModel.findByEmail('nadie@metafit.com')).resolves.toBeNull();
  });

  test('findAll, findRecepcionistas y findById', async () => {
    pool.query.mockResolvedValueOnce([[{ id_usuario: 1 }]]);
    await expect(UsuarioModel.findAll()).resolves.toEqual([{ id_usuario: 1 }]);

    pool.query.mockResolvedValueOnce([[{ id_usuario: 2 }]]);
    await expect(UsuarioModel.findRecepcionistas()).resolves.toEqual([{ id_usuario: 2 }]);

    pool.query.mockResolvedValueOnce([[{ id_usuario: 3 }]]);
    await expect(UsuarioModel.findById(3)).resolves.toEqual({ id_usuario: 3 });

    pool.query.mockResolvedValueOnce([[]]);
    await expect(UsuarioModel.findById(99)).resolves.toBeNull();
  });

  test('create hashea la contraseña y usa estado por defecto', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 7 }]);
    const id = await UsuarioModel.create({
      nombres: 'Ana',
      apellidos: 'Pérez',
      correo: 'ana@metafit.com',
      contrasena: 'secreto',
      rol: 'Recepcionista',
    });
    expect(id).toBe(7);
    expect(pool.query.mock.calls[0][1]).toEqual([
      'Ana',
      'Pérez',
      'ana@metafit.com',
      'hash-bcrypt',
      'Recepcionista',
      'Pendiente',
    ]);
  });

  test('update construye sets sólo con campos permitidos', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const affected = await UsuarioModel.update(1, {
      nombres: 'Ana',
      estado: 'Activo',
      campoIgnorado: 'x',
    });
    expect(affected).toBe(1);
    expect(pool.query.mock.calls[0][0]).toContain('nombres = ?');
    expect(pool.query.mock.calls[0][0]).not.toContain('campoIgnorado');
  });

  test('update hashea nueva contraseña y devuelve 0 sin campos', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await UsuarioModel.update(1, { contrasena: 'nueva' });
    expect(pool.query.mock.calls[0][1]).toContain('hash-bcrypt');

    await expect(UsuarioModel.update(1, {})).resolves.toBe(0);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  test('getFoto y setFoto usan USUARIO.foto', async () => {
    pool.query.mockResolvedValueOnce([[{ foto: '/uploads/staff.jpg' }]]);
    await expect(UsuarioModel.getFoto(3)).resolves.toBe('/uploads/staff.jpg');

    pool.query.mockResolvedValueOnce([[]]);
    await expect(UsuarioModel.getFoto(99)).resolves.toBeNull();

    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(UsuarioModel.setFoto(3, '/uploads/staff.jpg')).resolves.toBe(true);

    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(UsuarioModel.setFoto(99, '/uploads/staff.jpg')).resolves.toBe(false);
  });

  test('delete devuelve affectedRows', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(UsuarioModel.delete(4)).resolves.toBe(1);
    expect(pool.query).toHaveBeenCalledWith('DELETE FROM USUARIO WHERE id_usuario = ?', [4]);
  });
});
