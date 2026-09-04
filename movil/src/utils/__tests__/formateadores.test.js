// movil/src/utils/__tests__/formateadores.test.js
import {
  formatearFechaLegible,
  formatearNumero,
  capitalizar,
  formatearPeso,
  formatearAltura,
  calcularIMC,
  nombreComida,
} from '../formateadores';

describe('formatearFechaLegible', () => {
  test('convierte YYYY-MM-DD a DD/MM/YYYY', () => {
    expect(formatearFechaLegible('2026-09-01')).toBe('01/09/2026');
  });

  test('tolera fechas ISO (datetime) sin desfase de zona horaria', () => {
    expect(formatearFechaLegible('2026-09-01T12:00:00.000Z')).toBe('01/09/2026');
  });

  test('devuelve "-" para valores vacíos', () => {
    expect(formatearFechaLegible(null)).toBe('-');
    expect(formatearFechaLegible('')).toBe('-');
  });
});

describe('formatearNumero', () => {
  test('redondea con decimales', () => {
    expect(formatearNumero(26.623, 2)).toBe('26.62');
  });

  test('sin decimales por defecto', () => {
    expect(formatearNumero('82')).toBe('82');
  });

  test('devuelve "-" si no es un número', () => {
    expect(formatearNumero('n/a')).toBe('-');
  });
});

describe('capitalizar', () => {
  test('capitaliza la primera letra de cada palabra', () => {
    expect(capitalizar('piernas')).toBe('Piernas');
    expect(capitalizar('PECHO')).toBe('Pecho');
  });

  test('tolera vacío', () => {
    expect(capitalizar(null)).toBe('');
    expect(capitalizar('')).toBe('');
  });
});

describe('peso y altura', () => {
  test('formatea con unidad', () => {
    expect(formatearPeso(82)).toBe('82 kg');
    expect(formatearAltura(175.5)).toBe('175.5 cm');
  });

  test('devuelve "-" si faltan', () => {
    expect(formatearPeso(null)).toBe('-');
    expect(formatearAltura(undefined)).toBe('-');
  });
});

describe('calcularIMC', () => {
  test('calcula IMC igual que el backend (82 kg, 175.5 cm)', () => {
    expect(calcularIMC(82, 175.5)).toBe(26.62);
  });

  test('devuelve null si faltan datos', () => {
    expect(calcularIMC(0, 175)).toBeNull();
    expect(calcularIMC(82, null)).toBeNull();
  });
});

describe('nombreComida', () => {
  test('mapea comidas por horario', () => {
    expect(nombreComida(1)).toBe('Desayuno');
    expect(nombreComida(2)).toBe('Almuerzo');
    expect(nombreComida(3)).toBe('Cena');
    expect(nombreComida(4)).toBe('Snack');
  });

  test('fallback para números sin mapeo', () => {
    expect(nombreComida(5)).toBe('Comida 5');
    expect(nombreComida()).toBe('Comida undefined');
  });
});