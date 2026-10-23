// movil/src/utils/__tests__/cicloUtils.test.js
import { seleccionarCicloActivo, esCicloActivo, formatearFecha } from '../cicloUtils';

describe('cicloUtils', () => {
  test('selecciona el ciclo activo y tolera listas vacías', () => {
    expect(seleccionarCicloActivo(null)).toBeNull();
    expect(seleccionarCicloActivo([])).toBeNull();
    expect(
      seleccionarCicloActivo([
        { id_ciclo: 1, activo: 0 },
        { id_ciclo: 2, activo: 1 },
      ])
    ).toEqual({ id_ciclo: 2, activo: 1 });
    expect(seleccionarCicloActivo([{ id_ciclo: 3, activo: 0 }])).toEqual({
      id_ciclo: 3,
      activo: 0,
    });
  });

  test('normaliza el estado activo y las fechas', () => {
    expect(esCicloActivo({ activo: 1 })).toBe(true);
    expect(esCicloActivo(null)).toBe(false);
    expect(formatearFecha('2026-10-01T12:00:00.000Z')).toBe('2026-10-01');
    expect(formatearFecha(null)).toBe('-');
  });
});
