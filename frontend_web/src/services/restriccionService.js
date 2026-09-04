// ============================================================
// src/services/restriccionService.js — MetaFit Restricciones Service
//
// RESPONSABILIDAD ÚNICA (ISO 25000 - SoC):
// Punto de contacto EXCLUSIVO con la API para el recurso
// /catalogo/restricciones y las restricciones por afiliado
// (/afiliados/:id/restricciones).
//
// Convención de respuestas del backend (mysql2 + Express):
//   GET  → array plano de restricciones
//   POST → { id, message }
//   PUT/PATCH → { message }
//   DELETE → { message }
//
// NOTA: el CRUD del catálogo (create/update/delete) está restringido
// al rol Administrador en el backend (requireAdmin).
// ============================================================

import api from "./api";

// ── 1. DATOS DE DOMINIO ──────────────────────────────────────
// Valores del ENUM RESTRICCION.tipo (backend 01_estructura.sql)
export const TIPOS_RESTRICCION = [
  "Enfermedad",
  "Lesion",
  "Alergia",
  "Medicamento",
  "Otra",
];

export const TIPO_ICONO = {
  Enfermedad: "🏥",
  Lesion: "🦴",
  Alergia: "🤧",
  Medicamento: "💊",
  Otra: "📌",
};

/** Estado inicial del formulario de catálogo. */
export const FORM_RESTRICCION_VACIO = {
  nombre_restriccion: "",
  tipo: "Enfermedad",
  efecto_relevante: "",
};

// ── 2. CATÁLOGO (CRUD, solo Administrador) ───────────────────

/**
 * Obtiene el catálogo completo de restricciones.
 * Accesible para cualquier rol autenticado (GET).
 * @returns {Promise<Array>}
 */
export const fetchRestricciones = async () => {
  const { data } = await api.get("/catalogo/restricciones");
  return data;
};

/**
 * Crea una restricción en el catálogo (solo Administrador).
 * @param {{ nombre_restriccion: string, tipo: string, efecto_relevante?: string }} payload
 * @returns {Promise<{ id: number, message: string }>}
 */
export const crearRestriccion = async (payload) => {
  const { data } = await api.post("/catalogo/restricciones", payload);
  return data;
};

/**
 * Actualiza una restricción del catálogo (solo Administrador).
 * @param {number|string} id
 * @param {{ nombre_restriccion: string, tipo: string, efecto_relevante?: string }} payload
 * @returns {Promise<{ message: string }>}
 */
export const actualizarRestriccion = async (id, payload) => {
  const { data } = await api.put(`/catalogo/restricciones/${id}`, payload);
  return data;
};

/**
 * Elimina una restricción del catálogo (solo Administrador).
 * Fallará con 409 si está referenciada por afiliados/ejercicios/alimentos.
 * @param {number|string} id
 * @returns {Promise<{ message: string }>}
 */
export const eliminarRestriccion = async (id) => {
  const { data } = await api.delete(`/catalogo/restricciones/${id}`);
  return data;
};

// ── 3. RESTRICCIONES POR AFILIADO ────────────────────────────

/**
 * Obtiene las restricciones activas de un afiliado.
 * @param {number|string} afiliadoId
 * @returns {Promise<Array>}
 */
export const fetchRestriccionesPorAfiliado = async (afiliadoId) => {
  const { data } = await api.get(`/afiliados/${afiliadoId}/restricciones`);
  return data;
};

/**
 * Asigna una restricción del catálogo a un afiliado (INSERT IGNORE).
 * @param {number|string} afiliadoId
 * @param {number|string} restriccionId
 * @returns {Promise<{ message: string }>}
 */
export const asignarRestriccion = async (afiliadoId, restriccionId) => {
  const { data } = await api.post(`/afiliados/${afiliadoId}/restricciones`, {
    id_restriccion: restriccionId,
  });
  return data;
};

/**
 * Remueve una restricción de un afiliado.
 * @param {number|string} afiliadoId
 * @param {number|string} restriccionId
 * @returns {Promise<{ message: string }>}
 */
export const removerRestriccion = async (afiliadoId, restriccionId) => {
  const { data } = await api.delete(
    `/afiliados/${afiliadoId}/restricciones/${restriccionId}`
  );
  return data;
};