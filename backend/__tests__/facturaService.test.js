// backend/__tests__/facturaService.test.js
// Pruebas unitarias del envío de facturas: Brevo, fallback SMTP y errores.
'use strict';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const fs = require('fs');
const nodemailer = require('nodemailer');
const { enviarFacturaPago } = require('../services/facturaService');

const ENV_KEYS = [
  'BREVO_API_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_FROM',
];

const pago = {
  id_pago: 42,
  fecha_pago: '2026-10-20',
  valor_pagado: 85000,
  metodo_pago: 'Transferencia',
  estado: 'Pagado',
};

const afiliado = {
  nombres: 'Ana',
  apellidos: 'Pérez',
  correo: 'ana@metafit.com',
  documento: '123456',
  telefono: '3001234567',
};

let envGuardado;
let fetchOriginal;

beforeEach(() => {
  envGuardado = {};
  for (const key of ENV_KEYS) {
    envGuardado[key] = process.env[key];
    delete process.env[key];
  }
  fetchOriginal = global.fetch;
  global.fetch = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  nodemailer.createTransport.mockReset();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (envGuardado[key] === undefined) delete process.env[key];
    else process.env[key] = envGuardado[key];
  }
  global.fetch = fetchOriginal;
  jest.restoreAllMocks();
});

describe('enviarFacturaPago', () => {
  test('devuelve false si el afiliado no tiene correo', async () => {
    await expect(enviarFacturaPago(pago, {})).resolves.toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('devuelve false si no hay Brevo ni SMTP configurado', async () => {
    await expect(enviarFacturaPago(pago, afiliado)).resolves.toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('envía por Brevo y arma el HTML con los datos de la factura', async () => {
    process.env.BREVO_API_KEY = 'brevo-test-key';
    global.fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ messageId: 'abc' }),
    });

    await expect(enviarFacturaPago(pago, afiliado)).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(options.headers['api-key']).toBe('brevo-test-key');

    const body = JSON.parse(options.body);
    expect(body.to).toEqual([{ email: 'ana@metafit.com' }]);
    expect(body.subject).toContain('Ana Pérez');
    expect(body.htmlContent).toContain('Ana Pérez');
    expect(body.htmlContent).toContain('FAC-');
    expect(body.htmlContent).toContain('85');
    expect(body.textContent).toContain('Transferencia');
    expect(body.textContent).toContain('20/10/2026');
  });

  test('si Brevo falla, usa SMTP como fallback', async () => {
    process.env.BREVO_API_KEY = 'brevo-test-key';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-pass';
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ message: 'error' }),
    });
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'smtp-1' });
    nodemailer.createTransport.mockReturnValue({ sendMail });

    await expect(enviarFacturaPago(pago, afiliado)).resolves.toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toEqual(
      expect.objectContaining({ to: 'ana@metafit.com', subject: expect.stringContaining('Factura') })
    );
  });

  test('devuelve false si Brevo lanza y no hay SMTP', async () => {
    process.env.BREVO_API_KEY = 'brevo-test-key';
    global.fetch.mockRejectedValue(new Error('network down'));

    await expect(enviarFacturaPago(pago, afiliado)).resolves.toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      '[facturaService] error Brevo API:',
      'network down'
    );
  });

  test('envía solo por SMTP cuando no hay BREVO_API_KEY', async () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-pass';
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'smtp-2' });
    nodemailer.createTransport.mockReturnValue({ sendMail });

    await expect(enviarFacturaPago(pago, afiliado)).resolves.toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  test('devuelve false si SMTP falla', async () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-pass';
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(new Error('smtp caído')),
    });

    await expect(enviarFacturaPago(pago, afiliado)).resolves.toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      '[facturaService] error SMTP:',
      'smtp caído'
    );
  });

  test('omite htmlContent si la plantilla no existe', async () => {
    process.env.BREVO_API_KEY = 'brevo-test-key';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(enviarFacturaPago(pago, afiliado)).resolves.toBe(true);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).not.toHaveProperty('htmlContent');
    expect(body.textContent).toContain('Ana Pérez');
  });
});
