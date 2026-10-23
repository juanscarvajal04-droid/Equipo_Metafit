'use strict';

process.env.JWT_SECRET = 'test-secret';

const AuthService = require('../services/authService');

describe('authService', () => {
  test('falla al cargar si JWT_SECRET no está definido', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    try {
      jest.isolateModules(() => {
        expect(() => require('../services/authService')).toThrow('JWT_SECRET');
      });
    } finally {
      process.env.JWT_SECRET = original;
    }
  });

  test('firma y verifica tokens de reseteo', () => {
    const token = AuthService.signResetToken(7);
    const payload = AuthService.verifyResetToken(token);

    expect(payload.sub).toBe(7);
    expect(payload.tipo).toBe('password_reset');
  });

  test('hashPassword rechaza contraseñas vacías o mayores a 72 bytes', async () => {
    await expect(AuthService.hashPassword('')).rejects.toThrow('72 bytes');
    await expect(AuthService.hashPassword('a'.repeat(73))).rejects.toThrow('72 bytes');
  });

  test('comparePassword rechaza entradas inválidas y compara hashes válidos', async () => {
    await expect(AuthService.comparePassword('', 'hash')).resolves.toBe(false);
    await expect(AuthService.comparePassword('a'.repeat(73), 'hash')).resolves.toBe(false);

    const hash = await AuthService.hashPassword('Clave123');
    await expect(AuthService.comparePassword('Clave123', hash)).resolves.toBe(true);
  });
});
