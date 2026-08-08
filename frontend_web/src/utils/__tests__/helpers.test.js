// frontend_web/src/utils/__tests__/helpers.test.js
// Unit test de funciones puras de utilidades de afiliados.
import { describe, it, expect } from 'vitest';
import {
  getId,
  nombreCompleto,
  inicial,
  cicloActivo,
  toDateInput,
} from '../afiliadoHelpers';

describe('getId', () => {
  it('retorna el id compatible priorizando id_usuario', () => {
    expect(getId({ id_usuario: 1, id_afiliado: 2 })).toBe(1);
  });

  it('retorna id_afiliado si no hay id_usuario', () => {
    expect(getId({ id_afiliado: 9 })).toBe(9);
  });

  it('retorna null si no recibe nada', () => {
    expect(getId(null)).toBeNull();
    expect(getId(undefined)).toBeNull();
  });
});

describe('nombreCompleto', () => {
  it('combina nombres y apellidos', () => {
    expect(nombreCompleto({ nombres: 'Carlos', apellidos: 'Ramírez' })).toBe('Carlos Ramírez');
  });

  it('usa el correo como fallback si no hay nombres', () => {
    expect(nombreCompleto({ email: 'karla@metafit.com' })).toBe('karla@metafit.com');
  });

  it('devuelve "Sin nombre" para datos vacíos', () => {
    expect(nombreCompleto(null)).toBe('Sin nombre');
  });
});

describe('inicial', () => {
  it('devuelve la inicial en mayúscula', () => {
    expect(inicial({ nombres: 'ana' })).toBe('A');
  });

  it('devuelve "?" sin datos', () => {
    expect(inicial(null)).toBe('?');
  });
});

describe('cicloActivo', () => {
  it('devuelve el ciclo activo del afiliado', () => {
    expect(cicloActivo({ ciclo_activo: '2026-I' })).toBe('2026-I');
  });

  it('devuelve null si no hay ciclo', () => {
    expect(cicloActivo({})).toBeNull();
    expect(cicloActivo(null)).toBeNull();
  });
});

describe('toDateInput', () => {
  it('formatea ISO a YYYY-MM-DD', () => {
    expect(toDateInput('2026-08-08T20:00:00.000Z')).toBe('2026-08-08');
  });

  it('devuelve string vacío sin fecha', () => {
    expect(toDateInput(null)).toBe('');
    expect(toDateInput('')).toBe('');
  });
});