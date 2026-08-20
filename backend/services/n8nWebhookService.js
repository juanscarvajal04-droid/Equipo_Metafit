// backend/services/n8nWebhookService.js
// Servicio para disparar webhooks a n8n (fire-and-forget).
// Si n8n no está disponible, se registra el error pero NO afecta la operación principal.
'use strict';

const axios = require('axios');

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'http://n8n:5678';
const N8N_TIMEOUT = 5000; // 5 segundos máximo de espera

/**
 * Dispara un webhook a n8n de forma asíncrona (fire-and-forget).
 * @param {string} path - Ruta del webhook (ej: '/webhook/factura-pago')
 * @param {object} payload - Datos a enviar
 * @returns {Promise<void>}
 */
async function dispararWebhook(path, payload) {
  try {
    await axios.post(`${N8N_BASE_URL}${path}`, payload, {
      timeout: N8N_TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`[n8n] Webhook ${path} enviado OK`);
  } catch (err) {
    // Nunca falla la operación principal por un webhook
    console.error(`[n8n] Webhook ${path} falló: ${err.message}`);
  }
}

/**
 * Notifica a n8n sobre un pago registrado (factura + recordatorio).
 */
async function notificarPago(pago, afiliado) {
  await dispararWebhook('/webhook/factura-pago', {
    evento: 'pago_registrado',
    pago: {
      id_pago: pago.id_pago,
      fecha_pago: pago.fecha_pago,
      valor_pagado: pago.valor_pagado,
      estado: pago.estado,
      metodo_pago: pago.metodo_pago,
      fecha_vencimiento: pago.fecha_vencimiento,
    },
    afiliado: {
      id: afiliado.id,
      nombre: afiliado.nombres ? `${afiliado.nombres} ${afiliado.apellidos || ''}`.trim() : 'Afiliado',
      correo: afiliado.correo,
      telefono: afiliado.telefono || null,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notifica a n8n sobre un nuevo afiliado registrado.
 */
async function notificarNuevoAfiliado(afiliado, passwordTemporal) {
  await dispararWebhook('/webhook/nuevo-afiliado', {
    evento: 'nuevo_afiliado',
    afiliado: {
      id: afiliado.id,
      nombre: afiliado.nombres ? `${afiliado.nombres} ${afiliado.apellidos || ''}`.trim() : 'Sin nombre',
      correo: afiliado.correo,
      telefono: afiliado.telefono || null,
      documento: afiliado.numero_documento || null,
      objetivo: afiliado.objetivo_fisico || null,
    },
    password_temporal: passwordTemporal || null,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notifica a n8n sobre una rutina asignada.
 */
async function notificarRutinaAsignada(afiliado, ciclo) {
  await dispararWebhook('/webhook/rutina-asignada', {
    evento: 'rutina_asignada',
    afiliado: {
      id: afiliado.id,
      nombre: afiliado.nombres ? `${afiliado.nombres} ${afiliado.apellidos || ''}`.trim() : 'Afiliado',
      correo: afiliado.correo,
    },
    ciclo: {
      id: ciclo.id_ciclo,
      fecha_inicio: ciclo.fecha_inicio,
      fecha_fin: ciclo.fecha_fin,
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  dispararWebhook,
  notificarPago,
  notificarNuevoAfiliado,
  notificarRutinaAsignada,
};
