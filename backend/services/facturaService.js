// backend/services/facturaService.js
// ─── Facturación por correo: factura de pago de membresía ─────────────
// - Lee la plantilla HTML backend/templates/factura-pago.html
// - Reemplaza los placeholders con los datos del pago y del afiliado
// - Envía el correo por API REST Brevo (HTTPS) con fallback a SMTP
// - Nunca lanza: la factura es un extra; el pago queda registrado igual.
'use strict';

const fs   = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'factura-pago.html');

const hoyISO = () => new Date().toISOString().split('T')[0];

/** Formatea un valor como pesos colombianos: $85.000 COP */
const formatearCOP = (valor) => {
  const n = Number(valor);
  if (Number.isNaN(n)) return '$0 COP';
  return '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n) + ' COP';
};

const fechaLegible = (fecha) => {
  if (!fecha) return hoyISO();
  const [y, m, d] = String(fecha).split('T')[0].split('-');
  if (!y || !m || !d) return String(fecha);
  return `${d}/${m}/${y}`;
};

const nombreCompleto = (afiliado) =>
  `${afiliado.nombres || ''} ${afiliado.apellidos || ''}`.trim() || afiliado.correo || 'Afiliado';

/** Renderiza la plantilla HTML de factura. Devuelve null si no puede leerse. */
const renderPlantilla = (datosPago, datosAfiliado) => {
  try {
    if (!fs.existsSync(TEMPLATE_PATH)) return null;
    return fs.readFileSync(TEMPLATE_PATH, 'utf8')
      .replace(/\{\{NOMBRE_AFILIADO\}\}/g, nombreCompleto(datosAfiliado))
      .replace(/\{\{DOCUMENTO\}\}/g,       datosAfiliado.documento || 'N/D')
      .replace(/\{\{CORREO\}\}/g,          datosAfiliado.correo || '—')
      .replace(/\{\{TELEFONO\}\}/g,        datosAfiliado.telefono || '—')
      .replace(/\{\{NUMERO_FACTURA\}\}/g,  `FAC-${new Date().getFullYear()}-${datosPago.id_pago}`)
      .replace(/\{\{FECHA_EMISION\}\}/g,   fechaLegible(hoyISO()))
      .replace(/\{\{FECHA_PAGO\}\}/g,      fechaLegible(datosPago.fecha_pago))
      .replace(/\{\{VALOR_PAGADO\}\}/g,    formatearCOP(datosPago.valor_pagado))
      .replace(/\{\{METODO_PAGO\}\}/g,     datosPago.metodo_pago || 'Efectivo')
      .replace(/\{\{ESTADO_PAGO\}\}/g,     datosPago.estado || 'Pagado')
      .replace(/\{\{ANIO\}\}/g,            String(new Date().getFullYear()));
  } catch (err) {
    console.error('[facturaService.renderPlantilla]', err.message);
    return null;
  }
};

const textoPlano = (datosPago, datosAfiliado) => {
  const nombre = nombreCompleto(datosAfiliado);
  return [
    `FACTURA DE PAGO — MetaFit`,
    `Número de factura: FAC-${new Date().getFullYear()}-${datosPago.id_pago}`,
    `Fecha de emisión: ${fechaLegible(hoyISO())}`,
    ``,
    `Afiliado: ${nombre}`,
    `Documento: ${datosAfiliado.documento || 'N/D'}`,
    `Correo: ${datosAfiliado.correo || '—'}`,
    `Teléfono: ${datosAfiliado.telefono || '—'}`,
    ``,
    `Concepto: Mensualidad Sport Gym Sede 80`,
    `Método de pago: ${datosPago.metodo_pago || 'Efectivo'}`,
    `Fecha del pago: ${fechaLegible(datosPago.fecha_pago)}`,
    `Valor pagado: ${formatearCOP(datosPago.valor_pagado)}`,
    `Estado del pago: ${datosPago.estado || 'Pagado'}`,
    ``,
    `Gracias por tu mensualidad.`,
    `MetaFit · Sport Gym Sede 80 · Calle 80 11-22, Bogotá, Colombia`,
  ].join('\n');
};

/** Envía la factura de un pago. Devuelve true/false (nunca lanza). */
const enviarFacturaPago = async (datosPago, datosAfiliado) => {
  const destinatario = datosAfiliado.correo;
  if (!destinatario) return false;

  const asunto = `Factura de pago - MetaFit - ${nombreCompleto(datosAfiliado)}`;
  const html    = renderPlantilla(datosPago, datosAfiliado);
  const text    = textoPlano(datosPago, datosAfiliado);
  const from    = { email: process.env.SMTP_FROM || 'metafit.sistema@gmail.com', name: 'MetaFit' };

  // ── 1) API REST Brevo (HTTPS) ──
  if (process.env.BREVO_API_KEY) {
    try {
      const resApi = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: from,
          to: [{ email: destinatario }],
          subject: asunto,
          ...(html ? { htmlContent: html, textContent: text } : { textContent: text }),
        }),
      });
      const bodyApi = await resApi.json().catch(() => ({}));
      if (resApi.ok) return true;
      console.error('[facturaService] Brevo API:', resApi.status, JSON.stringify(bodyApi));
    } catch (errApi) {
      console.error('[facturaService] error Brevo API:', errApi.message);
    }
    // fallback SMTP
    return enviarConSmtp(destinatario, asunto, html, text);
  }

  // ── 2) Solo SMTP ──
  return enviarConSmtp(destinatario, asunto, html, text);
};

const enviarConSmtp = async (destinatario, asunto, html, text) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return false;
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
    await transporter.sendMail({
      from: `"MetaFit" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: destinatario,
      subject: asunto,
      text,
      ...(html ? { html } : {}),
    });
    return true;
  } catch (errSmtp) {
    console.error('[facturaService] error SMTP:', errSmtp.message);
    return false;
  }
};

module.exports = { enviarFacturaPago };