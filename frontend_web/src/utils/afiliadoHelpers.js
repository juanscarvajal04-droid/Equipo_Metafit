// frontend_web/src/utils/afiliadoHelpers.js
'use strict';

/**
 * Obtiene el ID único de un objeto de usuario o afiliado de manera compatible.
 */
export const getId = (doc) => {
  if (!doc) return null;
  return doc.id_usuario ?? doc.id_afiliado ?? doc._id ?? doc.id;
};

/**
 * Retorna el nombre completo formateado o un fallback.
 */
export const nombreCompleto = (a) => {
  if (!a) return "Sin nombre";
  return [a.nombres, a.apellidos].filter(Boolean).join(" ") || a.email || a.correo || "Sin nombre";
};

/**
 * Retorna la inicial del nombre o correo para el avatar.
 */
export const inicial = (a) => {
  if (!a) return "?";
  return (a.nombres || a.email || a.correo || "?")[0].toUpperCase();
};

/**
 * Genera un color HSL estable a partir del nombre para el avatar.
 */
export const avatarColor = (nombre = "") => {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
};

/**
 * Retorna el ciclo activo del afiliado.
 */
export const cicloActivo = (a) => {
  if (!a) return null;
  return a.ciclo_activo || null;
};

/**
 * Formatea una fecha ISO o string al formato requerido por los inputs date (YYYY-MM-DD).
 */
export const toDateInput = (dateStr) => {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
};
