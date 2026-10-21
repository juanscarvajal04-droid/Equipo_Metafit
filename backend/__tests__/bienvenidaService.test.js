// backend/__tests__/bienvenidaService.test.js
// Pruebas unitarias del correo de bienvenida, sin SMTP real.
'use strict';

jest.mock('../services/correoService', () => ({
  enviarCorreo: jest.fn(),
}));

const { enviarCorreo } = require('../services/correoService');
const { enviarCorreoBienvenida } = require('../services/bienvenidaService');

const afiliado = {
  nombres: 'Ana',
  apellidos: 'Pérez',
  correo: 'ana@metafit.com',
};

beforeEach(() => {
  enviarCorreo.mockReset();
});

describe('enviarCorreoBienvenida', () => {
  test('devuelve false sin correo o sin contraseña temporal', async () => {
    await expect(enviarCorreoBienvenida({}, 'Temp123!')).resolves.toBe(false);
    await expect(enviarCorreoBienvenida(afiliado, '')).resolves.toBe(false);
    await expect(enviarCorreoBienvenida(null, 'Temp123!')).resolves.toBe(false);
    expect(enviarCorreo).not.toHaveBeenCalled();
  });

  test('envía el correo con HTML y texto que incluyen las credenciales', async () => {
    enviarCorreo.mockResolvedValue(true);

    await expect(enviarCorreoBienvenida(afiliado, 'Temp123!')).resolves.toBe(true);

    expect(enviarCorreo).toHaveBeenCalledTimes(1);
    const payload = enviarCorreo.mock.calls[0][0];
    expect(payload.destinatario).toBe('ana@metafit.com');
    expect(payload.asunto).toContain('Bienvenido a MetaFit');
    expect(payload.html).toContain('Ana Pérez');
    expect(payload.html).toContain('Temp123!');
    expect(payload.text).toContain('Ana Pérez');
    expect(payload.text).toContain('Temp123!');
    expect(payload.text).toContain('Descarga la app');
  });

  test('usa el correo como nombre cuando no hay nombres', async () => {
    enviarCorreo.mockResolvedValue(true);

    await enviarCorreoBienvenida({ correo: 'solo@correo.com' }, 'Otra123!');

    const payload = enviarCorreo.mock.calls[0][0];
    expect(payload.html).toContain('solo@correo.com');
    expect(payload.text).toContain('solo@correo.com');
  });

  test('propaga el false del servicio de correo', async () => {
    enviarCorreo.mockResolvedValue(false);

    await expect(enviarCorreoBienvenida(afiliado, 'Temp123!')).resolves.toBe(false);
  });
});
