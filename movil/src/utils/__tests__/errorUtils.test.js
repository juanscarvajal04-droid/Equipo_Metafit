// movil/src/utils/__tests__/errorUtils.test.js
// Cubre los mensajes de error compartidos por las pantallas móviles.
import { mensajeErrorCarga, mensajeErrorRegistroEjercicio } from '../errorUtils';

describe('mensajeErrorCarga', () => {
  test('distingue red, sesión expirada, permisos y errores del servidor', () => {
    expect(mensajeErrorCarga({})).toBe('Sin conexión. Verificá tu red.');
    expect(mensajeErrorCarga({ response: { status: 401 } })).toBeNull();
    expect(mensajeErrorCarga({ response: { status: 403 } })).toBe(
      'No tenés permiso para ver estos datos.'
    );
    expect(mensajeErrorCarga({ response: { status: 500 } })).toBe(
      'Error al cargar los datos. Intentá más tarde.'
    );
    expect(mensajeErrorCarga({ response: { status: 400 } })).toBe(
      'No se pudieron cargar los datos.'
    );
  });
});

describe('mensajeErrorRegistroEjercicio', () => {
  test('prioriza duplicado, red, servidor y mensaje recibido', () => {
    expect(mensajeErrorRegistroEjercicio({ response: { status: 409 } }, 'otro')).toBe(
      'Ya registraste este ejercicio hoy. Volvé mañana.'
    );
    expect(mensajeErrorRegistroEjercicio({}, 'otro')).toBe(
      'Sin conexión. Verificá tu red.'
    );
    expect(mensajeErrorRegistroEjercicio({ response: { status: 503 } }, 'otro')).toBe(
      'Error del servidor. Intentá más tarde.'
    );
    expect(mensajeErrorRegistroEjercicio({ response: { status: 400 } }, 'Dato inválido')).toBe(
      'Dato inválido'
    );
    expect(mensajeErrorRegistroEjercicio({ response: { status: 400 } })).toBe(
      'No se pudo guardar. Intentá de nuevo.'
    );
  });
});
