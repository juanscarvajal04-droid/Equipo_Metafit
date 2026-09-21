// backend/__tests__/objetivoUtils.test.js
// ISO 25000 / pruebas unitarias para normalizarObjetivoFisico y normalizarNivelExperiencia.
// Vive en utils/objetivoUtils.js: sin BD, sin red, sin variables de entorno.
'use strict';

const {
  quitarTildes,
  normalizarObjetivoFisico,
  normalizarNivelExperiencia,
} = require('../utils/objetivoUtils');

describe('quitarTildes', () => {
  test('quita la tilde de Pérdida de grasa', () => {
    expect(quitarTildes('Pérdida de grasa')).toBe('Perdida de grasa');
  });

  test('deja intacta una cadena sin tildes', () => {
    expect(quitarTildes('Perdida de grasa')).toBe('Perdida de grasa');
  });

  test('maneja undefined sin lanzar', () => {
    expect(quitarTildes(undefined)).toBeUndefined();
  });
});

describe('normalizarObjetivoFisico', () => {
  test('mapea "Pérdida de grasa" (con tilde) al valor ENUM canónico', () => {
    expect(normalizarObjetivoFisico('Pérdida de grasa')).toBe('Perdida de grasa');
  });

  test('mantiene el valor sin tilde', () => {
    expect(normalizarObjetivoFisico('Perdida de grasa')).toBe('Perdida de grasa');
  });

  test('mantiene intactos los demás valores validos', () => {
    expect(normalizarObjetivoFisico('Aumento de masa')).toBe('Aumento de masa');
    expect(normalizarObjetivoFisico('Mantenimiento')).toBe('Mantenimiento');
    expect(normalizarObjetivoFisico('Rehabilitacion')).toBe('Rehabilitacion');
  });
});

describe('normalizarNivelExperiencia', () => {
  test('mantiene intactos los valores validos', () => {
    expect(normalizarNivelExperiencia('Principiante')).toBe('Principiante');
    expect(normalizarNivelExperiencia('Intermedio')).toBe('Intermedio');
    expect(normalizarNivelExperiencia('Avanzado')).toBe('Avanzado');
  });
});