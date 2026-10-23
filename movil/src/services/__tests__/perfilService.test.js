// movil/src/services/__tests__/perfilService.test.js
// Cubre los 4 wrappers del perfil propio contra la instancia axios.
import { getPerfil, actualizarPerfil, getHistorialCiclos, getRestricciones } from '../perfilService';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn().mockResolvedValue({ data: {} }), patch: jest.fn().mockResolvedValue({ data: {} }) },
}));

// eslint-disable-next-line import/first
const api = require('../api').default;

describe('perfilService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getPerfil consulta /afiliados/me', async () => {
    await getPerfil();
    expect(api.get).toHaveBeenCalledWith('/afiliados/me');
  });

  test('actualizarPerfil hace PATCH con los datos', async () => {
    await actualizarPerfil({ peso_kg: 70 });
    expect(api.patch).toHaveBeenCalledWith('/afiliados/me', { peso_kg: 70 });
  });

  test('getHistorialCiclos y getRestricciones', async () => {
    await getHistorialCiclos();
    expect(api.get).toHaveBeenCalledWith('/afiliados/me/ciclos');

    await getRestricciones();
    expect(api.get).toHaveBeenCalledWith('/afiliados/me/restricciones');
  });
});
