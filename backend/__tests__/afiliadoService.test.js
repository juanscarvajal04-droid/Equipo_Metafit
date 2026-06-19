// backend/__tests__/afiliadoService.test.js
// ISO 25000 / 3.4 — Pruebas unitarias para normalizarFecha
// Objetivo: demostrar analizabilidad y cobertura de la lógica crítica de negocio.
//
// normalizarFecha vive en utils/fechaUtils.js para que sea completamente
// aislable: sin BD, sin red, sin variables de entorno.
'use strict';

const { normalizarFecha } = require('../utils/fechaUtils');

describe('normalizarFecha', () => {

  // ── Casos válidos ────────────────────────────────────────────────────────────

  test('convierte DD/MM/YYYY al formato YYYY-MM-DD', () => {
    expect(normalizarFecha('04/05/1987')).toBe('1987-05-04');
  });

  test('convierte DD/MM/YYYY con día y mes de un dígito (padStart)', () => {
    expect(normalizarFecha('1/3/2000')).toBe('2000-03-01');
  });

  test('devuelve YYYY-MM-DD sin modificarlo si ya es formato correcto', () => {
    expect(normalizarFecha('1990-12-25')).toBe('1990-12-25');
  });

  test('normaliza un ISO 8601 completo eliminando la parte de hora', () => {
    expect(normalizarFecha('2000-05-20T00:00:00.000Z')).toBe('2000-05-20');
  });

  test('normaliza una fecha con espacio en vez de T (formato BD)', () => {
    expect(normalizarFecha('2000-05-20 12:30:00')).toBe('2000-05-20');
  });

  test('devuelve null cuando la fecha es null', () => {
    expect(normalizarFecha(null)).toBeNull();
  });

  test('devuelve null cuando la fecha es undefined', () => {
    expect(normalizarFecha(undefined)).toBeNull();
  });

  test('devuelve null cuando la fecha es cadena vacía', () => {
    expect(normalizarFecha('')).toBeNull();
  });

  // ── Casos inválidos — deben lanzar Error ─────────────────────────────────────

  test('lanza Error con un mes inválido (2024-13-01)', () => {
    expect(() => normalizarFecha('2024-13-01')).toThrow('Fecha inválida');
  });

  test('lanza Error con texto que no es fecha', () => {
    expect(() => normalizarFecha('no-es-una-fecha')).toThrow('Fecha inválida');
  });

  test('lanza Error con fecha parcial ambigua', () => {
    expect(() => normalizarFecha('32/01/2024')).toThrow('Fecha inválida');
  });
});
