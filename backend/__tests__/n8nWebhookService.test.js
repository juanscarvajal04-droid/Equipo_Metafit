// backend/__tests__/n8nWebhookService.test.js
// Pruebas unitarias de los webhooks n8n: configurado, no configurado y payloads.
'use strict';

jest.mock('axios', () => ({ post: jest.fn() }));

function cargarServicio(url) {
  process.env.N8N_WEBHOOK_URL = url;
  jest.resetModules();
  const axiosMock = require('axios');
  const service = require('../services/n8nWebhookService');
  return { service, axiosMock };
}

let envOriginal;

beforeEach(() => {
  envOriginal = process.env.N8N_WEBHOOK_URL;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  if (envOriginal === undefined) delete process.env.N8N_WEBHOOK_URL;
  else process.env.N8N_WEBHOOK_URL = envOriginal;
  jest.restoreAllMocks();
});

describe('dispararWebhook', () => {
  test('omite el envío si N8N_WEBHOOK_URL no está configurada', async () => {
    const { service, axiosMock } = cargarServicio('');

    await service.dispararWebhook('/webhook/test', { a: 1 });

    expect(axiosMock.post).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('N8N_WEBHOOK_URL no configurada')
    );
  });

  test('envía el webhook a la URL configurada y quita la barra final', async () => {
    const { service, axiosMock } = cargarServicio('https://n8n.example.com/');
    axiosMock.post.mockResolvedValue({ status: 200 });

    await service.dispararWebhook('/webhook/test', { a: 1 });

    expect(axiosMock.post).toHaveBeenCalledWith(
      'https://n8n.example.com/webhook/test',
      { a: 1 },
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    expect(console.log).toHaveBeenCalledWith(
      '[n8n] Webhook /webhook/test enviado OK'
    );
  });

  test('no relanza si el webhook falla', async () => {
    const { service, axiosMock } = cargarServicio('https://n8n.example.com');
    axiosMock.post.mockRejectedValue(new Error('n8n caído'));

    await expect(
      service.dispararWebhook('/webhook/test', { a: 1 })
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      '[n8n] Webhook /webhook/test falló: n8n caído'
    );
  });
});

describe('payloads de notificación', () => {
  test('notificarPago enviar los datos del pago y del afiliado', async () => {
    const { service, axiosMock } = cargarServicio('https://n8n.example.com');
    axiosMock.post.mockResolvedValue({ status: 200 });

    await service.notificarPago(
      {
        id_pago: 7,
        fecha_pago: '2026-10-20',
        valor_pagado: 85000,
        estado: 'Pagado',
        metodo_pago: 'Efectivo',
        fecha_vencimiento: '2026-11-20',
      },
      {
        id: 3,
        nombres: 'Ana',
        apellidos: 'Pérez',
        correo: 'ana@metafit.com',
        telefono: null,
      }
    );

    const [url, payload] = axiosMock.post.mock.calls[0];
    expect(url).toContain('/webhook/factura-pago');
    expect(payload.evento).toBe('pago_registrado');
    expect(payload.pago.id_pago).toBe(7);
    expect(payload.afiliado.nombre).toBe('Ana Pérez');
    expect(payload.afiliado.telefono).toBeNull();
    expect(payload.timestamp).toEqual(expect.any(String));
  });

  test('notificarNuevoAfiliado usa "Sin nombre" si falta el nombre', async () => {
    const { service, axiosMock } = cargarServicio('https://n8n.example.com');
    axiosMock.post.mockResolvedValue({ status: 200 });

    await service.notificarNuevoAfiliado(
      {
        id: 9,
        correo: 'nuevo@metafit.com',
        numero_documento: '999',
        objetivo_fisico: 'Mantenimiento',
      },
      'Temp123!'
    );

    const [url, payload] = axiosMock.post.mock.calls[0];
    expect(url).toContain('/webhook/nuevo-afiliado');
    expect(payload.evento).toBe('nuevo_afiliado');
    expect(payload.afiliado.nombre).toBe('Sin nombre');
    expect(payload.afiliado.documento).toBe('999');
    expect(payload.password_temporal).toBe('Temp123!');
  });

  test('notificarRutinaAsignada envía el ciclo y el afiliado', async () => {
    const { service, axiosMock } = cargarServicio('https://n8n.example.com');
    axiosMock.post.mockResolvedValue({ status: 200 });

    await service.notificarRutinaAsignada(
      { id: 4, nombres: 'Luis', correo: 'luis@metafit.com' },
      { id_ciclo: 11, fecha_inicio: '2026-10-01', fecha_fin: '2026-10-31' }
    );

    const [url, payload] = axiosMock.post.mock.calls[0];
    expect(url).toContain('/webhook/rutina-asignada');
    expect(payload.evento).toBe('rutina_asignada');
    expect(payload.afiliado.nombre).toBe('Luis');
    expect(payload.ciclo.id).toBe(11);
    expect(payload.ciclo.fecha_fin).toBe('2026-10-31');
  });
});
