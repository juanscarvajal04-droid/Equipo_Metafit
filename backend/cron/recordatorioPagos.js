// backend/cron/recordatorioPagos.js
// ─── Recordatorio automático de pagos por vencer ──────────────────────
// Cada hora revisa los pagos cuyo vencimiento está dentro de los
// próximos 3 días y envía un correo recordatorio al afiliado.
// Evita reenviar el mismo día (se revisa si ya se envió hoy).
'use strict';

const fs   = require('fs');
const path = require('path');
const cron = require('node-cron');
const pool = require('../config/db');
const { enviarCorreo } = require('../services/correoService');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'recordatorio-pago.html');
const DIAS_AVISO = 3;

const hoyISO = () => new Date().toISOString().split('T')[0];

/** Pagos por vencer (vencimiento en [hoy, hoy+3]) aún no recordados hoy. */
async function obtenerPagosPorVencer() {
  const hasta = new Date(Date.now() + DIAS_AVISO * 86400000).toISOString().split('T')[0];
  const [rows] = await pool.query(
    `SELECT p.id_pago, p.fecha_vencimiento, p.valor_pagado, p.estado,
            u.nombres, u.apellidos, u.correo
       FROM PAGO p
       JOIN USUARIO u ON u.id_usuario = p.id_usuario
      WHERE p.fecha_vencimiento BETWEEN CURDATE() AND ?
        AND p.estado = 'Pagado'`,
    [hasta]
  );
  return rows;
}

const formatearCOP = (valor) => {
  const n = Number(valor);
  if (Number.isNaN(n)) return '';
  return '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n) + ' COP';
};

const nombreCompleto = (p) => `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.correo || 'Afiliado';

const fechaLegible = (f) => {
  if (!f) return '';
  const [y, m, d] = String(f).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const renderPlantilla = (pago) => {
  try {
    if (!fs.existsSync(TEMPLATE_PATH)) return null;
    return fs.readFileSync(TEMPLATE_PATH, 'utf8')
      .replace(/\{\{NOMBRE_AFILIADO\}\}/g, nombreCompleto(pago))
      .replace(/\{\{VALOR\}\}/g,           formatearCOP(pago.valor_pagado))
      .replace(/\{\{FECHA_VENCIMIENTO\}\}/g, fechaLegible(pago.fecha_vencimiento))
      .replace(/\{\{ANIO\}\}/g,            String(new Date().getFullYear()));
  } catch (err) {
    console.error('[recordatorioPagos.renderPlantilla]', err.message);
    return null;
  }
};

const textoPlano = (pago) => [
  `Hola ${nombreCompleto(pago)},`,
  ``,
  `Este es un recordatorio de MetaFit: tu mensualidad vence el ${fechaLegible(pago.fecha_vencimiento)}.`,
  `Valor: ${formatearCOP(pago.valor_pagado)}`,
  ``,
  `Pasa por la recepción de Sport Gym Sede 80 para renovar tu plan.`,
  ``,
  `MetaFit · Sport Gym Sede 80 · Bogotá, Colombia`,
].join('\n');

/** Marca que se le recordó hoy a este pago (tabla PAGO_RECORDATORIO). */
async function marcarRecordado(idPago) {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS PAGO_RECORDATORIO (
         id_pago INT PRIMARY KEY,
         fecha_envio DATE NOT NULL,
         INDEX idx_rec_fecha (fecha_envio)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
    const [rows] = await pool.query(
      'SELECT fecha_envio FROM PAGO_RECORDATORIO WHERE id_pago = ?',
      [idPago]
    );
    if (rows[0]?.fecha_envio === hoyISO()) return false;
    await pool.query(
      `INSERT INTO PAGO_RECORDATORIO (id_pago, fecha_envio) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE fecha_envio = VALUES(fecha_envio)`,
      [idPago, hoyISO()]
    );
    return true;
  } catch (err) {
    console.error('[recordatorioPagos.marcarRecordado]', err.message);
    return false;
  }
}

/** Ejecuta una pasada de recordatorios. Devuelve cuántos correos se enviaron. */
async function ejecutarRecordatorios() {
  let enviados = 0;
  try {
    const pagos = await obtenerPagosPorVencer();
    for (const pago of pagos) {
      if (!pago.correo) continue;
      if (!(await marcarRecordado(pago.id_pago))) continue; // ya recordado hoy
      const ok = await enviarCorreo({
        destinatario: pago.correo,
        asunto: `⏰ Recordatorio MetaFit: tu mensualidad vence el ${fechaLegible(pago.fecha_vencimiento)}`,
        html: renderPlantilla(pago),
        text: textoPlano(pago),
      });
      if (ok) enviados++;
    }
    if (enviados > 0) {
      console.log(`[recordatorioPagos] ${enviados} recordatorio(s) enviado(s) — ${hoyISO()}`);
    }
  } catch (err) {
    console.error('[recordatorioPagos] error en ejecución:', err.message);
  }
  return enviados;
}

/** Arranca el cron: cada hora. */
function iniciarCron() {
  cron.schedule('0 * * * *', () => {
    ejecutarRecordatorios().catch((err) =>
      console.error('[recordatorioPagos] cron error:', err.message));
  });
  console.log('✅ Cron de recordatorio de pagos iniciado (cada hora)');
}

module.exports = { iniciarCron, ejecutarRecordatorios };