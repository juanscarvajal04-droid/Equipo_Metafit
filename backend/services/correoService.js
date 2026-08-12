// backend/services/correoService.js
// ─── Envío de correos compartido: API REST Brevo con fallback SMTP ──────
// Nunca lanza excepciones: el correo es un extra, nunca bloquea la operación.
'use strict';

/** Envía un correo. Devuelve true/false. */
async function enviarCorreo({ destinatario, asunto, html, text }) {
  if (!destinatario) return false;

  const from = {
    email: process.env.SMTP_FROM || 'metafit.sistema@gmail.com',
    name: 'MetaFit',
  };

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
      console.error('[correoService] Brevo API:', resApi.status, JSON.stringify(bodyApi));
    } catch (errApi) {
      console.error('[correoService] error Brevo API:', errApi.message);
    }
    return enviarConSmtp(destinatario, asunto, html, text);
  }

  // ── 2) Solo SMTP ──
  return enviarConSmtp(destinatario, asunto, html, text);
}

async function enviarConSmtp(destinatario, asunto, html, text) {
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
    console.error('[correoService] error SMTP:', errSmtp.message);
    return false;
  }
}

module.exports = { enviarCorreo };