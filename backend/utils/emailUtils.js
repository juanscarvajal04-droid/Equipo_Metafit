// backend/utils/emailUtils.js
// Validación de correo sin regex para evitar backtracking super-lineal (S8786).
'use strict';

/**
 * Valida un correo con el mismo criterio básico que usaba el proyecto:
 * local@dominio.tld, sin espacios y con un único @.
 * @param {unknown} value
 * @returns {boolean}
 */
function esEmailValido(value) {
  if (typeof value !== 'string') return false;

  const email = value.trim();
  if (!email || /\s/.test(email)) return false;

  const at = email.indexOf('@');
  if (at <= 0 || at !== email.lastIndexOf('@')) return false;

  const dominio = email.slice(at + 1);
  const punto = dominio.lastIndexOf('.');
  return punto > 0 && punto < dominio.length - 1;
}

module.exports = { esEmailValido };
