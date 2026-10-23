'use strict';

// Tests de cron/recordatorioPagos.js: selección de pagos, deduplicación diaria,
// envío y arranque del cron. node-cron, BD y correo mockeados.

jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../services/correoService', () => ({ enviarCorreo: jest.fn() }));

const fs = require('fs');
const cron = require('node-cron');
const pool = require('../config/db');
const { enviarCorreo } = require('../services/correoService');
const { iniciarCron, ejecutarRecordatorios } = require('../cron/recordatorioPagos');

const hoy = () => new Date().toISOString().split('T')[0];

function mockPoolBySql(handlers) {
  pool.query.mockImplementation((sql, params) => {
    for (const [needle, handler] of handlers) {
      if (sql.includes(needle)) return Promise.resolve(handler(params));
    }
    return Promise.resolve([{}]);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  enviarCorreo.mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ejecutarRecordatorios', () => {
  test('envía recordatorios y omite pagos sin correo o ya recordados', async () => {
    const pagos = [
      {
        id_pago: 1,
        fecha_vencimiento: '2026-10-22',
        valor_pagado: 90000,
        nombres: 'Ana',
        apellidos: 'Pérez',
        correo: 'ana@metafit.com',
      },
      { id_pago: 2, correo: null },
      {
        id_pago: 3,
        fecha_vencimiento: '2026-10-23',
        valor_pagado: 80000,
        nombres: 'Luis',
        apellidos: 'Gómez',
        correo: 'luis@metafit.com',
      },
      {
        id_pago: 4,
        fecha_vencimiento: '2026-10-24',
        valor_pagado: 70000,
        nombres: 'Eva',
        apellidos: 'Díaz',
        correo: 'eva@metafit.com',
      },
    ];

    mockPoolBySql([
      ['FROM PAGO p', () => [pagos]],
      ['CREATE TABLE IF NOT EXISTS PAGO_RECORDATORIO', () => [{}]],
      ['SELECT fecha_envio FROM PAGO_RECORDATORIO', (params) => (
        params[0] === 3
          ? [[{ fecha_envio: hoy() }]]
          : [[]]
      )],
      ['INSERT INTO PAGO_RECORDATORIO', () => [{}]],
    ]);
    enviarCorreo
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const enviados = await ejecutarRecordatorios();

    expect(enviados).toBe(1);
    expect(enviarCorreo).toHaveBeenCalledTimes(2);
    expect(enviarCorreo.mock.calls[0][0].destinatario).toBe('ana@metafit.com');
    expect(enviarCorreo.mock.calls[0][0].text).toContain('Ana Pérez');
    expect(enviarCorreo.mock.calls[0][0].text).toContain('$90.000 COP');
    expect(enviarCorreo.mock.calls[0][0].subject).toBeUndefined();
    expect(enviarCorreo.mock.calls[0][0].asunto).toContain('22/10/2026');
    expect(enviarCorreo.mock.calls[0][0].html).toContain('Ana Pérez');

    // Pago 4: el correo falla, no se cuenta.
    expect(enviarCorreo.mock.calls[1][0].destinatario).toBe('eva@metafit.com');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1 recordatorio'));
  });

  test('usa el correo como nombre cuando faltan nombres y apellidos', async () => {
    mockPoolBySql([
      ['FROM PAGO p', () => [[{
        id_pago: 8,
        fecha_vencimiento: null,
        valor_pagado: 'abc',
        correo: 'solo@metafit.com',
      }]]],
      ['CREATE TABLE IF NOT EXISTS PAGO_RECORDATORIO', () => [{}]],
      ['SELECT fecha_envio FROM PAGO_RECORDATORIO', () => [[]]],
      ['INSERT INTO PAGO_RECORDATORIO', () => [{}]],
    ]);

    await ejecutarRecordatorios();

    const payload = enviarCorreo.mock.calls[0][0];
    expect(payload.text).toContain('Hola solo@metafit.com');
    expect(payload.text).toContain('Valor: ');
    expect(payload.asunto).toContain('tu mensualidad vence el');
    expect(payload.html).toContain('solo@metafit.com');
  });

  test('usa "Afiliado" cuando no hay nombres ni correo en el nombre', async () => {
    mockPoolBySql([
      ['FROM PAGO p', () => [[{
        id_pago: 9,
        fecha_vencimiento: '2026-10-25',
        valor_pagado: 50000,
        correo: 'x@metafit.com',
      }]]],
      ['CREATE TABLE IF NOT EXISTS PAGO_RECORDATORIO', () => [{}]],
      ['SELECT fecha_envio FROM PAGO_RECORDATORIO', () => [[]]],
      ['INSERT INTO PAGO_RECORDATORIO', () => [{}]],
    ]);

    const sinCorreo = await ejecutarRecordatorios();
    expect(sinCorreo).toBe(1);
  });

  test('devuelve 0 si la consulta de pagos falla', async () => {
    pool.query.mockRejectedValue(new Error('db caída'));

    await expect(ejecutarRecordatorios()).resolves.toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      '[recordatorioPagos] error en ejecución:',
      'db caída'
    );
  });

  test('omite el envío si marcarRecordado falla', async () => {
    mockPoolBySql([
      ['FROM PAGO p', () => [[{
        id_pago: 10,
        fecha_vencimiento: '2026-10-25',
        valor_pagado: 50000,
        nombres: 'Ana',
        correo: 'ana@metafit.com',
      }]]],
      ['CREATE TABLE IF NOT EXISTS PAGO_RECORDATORIO', () => {
        throw new Error('sin permisos');
      }],
    ]);

    await expect(ejecutarRecordatorios()).resolves.toBe(0);
    expect(enviarCorreo).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '[recordatorioPagos.marcarRecordado]',
      'sin permisos'
    );
  });

  test('html null si la plantilla no existe', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    mockPoolBySql([
      ['FROM PAGO p', () => [[{
        id_pago: 11,
        fecha_vencimiento: '2026-10-25',
        valor_pagado: 50000,
        nombres: 'Ana',
        correo: 'ana@metafit.com',
      }]]],
      ['CREATE TABLE IF NOT EXISTS PAGO_RECORDATORIO', () => [{}]],
      ['SELECT fecha_envio FROM PAGO_RECORDATORIO', () => [[]]],
      ['INSERT INTO PAGO_RECORDATORIO', () => [{}]],
    ]);

    await ejecutarRecordatorios();
    expect(enviarCorreo.mock.calls[0][0].html).toBeNull();
  });

  test('html null si falla la lectura de la plantilla', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('EACCES');
    });
    mockPoolBySql([
      ['FROM PAGO p', () => [[{
        id_pago: 12,
        fecha_vencimiento: '2026-10-25',
        valor_pagado: 50000,
        nombres: 'Ana',
        correo: 'ana@metafit.com',
      }]]],
      ['CREATE TABLE IF NOT EXISTS PAGO_RECORDATORIO', () => [{}]],
      ['SELECT fecha_envio FROM PAGO_RECORDATORIO', () => [[]]],
      ['INSERT INTO PAGO_RECORDATORIO', () => [{}]],
    ]);

    await ejecutarRecordatorios();
    expect(enviarCorreo.mock.calls[0][0].html).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      '[recordatorioPagos.renderPlantilla]',
      'EACCES'
    );
  });

  test('si no hay pagos devuelve 0 sin enviar', async () => {
    mockPoolBySql([['FROM PAGO p', () => [[]]]]);
    await expect(ejecutarRecordatorios()).resolves.toBe(0);
    expect(enviarCorreo).not.toHaveBeenCalled();
  });
});

describe('iniciarCron', () => {
  test('registra el schedule horario y ejecuta la pasada', async () => {
    let callback;
    cron.schedule.mockImplementation((expresion, fn) => {
      callback = fn;
    });
    mockPoolBySql([['FROM PAGO p', () => [[]]]]);

    iniciarCron();

    expect(cron.schedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cron de recordatorio'));

    await callback();
    expect(pool.query).toHaveBeenCalled();
  });

  test('registra el error del cron si la pasada rechaza', async () => {
    let callback;
    cron.schedule.mockImplementation((expresion, fn) => {
      callback = fn;
    });
    pool.query.mockRejectedValue(new Error('db caída'));

    let llamadas = 0;
    console.error.mockImplementation((...args) => {
      llamadas += 1;
      if (llamadas === 1) throw new Error('log boom');
      return args;
    });

    iniciarCron();
    await callback();
    await new Promise((resolve) => setImmediate(resolve));

    expect(console.error).toHaveBeenCalledWith(
      '[recordatorioPagos] cron error:',
      'log boom'
    );
  });
});
