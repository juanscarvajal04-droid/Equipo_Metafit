// backend/services/bienvenidaService.js
// ─── Correo de bienvenida al crear un afiliado ─────────────────────────
// Plantilla: backend/templates/bienvenida-afiliado.html
// Nunca lanza: el correo es un extra; la creación del afiliado no depende de él.
'use strict';

const fs   = require('fs');
const path = require('path');
const { enviarCorreo } = require('./correoService');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'bienvenida-afiliado.html');

const nombreCompleto = (a) =>
  `${a.nombres || ''} ${a.apellidos || ''}`.trim() || a.correo || 'Afiliado';

const renderPlantilla = (afiliado, contrasenaTemporal) => {
  try {
    if (!fs.existsSync(TEMPLATE_PATH)) return null;
    return fs.readFileSync(TEMPLATE_PATH, 'utf8')
      .replace(/\{\{NOMBRE_AFILIADO\}\}/g, nombreCompleto(afiliado))
      .replace(/\{\{CORREO\}\}/g,          afiliado.correo || '—')
      .replace(/\{\{CONTRASENA\}\}/g,      contrasenaTemporal || 'Usa la contraseña entregada en recepción')
      .replace(/\{\{ANIO\}\}/g,            String(new Date().getFullYear()));
  } catch (err) {
    console.error('[bienvenidaService.renderPlantilla]', err.message);
    return null;
  }
};

const textoPlano = (afiliado, contrasenaTemporal) => {
  const nombre = nombreCompleto(afiliado);
  return [
    `¡Bienvenido a MetaFit, ${nombre}! 🎉`,
    ``,
    `Tu registro como afiliado fue exitoso.`,
    `Tus credenciales de acceso:`,
    `  Correo:     ${afiliado.correo || '—'}`,
    `  Contraseña: ${contrasenaTemporal || 'Usa la contraseña entregada en recepción'}`,
    ``,
    `Portal web: https://metafit-frontend-78x6.onrender.com`,
    ``,
    `MetaFit · Sport Gym Sede 80 · Bogotá, Colombia`,
  ].join('\n');
};

/** Envía el correo de bienvenida. Devuelve true/false (nunca lanza). */
async function enviarCorreoBienvenida(afiliado, contrasenaTemporal) {
  if (!afiliado?.correo) return false;
  const asunto = `¡Bienvenido a MetaFit! Tu cuenta está lista, ${nombreCompleto(afiliado)}`;
  const html = renderPlantilla(afiliado, contrasenaTemporal);
  const text = textoPlano(afiliado, contrasenaTemporal);
  return enviarCorreo({
    destinatario: afiliado.correo,
    asunto,
    html,
    text,
  });
}

module.exports = { enviarCorreoBienvenida };