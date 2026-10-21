// backend/__tests__/emailUtils.test.js
// Cobertura de la validación de correo sin regex (S8786).
'use strict';

const { esEmailValido } = require('../utils/emailUtils');

describe('esEmailValido', () => {
  test.each([
    'afiliado@metafit.com',
    'nombre.apellido@sub.dominio.co',
    'a+b@metafit.com',
    'a@b.c',
    '  usuario@metafit.com  ',
  ])('acepta el correo válido %s', (email) => {
    expect(esEmailValido(email)).toBe(true);
  });

  test.each([
    null,
    undefined,
    '',
    '   ',
    'sin-arroba.com',
    '@metafit.com',
    'usuario@',
    'usuario@metafit',
    'usuario@@metafit.com',
    'usuario@.com',
    'usuario@metafit.',
    'usuario @metafit.com',
    'usuario@meta fit.com',
  ])('rechaza el correo inválido %p', (email) => {
    expect(esEmailValido(email)).toBe(false);
  });
});
