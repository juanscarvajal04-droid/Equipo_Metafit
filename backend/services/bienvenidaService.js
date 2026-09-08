// backend/services/bienvenidaService.js
// ─── Correo de bienvenida al crear un afiliado ─────────────────────────
// Plantilla: backend/templates/bienvenida-afiliado.html
// Placeholders: {{NOMBRE}}, {{CORREO}}, {{PASSWORD_TEMPORAL}}, {{URL_APK}}
// Nunca lanza: el correo es un extra; la creación del afiliado no depende de él.
'use strict';

const fs   = require('fs');
const path = require('path');
const { enviarCorreo } = require('./correoService');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'bienvenida-afiliado.html');

// Configuración del correo (sobreescribible por variables de entorno).
const ASUNTO = 'Bienvenido a MetaFit — Sport Gym Sede Santa Rosita';
const URL_APK = process.env.URL_APK
  || 'https://metafit-frontend-78x6.onrender.com/app/metafit.apk';
// Fallback de contraseña temporal si el backend no genera ninguna (2.5).
const PASSWORD_FALLBACK = 'MetaFit2025!';

const nombreCompleto = (a) =>
  `${a.nombres || ''} ${a.apellidos || ''}`.trim() || a.correo || 'Afiliado';

const renderPlantilla = (afiliado, contrasenaTemporal) => {
  try {
    if (!fs.existsSync(TEMPLATE_PATH)) return null;
    const passwordTemporal = contrasenaTemporal || PASSWORD_FALLBACK;
    let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    // Placeholders nuevos
    html = html
      .replace(/\{\{NOMBRE\}\}/g,           nombreCompleto(afiliado))
      .replace(/\{\{CORREO\}\}/g,           afiliado.correo || '—')
      .replace(/\{\{PASSWORD_TEMPORAL\}\}/g, passwordTemporal)
      .replace(/\{\{URL_APK\}\}/g,           URL_APK);
    // Backward-compat con placeholders antiguos, por si alguna copia vieja usa fire-and-forget
    html = html
      .replace(/\{\{NOMBRE_AFILIADO\}\}/g, nombreCompleto(afiliado))
      .replace(/\{\{CONTRASENA\}\}/g,       passwordTemporal)
      .replace(/\{\{ANIO\}\}/g,             String(new Date().getFullYear()));
    return html;
  } catch (err) {
    console.error('[bienvenidaService.renderPlantilla]', err.message);
    return null;
  }
};

const textoPlano = (afiliado, contrasenaTemporal) => {
  const passwordTemporal = contrasenaTemporal || PASSWORD_FALLBACK;
  const nombre = nombreCompleto(afiliado);
  return [
    `¡Bienvenido a Sport Gym Sede Santa Rosita, ${nombre}!`,
    '',
    'Tu registro en MetaFit fue exitoso. Tus credenciales de acceso:',
    `  Usuario:     ${afiliado.correo || '—'}`,
    `  Contraseña:  ${passwordTemporal}`,
    '',
    `Descarga la app: ${URL_APK}`,
    'También podés descargar la app desde la web de MetaFit.',
    '',
    'Sport Gym Sede Santa Rosita · Sistema de gestión de entrenamientos MetaFit',
  ].join('\n');
};

/** Envía el correo de bienvenida. Devuelve true/false (nunca lanza). */
async function enviarCorreoBienvenida(afiliado, contrasenaTemporal) {
  if (!afiliado?.correo) return false;
  const html = renderPlantilla(afiliado, contrasenaTemporal);
  const text = textoPlano(afiliado, contrasenaTemporal);
  return enviarCorreo({
    destinatario: afiliado.correo,
    asunto: ASUNTO,
    html,
    text,
  });
}

module.exports = { enviarCorreoBienvenida };