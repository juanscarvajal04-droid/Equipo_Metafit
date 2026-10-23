// backend/services/facturaService.js
// ─── Facturación por correo: factura de pago de membresía ─────────────
// - Lee la plantilla HTML backend/templates/factura-pago.html
// - Reemplaza los placeholders con los datos del pago y del afiliado
// - Envía el correo por API REST Brevo (HTTPS) con fallback a SMTP
// - Nunca lanza: la factura es un extra; el pago queda registrado igual.
'use strict';

const fs   = require('fs');
const path = require('path');
const { enviarCorreoConProveedores } = require('../utils/mailer');

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
    `Concepto: Mensualidad Sport Gym Sede Santa Rosita`,
    `Método de pago: ${datosPago.metodo_pago || 'Efectivo'}`,
    `Fecha del pago: ${fechaLegible(datosPago.fecha_pago)}`,
    `Valor pagado: ${formatearCOP(datosPago.valor_pagado)}`,
    `Estado del pago: ${datosPago.estado || 'Pagado'}`,
    ``,
    `Gracias por tu mensualidad.`,
    `MetaFit · Sport Gym Sede Santa Rosita · Calle 80 11-22, Bogotá, Colombia`,
  ].join('\n');
};

/** Envía la factura de un pago. Devuelve true/false (nunca lanza). */
const enviarFacturaPago = async (datosPago, datosAfiliado) => {
  const destinatario = datosAfiliado.correo;
  if (!destinatario) return false;

  const asunto = `Factura de pago - MetaFit - ${nombreCompleto(datosAfiliado)}`;
  const html    = renderPlantilla(datosPago, datosAfiliado);
  const text    = textoPlano(datosPago, datosAfiliado);

  return enviarCorreoConProveedores({
    destinatario,
    asunto,
    html,
    text,
    logPrefix: 'facturaService',
  });
};

module.exports = { enviarFacturaPago };