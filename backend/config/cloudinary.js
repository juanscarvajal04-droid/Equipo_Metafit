// config/cloudinary.js
// Configuración centralizada de Cloudinary (fotos de perfil de afiliados).
// 'use strict';

const cloudinary = require('cloudinary').v2;

const configurado = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (configurado) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const FOLDER = 'metafit/afiliados';

/** Verifica la autenticación contra Cloudinary. Log claro en arranque. */
const verificarCredenciales = async () => {
  if (!configurado) {
    console.log('☁️  Cloudinary: sin credenciales — fotos en disco local (uploads/)');
    return false;
  }
  try {
    const res = await cloudinary.api.ping();
    console.log(`☁️  Cloudinary autenticado (${process.env.CLOUDINARY_CLOUD_NAME}) — fotos permanentes`);
    return true;
  } catch (err) {
    const msg = (err && err.error && err.error.message) || (err && err.message) || 'credenciales inválidas';
    console.error(`☁️  Cloudinary: ERROR de autenticación — ${msg}`);
    return false;
  }
};

/**
 * Extrae el public_id de una URL de Cloudinary.
 * Ej: https://res.cloudinary.com/metafit-cloud/image/upload/v1616/metafit/afiliados/abc.jpg
 *     → metafit/afiliados/abc
 */
const publicIdDesdeUrl = (foto) => {
  try {
    const parts = foto.split('/');
    const idx = parts.indexOf('upload');
    if (idx === -1) return null;
    return parts.slice(idx + 1).join('/').split('?')[0].replace(/\.[a-z0-9]+$/i, '');
  } catch (err) {
    console.error('[cloudinary.publicIdDesdeUrl]', err.message);
    return null;
  }
};

module.exports = { cloudinary, configurado, FOLDER, publicIdDesdeUrl, verificarCredenciales };