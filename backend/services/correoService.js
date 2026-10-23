// backend/services/correoService.js
// ─── Envío de correos compartido: API REST Brevo con fallback SMTP ──────
// Nunca lanza excepciones: el correo es un extra, nunca bloquea la operación.
'use strict';

const { enviarCorreoConProveedores } = require('../utils/mailer');

/** Envía un correo. Devuelve true/false. */
async function enviarCorreo({ destinatario, asunto, html, text }) {
  return enviarCorreoConProveedores({
    destinatario,
    asunto,
    html,
    text,
    logPrefix: 'correoService',
  });
}

module.exports = { enviarCorreo };
