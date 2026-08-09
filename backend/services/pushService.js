// backend/services/pushService.js
// Notificaciones push (Expo Push Service — sin SDK, fetch directo):
//   1. Envía a un token específico.
//   2. Envía al usuario dueño de un CICLO (asignación de rutina/dieta).
// Usa USUARIO.push_token (creado por migracionPushToken.js).
'use strict';

const pool = require('../config/db');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Busca el push_token vigente de un usuario (null si no tiene). */
async function getPushToken(idUsuario) {
  const [rows] = await pool.query(
    `SELECT push_token FROM USUARIO
      WHERE id_usuario = ? AND push_token IS NOT NULL AND push_token <> ''`,
    [idUsuario]
  );
  return rows[0]?.push_token || null;
}

/** Envía una notificación push a un token Expo. No lanza errores. */
async function sendPush({ token, title, body, data = {} }) {
  if (!token) return { ok: false, reason: 'sin token' };
  try {
    const resp = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      }),
    });
    const json = await resp.json();
    const status = json?.data?.[0]?.status;
    if (status === 'ok') return { ok: true };
    return { ok: false, reason: status || 'error expo', detalle: json };
  } catch (err) {
    console.error('[pushService] error enviando push:', err.message);
    return { ok: false, reason: err.message };
  }
}

/** Envía push al usuario dueño del ciclo (id_usuario en CICLO). */
async function enviarPushAUsuarioDelCiclo(idCiclo, { title, body, data = {} }) {
  if (!idCiclo) return { ok: false };
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario FROM CICLO WHERE id_ciclo = ? LIMIT 1',
      [idCiclo]
    );
    if (!rows[0]) return { ok: false, reason: 'ciclo no existe' };
    const token = await getPushToken(rows[0].id_usuario);
    if (!token) return { ok: false, reason: 'usuario sin push_token' };
    return sendPush({ token, title, body, data });
  } catch (err) {
    console.error('[pushService] error por ciclo:', err.message);
    return { ok: false };
  }
}

module.exports = { sendPush, getPushToken, enviarPushAUsuarioDelCiclo };