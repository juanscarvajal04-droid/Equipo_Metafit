// movil/src/services/__tests__/registroService.test.js
// Verifica los endpoints de registros reales de ejercicio y consumo.
import api from '../api';
import {
  registrarEjercicioReal,
  registrarConsumoReal,
  getHistorialEjerciciosReales,
  getHistorialConsumosReales,
} from '../registroService';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('registroService', () => {
  test('envía los registros reales al backend', () => {
    const ejercicio = { series: 3 };
    const consumo = { cantidad_g_consumida: 150 };

    registrarEjercicioReal(ejercicio);
    registrarConsumoReal(consumo);

    expect(api.post).toHaveBeenCalledWith('/afiliados/me/registro-ejercicio', ejercicio);
    expect(api.post).toHaveBeenCalledWith('/afiliados/me/consumo-alimento-real', consumo);
  });

  test('consulta los historiales con y sin parámetros', () => {
    getHistorialEjerciciosReales();
    getHistorialConsumosReales({ limite: 10 });

    expect(api.get).toHaveBeenCalledWith('/afiliados/me/registro-ejercicio/historial', {
      params: {},
    });
    expect(api.get).toHaveBeenCalledWith('/afiliados/me/consumo-alimento-real/historial', {
      params: { limite: 10 },
    });
  });
});
