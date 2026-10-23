'use strict';

// Tests de services/correoService.js: Brevo, fallback SMTP y modo sin config.

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const nodemailer = require('nodemailer');
const { enviarCorreo } = require('../services/correoService');

const ENV_KEYS = [
  'BREVO_API_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_FROM',
];
let envSnapshot;
let fetchMock;
let consoleLog;
let consoleError;

beforeEach(() => {
  envSnapshot = {};
  for (const key of ENV_KEYS) {
    envSnapshot[key] = process.env[key];
    delete process.env[key];
  }
  jest.clearAllMocks();
  fetchMock = jest.fn();
  global.fetch = fetchMock;
  consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
  for (const key of ENV_KEYS) {
    if (envSnapshot[key] === undefined) delete process.env[key];
    else process.env[key] = envSnapshot[key];
  }
});

describe('correoService sin configuración', () => {
  test('devuelve false sin destinatario', async () => {
    await expect(enviarCorreo({ destinatario: '' })).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('devuelve false si no hay Brevo ni SMTP', async () => {
    await expect(enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      text: 'texto',
    })).resolves.toBe(false);
  });
});

describe('correoService con Brevo', () => {
  test('envía html + texto y devuelve true', async () => {
    process.env.BREVO_API_KEY = 'brevo-key';
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
    });

    await expect(enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      html: '<b>Hola</b>',
      text: 'Hola',
    })).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({ method: 'POST' })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual([{ email: 'ana@metafit.com' }]);
    expect(body.htmlContent).toBe('<b>Hola</b>');
    expect(body.textContent).toBe('Hola');
    expect(consoleLog).toHaveBeenCalledWith(
      '[correoService] Correo enviado vía Brevo:',
      'msg-1'
    );
  });

  test('sin html envía solo textContent', async () => {
    process.env.BREVO_API_KEY = 'brevo-key';
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      text: 'texto',
    })).resolves.toBe(true);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.htmlContent).toBeUndefined();
    expect(body.textContent).toBe('texto');
    expect(consoleLog).toHaveBeenCalledWith(
      '[correoService] Correo enviado vía Brevo:',
      'ok'
    );
  });

  test('respuesta no ok cae a SMTP y devuelve true si SMTP funciona', async () => {
    process.env.BREVO_API_KEY = 'brevo-key';
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ message: 'bad key' }),
    });
    const sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });

    await expect(enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      text: 'texto',
    })).resolves.toBe(true);

    expect(consoleError).toHaveBeenCalledWith(
      '[correoService] Brevo API:',
      401,
      JSON.stringify({ message: 'bad key' })
    );
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ana@metafit.com',
      subject: 'Hola',
      text: 'texto',
    }));
  });

  test('json de error que falla al parsear no rompe el flujo', async () => {
    process.env.BREVO_API_KEY = 'brevo-key';
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error('invalid json')),
    });

    await expect(enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      text: 'texto',
    })).resolves.toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      '[correoService] Brevo API:',
      500,
      '{}'
    );
  });

  test('excepción de red cae a SMTP', async () => {
    process.env.BREVO_API_KEY = 'brevo-key';
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    fetchMock.mockRejectedValue(new Error('timeout'));
    const sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });

    await expect(enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      text: 'texto',
    })).resolves.toBe(true);

    expect(consoleError).toHaveBeenCalledWith(
      '[correoService] error Brevo API:',
      'timeout'
    );
    expect(sendMail).toHaveBeenCalled();
  });
});

describe('correoService solo SMTP', () => {
  test('devuelve false si faltan variables SMTP', async () => {
    process.env.SMTP_HOST = 'smtp.test';
    await expect(enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      text: 'texto',
    })).resolves.toBe(false);
  });

  test('envía con html y opciones SMTP personalizadas', async () => {
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_FROM = 'noreply@metafit.com';
    const sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });

    await expect(enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      html: '<b>x</b>',
      text: 'x',
    })).resolves.toBe(true);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.test',
      port: 465,
      secure: true,
      auth: { user: 'user', pass: 'pass' },
    }));
    expect(sendMail).toHaveBeenCalledWith({
      from: '"MetaFit" <noreply@metafit.com>',
      to: 'ana@metafit.com',
      subject: 'Hola',
      text: 'x',
      html: '<b>x</b>',
    });
  });

  test('sin html no agrega la propiedad html', async () => {
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    const sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });

    await enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      text: 'x',
    });

    const mail = sendMail.mock.calls[0][0];
    expect(mail.html).toBeUndefined();
    expect(mail.from).toBe('"MetaFit" <user>');
  });

  test('error de SMTP devuelve false y loguea', async () => {
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(new Error('smtp caído')),
    });

    await expect(enviarCorreo({
      destinatario: 'ana@metafit.com',
      asunto: 'Hola',
      text: 'x',
    })).resolves.toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      '[correoService] error SMTP:',
      'smtp caído'
    );
  });
});
